// Module titles are authored as "বাংলা (English)". Notification text is
// Bengali-only, so keep just the part before the trailing parenthetical.
export function bengaliTitle(title: string) {
  const trimmed = title.trim();
  const open = trimmed.lastIndexOf('(');
  if (open <= 0 || !trimmed.endsWith(')')) return trimmed;
  return trimmed.slice(0, open).trim() || trimmed;
}
