import { renderToStaticMarkup } from "react-dom/server";
import { DiagramContent, PALETTES, type Theme } from "@/components/diagram-svg";
import { ATTRIBUTION, ExportSvg, FONT, FOOTER, fontFaceCss, MIN_W } from "@/components/export-svg";
import { Logo } from "@/components/logo";
import type { Layout } from "@/lib/compose/layout";

const SITE = "https://compviz.a2coder.dev";

export type ExportFormat = "svg" | "png" | "pdf";

async function base64(url: string) {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function svgString(layout: Layout, theme: Theme) {
  const [regular, bold] = await Promise.all(["Regular", "Bold"].map((w) => base64(`/fonts/JetBrainsMono-${w}.woff2`)));
  return renderToStaticMarkup(<ExportSvg layout={layout} theme={theme} fontCss={fontFaceCss(regular, bold)} />);
}

async function pngBlob(layout: Layout, theme: Theme) {
  const svg = await svgString(layout, theme);
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth * 2;
    canvas.height = img.naturalHeight * 2;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

async function pdfBlob(layout: Layout, title?: string) {
  const [{ jsPDF }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);
  const m = 32;
  const header = 56;
  const width = Math.max(layout.width, MIN_W) + 2 * m;
  const height = header + layout.height + FOOTER + m;
  const c = PALETTES.light;

  const page = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill={c.bg} />
      <Logo x={m} y={m - 4} width={24} height={24} color={c.fg} />
      <text x={m + 32} y={m + 12} fontFamily={FONT} fontSize={14} fontWeight={700} fill={c.fg}>
        compviz
        {title && <tspan fontWeight={400} fill={c.muted}>{`  ${title}`}</tspan>}
      </text>
      <line x1={m} x2={width - m} y1={header - 0.5} y2={header - 0.5} stroke={c.line} />
      <g transform={`translate(${(width - layout.width) / 2},${header})`}>
        <DiagramContent layout={layout} theme="light" font={FONT} />
      </g>
      <text x={width - m} y={height - m + 4} textAnchor="end" fontFamily={FONT} fontSize={10} fill={c.muted}>
        {ATTRIBUTION}
      </text>
    </svg>,
  );

  const doc = new jsPDF({ unit: "pt", format: [width, height], orientation: width > height ? "landscape" : "portrait" });
  for (const [w, style] of [["Regular", "normal"], ["Bold", "bold"]]) {
    doc.addFileToVFS(`JetBrainsMono-${w}.ttf`, await base64(`/fonts/JetBrainsMono-${w}.ttf`));
    doc.addFont(`JetBrainsMono-${w}.ttf`, "JetBrains Mono", style);
  }
  const el = new DOMParser().parseFromString(page, "image/svg+xml").documentElement;
  await doc.svg(el, { x: 0, y: 0, width, height });
  const linkW = ATTRIBUTION.length * 6;
  doc.link(width - m - linkW, height - m - 8, linkW, 16, { url: SITE });
  return doc.output("blob");
}

export async function exportDiagram(format: ExportFormat, layout: Layout, theme: Theme, title?: string) {
  const blob =
    format === "svg"
      ? new Blob([await svgString(layout, theme)], { type: "image/svg+xml" })
      : format === "png"
        ? await pngBlob(layout, theme)
        : await pdfBlob(layout, title);
  const slug = title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "compose";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slug}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
