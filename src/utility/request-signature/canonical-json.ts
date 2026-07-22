/**
 * Recursively sorts keys in an object to produce deterministic, canonical JSON.
 */
export function canonicalJsonStringify(data: any): string {
  if (data === undefined || data === null) return '';
  if (typeof data !== 'object') return JSON.stringify(data);
  if (Array.isArray(data)) {
    return '[' + data.map((item) => canonicalJsonStringify(item)).join(',') + ']';
  }

  const sortedKeys = Object.keys(data).sort();
  const parts: string[] = [];
  for (const key of sortedKeys) {
    if (data[key] !== undefined) {
      parts.push(JSON.stringify(key) + ':' + canonicalJsonStringify(data[key]));
    }
  }
  return '{' + parts.join(',') + '}';
}
