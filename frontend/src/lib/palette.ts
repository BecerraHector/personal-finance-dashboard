// Paleta categórica validada para daltonismo (CVD-safe), en su orden canónico.
// El hex claro es el valor canónico que se guarda en la base de datos; el modo
// oscuro usa el mismo tono re-escalonado para la superficie oscura.
export const PALETTE = [
  "#2a78d6",
  "#008300",
  "#e87ba4",
  "#eda100",
  "#1baf7a",
  "#eb6834",
  "#4a3aa7",
  "#e34948",
];

const DARK_STEP: Record<string, string> = {
  "#2a78d6": "#3987e5",
  "#008300": "#008300",
  "#e87ba4": "#d55181",
  "#eda100": "#c98500",
  "#1baf7a": "#199e70",
  "#eb6834": "#d95926",
  "#4a3aa7": "#9085e9",
  "#e34948": "#e66767",
};

export function categoryColor(hex: string, dark: boolean): string {
  return dark ? (DARK_STEP[hex] ?? hex) : hex;
}
