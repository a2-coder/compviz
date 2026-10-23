import {
  IconArrowsSplit2,
  IconBolt,
  IconBox,
  IconBucket,
  IconChartLine,
  IconDatabase,
  IconSearch,
  IconStack2,
  type Icon,
} from "@tabler/icons-react";
import { CATALOGUE, type Category } from "@/lib/compose/catalogue";
import { charW, EDGE_LABEL_PX, NODE_H, NODE_W, type Layout, type PlacedNode, type Point } from "@/lib/compose/layout";

export type Theme = "light" | "dark";

// ponytail: hex mirrors of the zinc tokens in app/globals.css (card, foreground, muted-foreground, border),
// because exports must stand alone and svg2pdf/Figma don't read oklch or CSS variables. Keep in sync.
export const PALETTES = {
  light: { bg: "#ffffff", fg: "#09090b", muted: "#71717a", line: "#e4e4e7", ring: "rgba(9,9,11,0.1)" },
  dark: { bg: "#18181b", fg: "#fafafa", muted: "#a1a1aa", line: "#3f3f46", ring: "rgba(250,250,250,0.1)" },
} as const;
export const ACCENT = "#ff6900"; // Tailwind v4 orange-500
const FOCUS = "#00a6f4"; // Tailwind v4 sky-500, matching the editor's focused-block mark

const CATEGORY_ICONS: Record<Category, Icon> = {
  database: IconDatabase,
  cache: IconBolt,
  queue: IconStack2,
  search: IconSearch,
  storage: IconBucket,
  proxy: IconArrowsSplit2,
  observability: IconChartLine,
  service: IconBox,
};

export const FONT_FAMILY = `var(--font-jetbrains-mono, "JetBrains Mono"), ui-monospace, monospace`;

const STYLE = `
.cv-flow { animation: cv-flow 0.6s linear infinite; }
@keyframes cv-flow { to { stroke-dashoffset: -8; } }
@media (prefers-reduced-motion: reduce) { .cv-flow { animation: none; } }
`;

const trunc = (s: string, chars: number) => (s.length > chars ? `${s.slice(0, Math.max(chars - 1, 0))}…` : s);

/** Diagram contents in layout coordinates; the caller supplies the outer `<svg>`. */
/** `active` outlines the Service the editor cursor is in (Preview only; Exports never pass it). */
export function DiagramContent({
  layout,
  theme,
  font = FONT_FAMILY,
  active,
}: {
  layout: Layout;
  theme: Theme;
  font?: string;
  active?: string | null;
}) {
  const c = PALETTES[theme];
  return (
    <g fontFamily={font}>
      <defs>
        <style>{STYLE}</style>
        <marker id="cv-arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill={c.muted} />
        </marker>
      </defs>
      {layout.edges.map((e) => (
        <g key={`${e.from}>${e.to}`}>
          <path
            d={smooth(e.points)}
            fill="none"
            stroke={c.muted}
            strokeWidth={1}
            markerEnd="url(#cv-arrow)"
            // The dash is an attribute so PNG and PDF exports keep it frozen; only the CSS animates it.
            strokeDasharray={e.animated ? "4 4" : undefined}
            className={e.animated ? "cv-flow" : undefined}
          />
          {e.label && e.labelAt && <EdgeLabel text={e.label} at={e.labelAt} theme={theme} />}
        </g>
      ))}
      {layout.nodes.map((n) => (
        <Node key={n.id} node={n} theme={theme} active={n.id === active} />
      ))}
    </g>
  );
}

function EdgeLabel({ text, at, theme }: { text: string; at: Point; theme: Theme }) {
  const c = PALETTES[theme];
  const w = text.length * charW(EDGE_LABEL_PX) + 12;
  return (
    <g>
      <rect x={at.x - w / 2} y={at.y - 9} width={w} height={18} fill={c.bg} stroke={c.line} />
      <text x={at.x} y={at.y + 3.5} textAnchor="middle" fontSize={EDGE_LABEL_PX} fill={c.muted}>
        {text}
      </text>
    </g>
  );
}

function Node({ node: n, theme, active }: { node: PlacedNode; theme: Theme; active: boolean }) {
  const c = PALETTES[theme];
  const pad = 12;
  const caption = n.category;
  const nameChars = Math.floor((NODE_W - 36 - pad - 8 - caption.length * charW(10)) / charW(12));
  const detail = n.name !== n.id ? `${n.id} · ${n.image ?? "build"}` : (n.image ?? "build");
  const vols = n.volumes > 0 ? `${n.volumes} vol` : "";

  let bx = pad;
  const badges: { x: number; w: number; text: string }[] = [];
  const badgeLimit = NODE_W - pad - (vols ? vols.length * charW(10) + 8 : 0);
  for (const [i, text] of n.ports.entries()) {
    const rest = n.ports.length - i - 1;
    const w = text.length * charW(10) + 8;
    const moreW = rest ? `+${rest}`.length * charW(10) + 8 + 4 : 0;
    if (bx + w + moreW > badgeLimit) {
      badges.push({ x: bx, w: `+${rest + 1}`.length * charW(10) + 8, text: `+${rest + 1}` });
      break;
    }
    badges.push({ x: bx, w, text });
    bx += w + 4;
  }

  return (
    <g transform={`translate(${n.x},${n.y})`} data-node={n.id}>
      {active && <rect x={-4} y={-4} width={NODE_W + 8} height={NODE_H + 8} fill="none" stroke={FOCUS} strokeWidth={2} />}
      <rect
        x={n.highlight ? 1 : 0.5}
        y={n.highlight ? 1 : 0.5}
        width={NODE_W - (n.highlight ? 2 : 1)}
        height={NODE_H - (n.highlight ? 2 : 1)}
        fill={c.bg}
        stroke={n.highlight ? ACCENT : c.ring}
        strokeWidth={n.highlight ? 2 : 1}
      />
      <NodeIcon node={n} theme={theme} x={pad} y={pad} />
      <text x={36} y={24} fontSize={12} fontWeight={n.highlight ? 700 : 400} fill={c.fg}>
        {trunc(n.name, nameChars)}
      </text>
      <text x={NODE_W - pad} y={24} fontSize={10} textAnchor="end" fill={c.muted}>
        {caption}
      </text>
      <text x={pad} y={44} fontSize={10} fill={c.muted}>
        {trunc(detail, Math.floor((NODE_W - 2 * pad) / charW(10)))}
      </text>
      {badges.map((b) => (
        <g key={b.x}>
          <rect x={b.x + 0.5} y={52.5} width={b.w - 1} height={13} fill="none" stroke={c.line} />
          <text x={b.x + 4} y={62} fontSize={10} fill={c.fg}>
            {b.text}
          </text>
        </g>
      ))}
      {vols && (
        <text x={NODE_W - pad} y={62} fontSize={10} textAnchor="end" fill={c.muted}>
          {vols}
        </text>
      )}
    </g>
  );
}

function NodeIcon({ node, theme, x, y }: { node: PlacedNode; theme: Theme; x: number; y: number }) {
  const logo = node.app ? CATALOGUE[node.app].logo : undefined;
  if (logo) {
    return (
      <svg x={x} y={y} width={16} height={16} viewBox="0 0 24 24" role="presentation">
        <path d={logo.path} fill={logoColour(logo.hex, theme)} />
      </svg>
    );
  }
  const Icon = CATEGORY_ICONS[node.category];
  return <Icon x={x} y={y} size={16} stroke={1.75} color={PALETTES[theme].muted} />;
}

/** Brand hex, unless it would vanish against the theme's background (e.g. Kafka's near-black on dark). */
function logoColour(hex: string, theme: Theme) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (theme === "dark" && lum < 0.05) return PALETTES.dark.fg;
  if (theme === "light" && lum > 0.85) return PALETTES.light.fg;
  return `#${hex}`;
}

/** A Catmull-Rom curve through every dagre point, so Edge labels sit on their line. */
function smooth(pts: Point[]) {
  if (pts.length === 0) return "";
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}
