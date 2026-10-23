"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { IconAlertTriangle, IconChevronDown, IconDownload, IconFileTypePdf, IconFileTypePng, IconFileTypeSvg } from "@tabler/icons-react";
import { composeToDiagram, type Diagram } from "@/lib/compose/compose-to-diagram";
import { layoutDiagram } from "@/lib/compose/layout";
import { exportDiagram, type ExportFormat } from "@/lib/export";
import type { Theme } from "@/components/diagram-svg";
import { ComposeEditor, type ComposeEditorHandle } from "@/components/compose-editor";
import { DiagramPreview } from "@/components/diagram-preview";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const SAMPLE = `x-compviz:
  title: Storefront
  direction: TB

services:
  proxy:
    image: traefik:v3.1
    ports: ["80:80", "443:443"]
    depends_on: [web, api]
  web:
    build: ./web
    labels:
      compviz.name: Storefront
      compviz.edge.api.label: REST
  api:
    build: ./api
    depends_on: [db, cache]
    labels:
      compviz.name: Orders API
      compviz.highlight: "true"
      compviz.edge.db.label: SQL
      compviz.edge.events.label: events
      compviz.edge.events.animated: "true"
  worker:
    build: ./worker
    depends_on: [db, events]
  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
  cache:
    image: redis:7
  events:
    image: rabbitmq:3-management
    ports: ["15672:15672"]
  migrate:
    build: ./api
    command: migrate
    depends_on: [db]
    labels:
      compviz.hidden: "true"

volumes:
  pgdata:
`;

const EXPORTS: { format: ExportFormat; label: string; Icon: typeof IconFileTypeSvg }[] = [
  { format: "svg", label: "SVG", Icon: IconFileTypeSvg },
  { format: "png", label: "PNG", Icon: IconFileTypePng },
  { format: "pdf", label: "PDF", Icon: IconFileTypePdf },
];

function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
const useTheme = (): Theme =>
  useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light",
  );

function subscribeWide(onChange: () => void) {
  const mq = matchMedia("(min-width: 64rem)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
/** Side by side from `lg`, stacked below it. */
const useWide = () => useSyncExternalStore(subscribeWide, () => matchMedia("(min-width: 64rem)").matches, () => true);

export function ComposeDiagram() {
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState(() => composeToDiagram(SAMPLE));
  const [lastGood, setLastGood] = useState<Diagram | null>(result.ok ? result : null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const theme = useTheme();
  const wide = useWide();
  const [activeService, setActiveService] = useState<string | null>(null);
  const editor = useRef<ComposeEditorHandle>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const r = composeToDiagram(text);
      setResult(r);
      if (r.ok) setLastGood(r);
    }, 300);
    return () => clearTimeout(t);
  }, [text]);

  const layout = useMemo(() => lastGood && layoutDiagram(lastGood), [lastGood]);
  const warnings = result.ok ? result.warnings : [];

  async function download(format: ExportFormat) {
    if (!layout || !lastGood) return;
    setExporting(format);
    try {
      await exportDiagram(format, layout, theme, lastGood.settings.title);
    } finally {
      setExporting(null);
    }
  }

  return (
    // defaultLayout sizes the panels from the first render, even if the group mounts at zero size.
    <ResizablePanelGroup orientation={wide ? "horizontal" : "vertical"} defaultLayout={{ compose: 40, diagram: 60 }}>
      <ResizablePanel id="compose" defaultSize="40" minSize="20">
        <Card className="h-full w-full gap-0 pb-0 ring-0">
          <CardHeader className="border-b">
            <CardTitle>Compose</CardTitle>
            <CardDescription>Paste a Docker Compose file</CardDescription>
          </CardHeader>
          <div className="min-h-0 flex-1">
            <ComposeEditor
              ref={editor}
              id="compose"
              value={SAMPLE}
              onChange={setText}
              onActiveServiceChange={setActiveService}
            />
          </div>
          <ul aria-live="polite" className="max-h-32 shrink-0 overflow-y-auto border-t p-4 empty:hidden">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-1.5 text-muted-foreground">
                <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-label="Warning" />
                {w}
              </li>
            ))}
          </ul>
        </Card>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="diagram" defaultSize="60" minSize="20">
        <Card className="h-full w-full gap-0 pb-0 ring-0">
          <CardHeader className="border-b">
            <CardTitle>Diagram</CardTitle>
            <CardDescription>
              {result.ok ? "See how the services connect" : <span role="alert">{result.error}</span>}
            </CardDescription>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" disabled={!result.ok || exporting !== null} />}
                >
                  <IconDownload data-icon="inline-start" />
                  {exporting ? "Exporting" : "Export"}
                  <IconChevronDown data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {EXPORTS.map(({ format, label, Icon }) => (
                    <DropdownMenuItem key={format} onClick={() => download(format)}>
                      <Icon />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </CardHeader>
          <div className="relative min-h-0 flex-1">
            {layout ? (
              <DiagramPreview
                layout={layout}
                theme={theme}
                stale={!result.ok}
                active={activeService}
                onSelect={(id) => editor.current?.revealService(id)}
              />
            ) : (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyTitle>No diagram yet</EmptyTitle>
                  <EmptyDescription>Paste a Compose file to draw it</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </Card>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
