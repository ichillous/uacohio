export function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  const neutralized = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
  return /[",\n\r]/.test(neutralized) ? `"${neutralized.replaceAll('"', '""')}"` : neutralized;
}
