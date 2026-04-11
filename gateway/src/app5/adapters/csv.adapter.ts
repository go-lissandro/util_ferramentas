import type { CsvToJsonOptions, CsvToJsonResult, JsonToCsvResult } from '../types';
import { detectSchema, coerceValue, sanitizeCell } from '../services/schema.service';

// ── JSON → CSV string ──────────────────────────────────────
export function jsonToCsv(
  rows: unknown[],
  options: { delimiter?: string; mapping?: { fields: { jsonKey: string; excelHeader: string }[] } } = {}
): JsonToCsvResult {
  const start = Date.now();
  const warnings: string[] = [];
  const delim = options.delimiter || ',';

  try {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, warnings: ['Array vazio'], stats: { rowsProcessed: 0, durationMs: 0 } };
    }

    const firstObj = rows.find(r => typeof r === 'object' && r !== null) as Record<string, unknown> | undefined;
    if (!firstObj) return { success: false, warnings: ['Sem objetos válidos'], stats: { rowsProcessed: 0, durationMs: 0 } };

    // Determine headers
    let headers: string[];
    let keyMap: Record<string, string> = {};

    if (options.mapping?.fields?.length) {
      headers = options.mapping.fields.map(f => f.excelHeader);
      keyMap = Object.fromEntries(options.mapping.fields.map(f => [f.excelHeader, f.jsonKey]));
    } else {
      headers = Object.keys(firstObj);
      keyMap = Object.fromEntries(headers.map(h => [h, h]));
    }

    const escape = (v: unknown): string => {
      const s = v === null || v === undefined ? '' : String(sanitizeCell(v));
      if (s.includes(delim) || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines: string[] = [headers.map(escape).join(delim)];

    for (const row of rows) {
      if (typeof row !== 'object' || row === null) continue;
      const obj = row as Record<string, unknown>;
      lines.push(headers.map(h => escape(obj[keyMap[h]])).join(delim));
    }

    const csv = lines.join('\n');
    return {
      success: true,
      data: csv,
      warnings,
      stats: { rowsProcessed: rows.length, durationMs: Date.now() - start, outputSizeBytes: Buffer.byteLength(csv) },
    };
  } catch (err) {
    return { success: false, warnings: [(err as Error).message], stats: { rowsProcessed: 0, durationMs: Date.now() - start } };
  }
}

// ── CSV → JSON ─────────────────────────────────────────────
export function csvToJson(content: string, options: CsvToJsonOptions = {}): CsvToJsonResult {
  const start = Date.now();
  const warnings: string[] = [];
  const delim = options.delimiter || detectDelimiter(content);

  try {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) return { success: false, warnings: ['CSV vazio'], stats: { rowsProcessed: 0, durationMs: 0 } };

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === delim && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result;
    };

    const headerRow = options.headerRow !== false;
    const headers = headerRow ? parseRow(lines[0]) : lines[0].split(delim).map((_, i) => `col_${i}`);
    const dataLines = headerRow ? lines.slice(1) : lines;

    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < dataLines.length; i++) {
      const vals = parseRow(dataLines[i]);
      if (vals.length === 0 || vals.every(v => v.trim() === '')) continue;

      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        const raw = vals[idx]?.trim() ?? null;
        const key = options.mapping?.fields?.find(f => f.excelHeader === h)?.jsonKey || h;
        obj[key] = options.preserveTypes !== false ? coerceValue(raw) : (options.trimStrings !== false ? raw?.trim() ?? null : raw);
      });
      rows.push(obj);
    }

    if (rows.length === 0) {
      warnings.push('CSV sem linhas de dados');
    }

    const schema = detectSchema(rows);
    return {
      success: true,
      data: rows,
      schema,
      warnings: [...warnings, ...schema.warnings],
      stats: { rowsProcessed: rows.length, durationMs: Date.now() - start, inputSizeBytes: Buffer.byteLength(content) },
    };
  } catch (err) {
    return { success: false, warnings: [(err as Error).message], stats: { rowsProcessed: 0, durationMs: Date.now() - start } };
  }
}

function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] || '';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch as keyof typeof counts]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
