import type { FieldType, SchemaField, DetectedSchema } from '../types';

// ── Infer type of a single value ──────────────────────────
export function inferType(value: unknown): FieldType {
  if (value === null || value === undefined || value === '') return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'object' && Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';

  const str = String(value).trim();

  // Number
  if (str !== '' && !isNaN(Number(str))) return 'number';

  // Boolean
  if (/^(true|false|sim|não|yes|no|1|0)$/i.test(str)) return 'boolean';

  // Date — common BR/ISO formats
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(str)) return 'date';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) return 'date';
  if (!isNaN(Date.parse(str)) && /\d{4}/.test(str)) return 'date';

  return 'string';
}

// ── Coerce a string value to its inferred type ────────────
export function coerceValue(value: unknown, forceType?: FieldType): unknown {
  if (value === null || value === undefined || value === '') return null;

  const type = forceType || inferType(value);
  const str = String(value).trim();

  switch (type) {
    case 'null':    return null;
    case 'number':  return str !== '' && !isNaN(Number(str)) ? Number(str) : value;
    case 'boolean': return /^(true|sim|yes|1)$/i.test(str);
    case 'date': {
      // Handle DD/MM/YYYY → ISO
      const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (brMatch) return new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`).toISOString().split('T')[0];
      const d = new Date(str);
      return isNaN(d.getTime()) ? value : d.toISOString().split('T')[0];
    }
    default: return str;
  }
}

// ── Detect schema from array of objects ───────────────────
export function detectSchema(rows: unknown[]): DetectedSchema {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { fields: [], rowCount: 0, hasInconsistencies: false, warnings: [] };
  }

  const warnings: string[] = [];
  const fieldStats = new Map<string, { types: Map<FieldType, number>; nullable: boolean; sample?: unknown }>();

  // Collect type observations across all rows
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    for (const [key, val] of Object.entries(row as Record<string, unknown>)) {
      if (!fieldStats.has(key)) {
        fieldStats.set(key, { types: new Map(), nullable: false });
      }
      const stat = fieldStats.get(key)!;
      const type = inferType(val);
      stat.types.set(type, (stat.types.get(type) || 0) + 1);
      if (type === 'null') stat.nullable = true;
      if (val !== null && val !== undefined && val !== '' && !stat.sample) {
        stat.sample = val;
      }
    }
  }

  const fields: SchemaField[] = [];
  let hasInconsistencies = false;

  for (const [key, stat] of fieldStats) {
    // Find dominant type (excluding null)
    const nonNull = new Map([...stat.types].filter(([t]) => t !== 'null'));
    const dominant = [...nonNull.entries()].sort((a, b) => b[1] - a[1])[0];
    const type: FieldType = dominant ? dominant[0] : 'null';

    // Check inconsistency — multiple non-null types
    if (nonNull.size > 1) {
      hasInconsistencies = true;
      const types = [...nonNull.keys()].join(', ');
      warnings.push(`Campo "${key}" tem tipos inconsistentes: ${types}. Usando "${type}".`);
    }

    fields.push({ key, type, nullable: stat.nullable, sample: stat.sample });
  }

  return { fields, rowCount: rows.length, hasInconsistencies, warnings };
}

// ── Validate JSON input ────────────────────────────────────
export function validateJsonInput(data: unknown): { valid: boolean; error?: string; rows?: unknown[] } {
  if (data === null || data === undefined) {
    return { valid: false, error: 'Dados ausentes' };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return { valid: false, error: 'Array vazio' };
    const firstObj = data.find(r => typeof r === 'object' && r !== null);
    if (!firstObj) return { valid: false, error: 'Array deve conter objetos' };
    return { valid: true, rows: data };
  }

  if (typeof data === 'object') {
    // Object of arrays (multiple sheets)
    return { valid: true, rows: [data] };
  }

  return { valid: false, error: 'JSON deve ser um array de objetos ou um objeto com arrays' };
}

// ── Sanitize field key (prevent formula injection) ────────
export function sanitizeCell(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  // Prevent Excel formula injection
  if (/^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}
