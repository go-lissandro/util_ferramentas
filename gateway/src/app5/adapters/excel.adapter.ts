import * as XLSX from 'xlsx';
import type {
  JsonToExcelOptions, JsonToExcelResult, ExcelToJsonResult,
  StyleConfig, MappingConfig, FieldMapping,
} from '../types';
import { detectSchema, coerceValue, sanitizeCell } from '../services/schema.service';

const DEFAULT_STYLE: StyleConfig = {
  headerBackground: '#6c63ff',
  headerForeground: '#ffffff',
  headerBold:       true,
  headerFontSize:   11,
  autoWidth:        true,
  freezeHeader:     true,
};

// ── Apply column mapping to a row ──────────────────────────
function applyMapping(row: Record<string, unknown>, mapping: MappingConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const m of mapping.fields) {
    const val = Object.prototype.hasOwnProperty.call(row, m.jsonKey)
      ? row[m.jsonKey]
      : (m.defaultValue ?? null);
    result[m.excelHeader] = m.type ? coerceValue(val, m.type) : val;
  }
  return result;
}

// ── Reverse mapping (excel header → json key) ─────────────
function reverseMapping(row: Record<string, unknown>, mapping: MappingConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const m of mapping.fields) {
    if (Object.prototype.hasOwnProperty.call(row, m.excelHeader)) {
      result[m.jsonKey] = m.type ? coerceValue(row[m.excelHeader], m.type) : row[m.excelHeader];
    }
  }
  return result;
}

// ── Compute auto column widths ─────────────────────────────
function computeColWidths(headers: string[], rows: Record<string, unknown>[]): XLSX.ColInfo[] {
  return headers.map(h => {
    const maxData = rows.reduce((max, row) => {
      const len = String(row[h] ?? '').length;
      return len > max ? len : max;
    }, 0);
    return { width: Math.min(Math.max(h.length + 2, maxData + 2, 8), 60) };
  });
}

// ── Build a single worksheet ───────────────────────────────
function buildWorksheet(
  rows: unknown[],
  mapping?: MappingConfig,
  style: StyleConfig = DEFAULT_STYLE
): XLSX.WorkSheet {
  if (!Array.isArray(rows) || rows.length === 0) {
    return XLSX.utils.aoa_to_sheet([['Sem dados']]);
  }

  // Apply mapping or use raw keys
  const mapped: Record<string, unknown>[] = rows.map(r => {
    const obj = (typeof r === 'object' && r !== null ? r : { value: r }) as Record<string, unknown>;
    if (mapping && mapping.fields.length > 0) return applyMapping(obj, mapping);
    // Sanitize cells
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) clean[k] = sanitizeCell(v);
    return clean;
  });

  const headers = Object.keys(mapped[0]);

  // Build AOA (array of arrays) for full control
  const aoa: unknown[][] = [headers.map(h => sanitizeCell(h))];
  for (const row of mapped) {
    aoa.push(headers.map(h => {
      const v = row[h];
      if (v instanceof Date) return v;
      if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
      return v ?? '';
    }));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto width
  if (style.autoWidth !== false) {
    ws['!cols'] = computeColWidths(headers, mapped);
  }

  // Freeze header row
  if (style.freezeHeader !== false) {
    (ws['!freeze'] as unknown) = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
  }

  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: {
        bold:  style.headerBold !== false,
        color: { rgb: (style.headerForeground || '#ffffff').replace('#', '') },
        sz:    style.headerFontSize || 11,
      },
      fill: {
        patternType: 'solid',
        fgColor: { rgb: (style.headerBackground || '#6c63ff').replace('#', '') },
      },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Alternate row colors
  if (style.alternateRowColor) {
    const altRgb = style.alternateRowColor.replace('#', '');
    for (let row = 2; row <= range.e.r + 1; row += 2) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[addr]) continue;
        ws[addr].s = { ...(ws[addr].s || {}), fill: { patternType: 'solid', fgColor: { rgb: altRgb } } };
      }
    }
  }

  return ws;
}

// ── JSON → Excel Buffer ────────────────────────────────────
export function jsonToExcel(options: JsonToExcelOptions): JsonToExcelResult {
  const start = Date.now();
  const warnings: string[] = [];
  let totalRows = 0;

  try {
    const wb = XLSX.utils.book_new();

    // Multiple sheets
    if (options.sheets && Object.keys(options.sheets).length > 0) {
      for (const [sheetName, rows] of Object.entries(options.sheets)) {
        if (!Array.isArray(rows)) {
          warnings.push(`Sheet "${sheetName}" ignorada — deve ser um array`);
          continue;
        }
        const ws = buildWorksheet(rows, options.mapping, options.style);
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
        totalRows += rows.length;
      }
    } else {
      // Single sheet
      const rows = options.data || [];
      const sheetName = options.sheetName || 'Dados';
      const ws = buildWorksheet(rows, options.mapping, options.style);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      totalRows = rows.length;
    }

    if (wb.SheetNames.length === 0) {
      return { success: false, warnings: ['Nenhum dado válido para exportar'], stats: { rowsProcessed: 0, durationMs: 0 } };
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', bookSST: false }) as Buffer;

    return {
      success: true,
      data: buffer,
      warnings,
      stats: { rowsProcessed: totalRows, durationMs: Date.now() - start, outputSizeBytes: buffer.length },
    };
  } catch (err) {
    return { success: false, warnings, stats: { rowsProcessed: 0, durationMs: Date.now() - start }, data: undefined };
  }
}

// ── Excel/XLSX → JSON ─────────────────────────────────────
export function excelToJson(
  buffer: Buffer,
  options: { sheetName?: string; allSheets?: boolean; mapping?: MappingConfig; headerRow?: number; skipEmptyRows?: boolean; preserveTypes?: boolean }
): ExcelToJsonResult {
  const start = Date.now();
  const warnings: string[] = [];

  try {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: true });

    if (!wb.SheetNames.length) {
      return { success: false, warnings: ['Arquivo Excel sem abas'], stats: { rowsProcessed: 0, durationMs: 0 } };
    }

    const parseSheet = (ws: XLSX.WorkSheet, name: string): unknown[] => {
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: null,
        raw: false, // get formatted strings
        header: options.headerRow !== undefined ? 1 : undefined,
      });

      if (raw.length === 0) {
        warnings.push(`Aba "${name}" está vazia`);
        return [];
      }

      return raw.map((row, i) => {
        let result = { ...row };

        // Type coercion
        if (options.preserveTypes !== false) {
          for (const [k, v] of Object.entries(result)) {
            result[k] = coerceValue(v);
          }
        }

        // Apply reverse mapping
        if (options.mapping && options.mapping.fields.length > 0) {
          result = reverseMapping(result, options.mapping) as Record<string, unknown>;
        }

        // Skip empty rows
        if (options.skipEmptyRows) {
          const isEmpty = Object.values(result).every(v => v === null || v === '');
          if (isEmpty) return null;
        }

        return result;
      }).filter(Boolean);
    };

    if (options.allSheets) {
      const result: Record<string, unknown[]> = {};
      let total = 0;
      for (const name of wb.SheetNames) {
        result[name] = parseSheet(wb.Sheets[name], name);
        total += result[name].length;
      }
      const schema = detectSchema(Object.values(result)[0] || []);
      return { success: true, data: result, schema, warnings: [...warnings, ...schema.warnings], stats: { rowsProcessed: total, durationMs: Date.now() - start } };
    }

    const sheetName = options.sheetName || wb.SheetNames[0];
    if (!wb.Sheets[sheetName]) {
      warnings.push(`Aba "${sheetName}" não encontrada. Usando primeira aba.`);
    }
    const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
    const rows = parseSheet(ws, sheetName);
    const schema = detectSchema(rows);

    return {
      success: true,
      data: rows,
      schema,
      warnings: [...warnings, ...schema.warnings],
      stats: { rowsProcessed: rows.length, durationMs: Date.now() - start },
    };
  } catch (err) {
    return { success: false, warnings: [(err as Error).message], stats: { rowsProcessed: 0, durationMs: Date.now() - start } };
  }
}
