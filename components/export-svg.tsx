import { DiagramContent, PALETTES, type Theme } from "@/components/diagram-svg";
import type { Layout } from "@/lib/compose/layout";

// No react-dom/server here: the opt-in /api/svg route imports this, and Next forbids that import in server code.
export const ATTRIBUTION = "Made with compviz · compviz.a2coder.dev";
export const FONT = `"JetBrains Mono", monospace`;
export const FOOTER = 28;
export const MIN_W = ATTRIBUTION.length * 6 + 48;

/** The standalone Export: the whole Diagram at 1x, a filled background and the Attribution. */
export function ExportSvg({ layout, theme, fontCss }: { layout: Layout; theme: Theme; fontCss?: string }) {
  const c = PALETTES[theme];
  const width = Math.max(layout.width, MIN_W);
  const height = layout.height + FOOTER;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fontCss && <style>{fontCss}</style>}
      <rect width={width} height={height} fill={c.bg} />
      <g transform={`translate(${(width - layout.width) / 2},0)`}>
        <DiagramContent layout={layout} theme={theme} font={FONT} />
      </g>
      <text x={width - 24} y={height - 14} textAnchor="end" fontSize={10} fontFamily={FONT} fill={c.muted}>
        {ATTRIBUTION}
      </text>
    </svg>
  );
}

/** `@font-face` rules embedding JetBrains Mono, from the base64 of each woff2 in `public/fonts/`. */
export function fontFaceCss(regular: string, bold: string) {
  return [
    [regular, 400],
    [bold, 700],
  ]
    .map(([data, weight]) => `@font-face{font-family:"JetBrains Mono";font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`)
    .join("");
}
