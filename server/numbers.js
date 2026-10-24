export function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;
  let text = value.replace(/[^0-9,.-]/g, '');
  if (text.includes(',') && text.includes('.')) {
    // The last separator is decimal: 1.234,56 or 1,234.56.
    text = text.lastIndexOf(',') > text.lastIndexOf('.')
      ? text.replaceAll('.', '').replace(',', '.')
      : text.replaceAll(',', '');
  } else {
    text = text.replace(',', '.');
  }
  if (!text) return fallback;
  const number = Number(text);
  return Number.isFinite(number) ? number : fallback;
}
