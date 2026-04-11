// ─────────────────────────────────────────────────────────────────────────────
// App5 — JSON ↔ Excel/CSV Converter
// Domain types — shared between all layers
// ─────────────────────────────────────────────────────────────────────────────

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'null' | 'object' | 'array';

export interface SchemaField {
  key: string;
  type: FieldType;
  nullable: boolean;
  sample?: unknown;
}

export interface DetectedSchema {
  fields: SchemaField[];
  rowCount: number;
  hasInconsistencies: boolean;
  warnings: string[];
}

// ── Custom mapping config ─────────────────────────────────
export interface FieldMapping {
  jsonKey: string;       // key in the JSON object
  excelHeader: string;   // column header in Excel/CSV
  type?: FieldType;      // force a specific type
  format?: string;       // date format e.g. 'dd/MM/yyyy'
  defaultValue?: unknown;
}

export interface MappingConfig {
  fields: FieldMapping[];
  sheetName?: string;
  dateFormat?: string;   // default: 'yyyy-MM-dd'
  locale?: string;       // 'pt-BR' | 'en-US'
}

// ── Excel styling config ──────────────────────────────────
export interface StyleConfig {
  headerBackground?: string;    // hex e.g. '#6c63ff'
  headerForeground?: string;    // hex e.g. '#ffffff'
  headerBold?: boolean;
  headerFontSize?: number;
  autoWidth?: boolean;
  freezeHeader?: boolean;
  alternateRowColor?: string;   // hex for odd rows
  dateFormat?: string;          // Excel date number format
}

// ── Conversion options ────────────────────────────────────
export interface JsonToExcelOptions {
  sheets?: Record<string, unknown[]>;  // multiple sheets: { 'Sheet1': [...], 'Sheet2': [...] }
  data?: unknown[];                    // single sheet
  sheetName?: string;
  mapping?: MappingConfig;
  style?: StyleConfig;
  includeIndex?: boolean;
}

export interface ExcelToJsonOptions {
  sheetName?: string;    // specific sheet, default: first
  allSheets?: boolean;   // return all sheets as { sheetName: rows[] }
  mapping?: MappingConfig;
  headerRow?: number;    // 0-indexed, default: 0
  dataStartRow?: number; // 0-indexed, default: 1
  preserveTypes?: boolean;
  trimStrings?: boolean;
  skipEmptyRows?: boolean;
}

export interface CsvToJsonOptions {
  delimiter?: string;    // default: ','
  headerRow?: boolean;   // default: true
  mapping?: MappingConfig;
  preserveTypes?: boolean;
  trimStrings?: boolean;
}

// ── Results ────────────────────────────────────────────────
export interface ConversionResult<T> {
  success: boolean;
  data?: T;
  schema?: DetectedSchema;
  warnings: string[];
  stats: {
    rowsProcessed: number;
    durationMs: number;
    inputSizeBytes?: number;
    outputSizeBytes?: number;
  };
}

export type JsonToExcelResult  = ConversionResult<Buffer>;
export type ExcelToJsonResult  = ConversionResult<unknown[] | Record<string, unknown[]>>;
export type CsvToJsonResult    = ConversionResult<unknown[]>;
export type JsonToCsvResult    = ConversionResult<string>;

// ── API request/response shapes ───────────────────────────
export interface ConvertApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  schema?: DetectedSchema;
  warnings: string[];
  stats: ConversionResult<T>['stats'];
  error?: string;
}
