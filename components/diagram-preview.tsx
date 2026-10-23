"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { IconFocusCentered, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Layout } from "@/lib/compose/layout";
import { DiagramContent, type Theme } from "@/components/diagram-svg";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MIN = 0.25;
const MAX = 2;
const clamp = (k: number) => Math.min(MAX, Math.max(MIN, k));

type View = { x: number; y: number; k: number };

export function DiagramPreview({
  layout,
  theme,
  stale,
  active,
  onSelect,
}: {
  layout: Layout;
  theme: Theme;
  stale: boolean;
  active: string | null;
  onSelect: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<{ id: number; x: number; y: number; moved: number; node?: string } | null>(null);

  const fit = useCallback(() => {
    const { width: w, height: h } = svgRef.current!.getBoundingClientRect();
    const k = clamp(Math.min(1, w / layout.width, h / layout.height));
    setView({ k, x: (w - layout.width * k) / 2, y: (h - layout.height * k) / 2 });
  }, [layout.width, layout.height]);

  /** Zoom by `factor` keeping the point (px, py) of the SVG fixed; defaults to the centre. */
  const zoom = useCallback((factor: number, px = size.w / 2, py = size.h / 2) => {
    setView((v) => {
      const k = clamp(v.k * factor);
      return { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
    });
  }, [size]);

  useEffect(() => {
    const svg = svgRef.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(svg);
    // React's onWheel is passive, so it can't stop the page from scrolling.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX - r.left, e.clientY - r.top);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      svg.removeEventListener("wheel", onWheel);
    };
  }, [zoom]);

  // Refit on first measure and when the set of Services changes, not on every edit.
  const services = layout.nodes.map((n) => n.id).join("\0");
  const measured = size.w > 0;
  useEffect(() => {
    if (measured) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, measured]);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const node = (e.target as Element).closest("[data-node]")?.getAttribute("data-node") ?? undefined;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, node };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setView((v) => ({ ...v, x: v.x + e.clientX - d.x, y: v.y + e.clientY - d.y }));
    drag.current = { ...d, x: e.clientX, y: e.clientY, moved: d.moved + Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) };
  };
  // A press that barely moves on a Node is a click: jump to that Service in the editor.
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.node && d.moved < 4) onSelect(d.node);
  };
  const onPointerCancel = () => (drag.current = null);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") zoom(1.25);
    else if (e.key === "-") zoom(0.8);
    else if (e.key === "0") fit();
    else return;
    e.preventDefault();
  };

  const edges = layout.edges.length;
  return (
    <div className="relative h-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label={`${layout.nodes.length} services, ${edges} ${edges === 1 ? "connection" : "connections"}`}
        tabIndex={0}
        className={cn(
          "absolute inset-0 size-full cursor-grab touch-none [&_[data-node]]:cursor-pointer outline-none select-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing",
          stale && "opacity-40",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          <DiagramContent layout={layout} theme={theme} active={active} />
        </g>
      </svg>
      <div className="absolute bottom-4 left-4 flex">
        <ViewButton label="Zoom In" onClick={() => zoom(1.25)}>
          <IconZoomIn />
        </ViewButton>
        <ViewButton label="Zoom Out" onClick={() => zoom(0.8)}>
          <IconZoomOut />
        </ViewButton>
        <ViewButton label="Fit to View" onClick={fit}>
          <IconFocusCentered />
        </ViewButton>
      </div>
    </div>
  );
}

function ViewButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon-sm" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
