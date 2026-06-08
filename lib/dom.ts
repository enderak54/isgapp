export function safeRemoveClass(el: Element, ...classes: string[]): void {
  const valid = classes.filter(Boolean);
  if (valid.length > 0) el.classList.remove(...valid);
}

export function safeAddClass(el: Element, ...classes: string[]): void {
  for (const c of classes) {
    if (c && c.trim()) el.classList.add(c.trim());
  }
}

export function safeSetTheme(el: Element, theme: { mode?: string; color?: string; font?: string; size?: string }): void {
  const colorClasses = ["theme-dark", ...["blue", "green", "purple", "orange", "teal", "pink", "red"].map(c => "theme-" + c)];
  const fontClasses = ["font-serif", "font-mono", "font-arial", "font-tahoma", "font-verdana", "font-georgia", "font-trebuchet"];
  const sizeClasses = ["size-small", "size-normal", "size-large", "size-xlarge"];
  safeRemoveClass(el, "theme-dark", ...colorClasses, ...fontClasses, ...sizeClasses);
  if (theme.mode === "dark") safeAddClass(el, "theme-dark");
  if (theme.color) safeAddClass(el, "theme-" + theme.color);
  if (theme.font) safeAddClass(el, "font-" + theme.font);
  if (theme.size && theme.size !== "normal") safeAddClass(el, "size-" + theme.size);
}
