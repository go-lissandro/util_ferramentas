import { Router, Request, Response } from 'express';
import multer from 'multer';
import { jsonToExcel, excelToJson } from './adapters/excel.adapter';
import { csvToJson, jsonToCsv } from './adapters/csv.adapter';
import { detectSchema, validateJsonInput } from './services/schema.service';
import type { JsonToExcelOptions, MappingConfig, StyleConfig } from './types';
import { logger } from '../utils/logger';
import { createRateLimiter } from './utils/rate-limiter';

export const converterRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/plain',
      'application/json',
    ];
    const allowedExt = /\.(xlsx|xls|csv|json)$/i;
    if (allowed.includes(file.mimetype) || allowedExt.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use .xlsx, .xls, .csv ou .json'));
    }
  },
});

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });
converterRouter.use(limiter);

// ── GET /api/converter/health ──────────────────────────────
converterRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ available: true, version: '1.0.0', formats: ['xlsx', 'csv', 'json'] });
});

// ── POST /api/converter/json-to-excel ─────────────────────
// Body: { data: [...] | sheets: {...}, sheetName?, mapping?, style? }
converterRouter.post('/json-to-excel', async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const { data, sheets, sheetName, mapping, style, includeIndex } = req.body as JsonToExcelOptions & { data?: unknown };

    // Validate input
    const source = sheets || data;
    const { valid, error, rows } = validateJsonInput(source);
    if (!valid) return res.status(400).json({ success: false, error, warnings: [], stats: { rowsProcessed: 0, durationMs: 0 } });

    const options: JsonToExcelOptions = {
      data: Array.isArray(rows) ? rows as unknown[] : undefined,
      sheets: !Array.isArray(rows) ? rows as Record<string, unknown[]> | undefined : undefined,
      sheetName: sheetName || 'Dados',
      mapping: mapping as MappingConfig | undefined,
      style: (style as StyleConfig | undefined) || {
        headerBackground: '#6c63ff',
        headerForeground: '#ffffff',
        headerBold: true,
        autoWidth: true,
        freezeHeader: true,
        alternateRowColor: '#f8f8ff',
      },
      includeIndex: includeIndex as boolean | undefined,
    };

    const result = jsonToExcel(options);
    if (!result.success || !result.data) {
      return res.status(422).json({ success: false, error: 'Falha na conversão', warnings: result.warnings, stats: result.stats });
    }

    logger.info(`json-to-excel: ${result.stats.rowsProcessed} rows, ${result.stats.outputSizeBytes} bytes, ${Date.now() - start}ms`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.xlsx"`);
    res.setHeader('Content-Length', result.data.length);
    res.setHeader('X-Warnings', JSON.stringify(result.warnings));
    return res.send(result.data);
  } catch (err) {
    logger.error('json-to-excel error: ' + (err as Error).message);
    return res.status(500).json({ success: false, error: (err as Error).message, warnings: [], stats: { rowsProcessed: 0, durationMs: Date.now() - start } });
  }
});

// ── POST /api/converter/json-to-csv ───────────────────────
converterRouter.post('/json-to-csv', async (req: Request, res: Response) => {
  try {
    const { data, mapping, delimiter } = req.body as { data: unknown; mapping?: MappingConfig; delimiter?: string };
    const { valid, error, rows } = validateJsonInput(data);
    if (!valid) return res.status(400).json({ success: false, error, warnings: [] });

    const result = jsonToCsv(rows as unknown[], { delimiter, mapping: mapping as { fields: { jsonKey: string; excelHeader: string }[] } | undefined });
    if (!result.success) return res.status(422).json({ success: false, error: result.warnings[0], warnings: result.warnings });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`);
    res.setHeader('Content-Length', Buffer.byteLength(result.data!));
    return res.send(result.data);
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/converter/excel-to-json ─────────────────────
converterRouter.post('/excel-to-json', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Arquivo não enviado' });

    const opts = req.body.options ? JSON.parse(req.body.options) : {};
    const result = excelToJson(req.file.buffer, {
      sheetName:    opts.sheetName,
      allSheets:    opts.allSheets === true || opts.allSheets === 'true',
      mapping:      opts.mapping,
      headerRow:    opts.headerRow !== undefined ? Number(opts.headerRow) : 0,
      skipEmptyRows: opts.skipEmptyRows !== false,
      preserveTypes: opts.preserveTypes !== false,
    });

    if (!result.success) return res.status(422).json({ success: false, error: result.warnings[0], warnings: result.warnings });

    logger.info(`excel-to-json: ${result.stats.rowsProcessed} rows, ${req.file.size} bytes in`);
    return res.json({ success: true, data: result.data, schema: result.schema, warnings: result.warnings, stats: result.stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/converter/csv-to-json ───────────────────────
converterRouter.post('/csv-to-json', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let content: string;
    if (req.file) {
      content = req.file.buffer.toString('utf8');
    } else if (req.body.content) {
      content = String(req.body.content);
    } else {
      return res.status(400).json({ success: false, error: 'Envie um arquivo CSV ou o campo "content"' });
    }

    const opts = req.body.options ? JSON.parse(req.body.options) : {};
    const result = csvToJson(content, {
      delimiter:    opts.delimiter,
      headerRow:    opts.headerRow !== false,
      preserveTypes: opts.preserveTypes !== false,
      trimStrings:  opts.trimStrings !== false,
      mapping:      opts.mapping,
    });

    if (!result.success) return res.status(422).json({ success: false, error: result.warnings[0], warnings: result.warnings });

    return res.json({ success: true, data: result.data, schema: result.schema, warnings: result.warnings, stats: result.stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/converter/detect-schema ─────────────────────
converterRouter.post('/detect-schema', (req: Request, res: Response) => {
  try {
    const { data } = req.body as { data: unknown };
    const { valid, error, rows } = validateJsonInput(data);
    if (!valid) return res.status(400).json({ success: false, error });

    const schema = detectSchema(rows as unknown[]);
    return res.json({ success: true, schema });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/converter/preview ───────────────────────────
// Returns first N rows for preview without full conversion
converterRouter.post('/preview', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.body.limit || '20'), 100);

    if (req.file) {
      const ext = req.file.originalname.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        const result = excelToJson(req.file.buffer, { preserveTypes: true, skipEmptyRows: true });
        if (!result.success) return res.status(422).json({ success: false, error: result.warnings[0] });
        const rows = Array.isArray(result.data) ? result.data.slice(0, limit) : result.data;
        return res.json({ success: true, preview: rows, schema: result.schema, total: result.stats.rowsProcessed, warnings: result.warnings });
      }

      if (ext === 'csv') {
        const content = req.file.buffer.toString('utf8');
        const result = csvToJson(content, { preserveTypes: true });
        if (!result.success) return res.status(422).json({ success: false, error: result.warnings[0] });
        return res.json({ success: true, preview: (result.data as unknown[]).slice(0, limit), schema: result.schema, total: result.stats.rowsProcessed, warnings: result.warnings });
      }

      if (ext === 'json') {
        const data = JSON.parse(req.file.buffer.toString('utf8'));
        const { valid, error, rows } = validateJsonInput(data);
        if (!valid) return res.status(400).json({ success: false, error });
        const schema = detectSchema(rows as unknown[]);
        return res.json({ success: true, preview: (rows as unknown[]).slice(0, limit), schema, total: (rows as unknown[]).length, warnings: schema.warnings });
      }
    }

    if (req.body.data) {
      const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      const { valid, error, rows } = validateJsonInput(data);
      if (!valid) return res.status(400).json({ success: false, error });
      const schema = detectSchema(rows as unknown[]);
      return res.json({ success: true, preview: (rows as unknown[]).slice(0, limit), schema, total: (rows as unknown[]).length, warnings: schema.warnings });
    }

    return res.status(400).json({ success: false, error: 'Envie um arquivo ou campo "data"' });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});
