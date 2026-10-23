import { readFile } from "node:fs/promises";
import path from "node:path";
import { composeToDiagram } from "@/lib/compose/compose-to-diagram";
import { layoutDiagram } from "@/lib/compose/layout";
import { ExportSvg, fontFaceCss } from "@/components/export-svg";

const MAX_BYTES = 1_000_000;

const font = (weight: string) => readFile(path.join(process.cwd(), "public/fonts", `JetBrainsMono-${weight}.woff2`), "base64");

/** POST a Compose File as the body, get the SVG Export back. Off unless COMPVIZ_API=true, so the hosted site doesn't serve it. */
export async function POST(request: Request) {
  if (process.env.COMPVIZ_API !== "true") return new Response("Not Found", { status: 404 });

  if (Number(request.headers.get("content-length")) > MAX_BYTES) return new Response("Compose File is over 1MB", { status: 413 });
  const text = await request.text();
  if (text.length > MAX_BYTES) return new Response("Compose File is over 1MB", { status: 413 });

  const result = composeToDiagram(text);
  if (!result.ok) return new Response(result.error, { status: 400 });

  const theme = new URL(request.url).searchParams.get("theme") === "dark" ? "dark" : "light";
  const [regular, bold] = await Promise.all([font("Regular"), font("Bold")]);
  // Dynamic import: Next rejects a static react-dom/server import in server code.
  const { renderToStaticMarkup } = await import("react-dom/server");
  const svg = renderToStaticMarkup(<ExportSvg layout={layoutDiagram(result)} theme={theme} fontCss={fontFaceCss(regular, bold)} />);
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
}
