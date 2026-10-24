"use client";

import { useRef, useState } from "react";
import { IconBook, IconCheck, IconCopy } from "@tabler/icons-react";
import { CATALOGUE, CATEGORIES } from "@/lib/compose/catalogue";
import { DIRECTIONS } from "@/lib/compose/compose-to-diagram";
import { CONVERT_PROMPT } from "@/lib/compose/convert-prompt";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SETTINGS: [string, string][] = [
  ["title", "Diagram title, used in Export file names and the PDF"],
  ["direction", `Layout direction: ${DIRECTIONS.join(", ")} (default TB)`],
];

const SERVICE: [string, string][] = [
  ["compviz.name", "Display name (default: the service id)"],
  ["compviz.type", "Category, which sets the Node's colour"],
  ["compviz.icon", "A Known App's logo and Category"],
  ["compviz.highlight", '"true" makes the Node stand out'],
  ["compviz.hidden", '"true" leaves the service and its Edges out'],
];

const EDGE: [string, string][] = [
  ["compviz.edge.<target>.label", "Edge label; creates the Edge if depends_on doesn't"],
  ["compviz.edge.<target>.animated", '"true" animates the Edge'],
  ["compviz.edge.<target>.hidden", '"true" hides the Edge'],
];

const EXAMPLE = `x-compviz:
  title: Storefront
  direction: LR

services:
  api:
    build: ./api
    depends_on: [db]
    labels:
      compviz.name: Orders API
      compviz.highlight: "true"
      compviz.edge.db.label: SQL
      compviz.edge.events.label: events
      compviz.edge.events.animated: "true"
  db:
    image: postgres:16-alpine
  events:
    image: rabbitmq:3-management`;

const INSTALL = "/plugin install compviz --marketplace a2-coder/compviz";

export function Guide() {
  const [copied, setCopied] = useState(false);
  // Focus the top of the Guide on open; the first tabbable (Copy Prompt) would scroll it to the bottom.
  const top = useRef<HTMLDivElement>(null);
  const prompt = useRef<HTMLPreElement>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONVERT_PROMPT);
    } catch {
      // Clipboard blocked: select the prompt so it can be copied by hand.
      window.getSelection()?.selectAllChildren(prompt.current!);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger
          render={<SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open Guide" />} />}
        >
          <IconBook />
        </TooltipTrigger>
        <TooltipContent>Open Guide</TooltipContent>
      </Tooltip>
      <SheetContent initialFocus={top} className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Guide</SheetTitle>
          <SheetDescription>
            Customise the Diagram from inside the Compose File. Annotations are plain labels, so the file still runs with <Code>docker compose</Code>.
          </SheetDescription>
        </SheetHeader>
        <div ref={top} tabIndex={-1} className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 outline-none">
          <Section title="Diagram Settings" intro={<>A top-level <Code>x-compviz</Code> block.</>}>
            <KeyTable rows={SETTINGS} />
          </Section>
          <Section title="Service Annotations" intro={<>Labels on a service.</>}>
            <KeyTable rows={SERVICE} />
          </Section>
          <Section
            title="Edge Annotations"
            intro={
              <>
                Labels on the source service, keyed by the target. <Code>depends_on</Code> and <Code>links</Code> already draw
                Edges from the dependent service to the one it uses.
              </>
            }
          >
            <KeyTable rows={EDGE} />
          </Section>
          <Section title="Values">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Categories</dt>
              <dd>{CATEGORIES.join(", ")}</dd>
              <dt className="text-muted-foreground">Known Apps</dt>
              <dd>{Object.keys(CATALOGUE).join(", ")}</dd>
            </dl>
            <p className="text-muted-foreground">
              Known Apps are recognised by image. Boolean values must be the quoted strings &quot;true&quot; or
              &quot;false&quot;.
            </p>
          </Section>
          <Section title="Example">
            <Pre>{EXAMPLE}</Pre>
          </Section>
          <Separator />
          <Section
            title="Convert With an Agent"
            intro="Paste this prompt into any AI chat, followed by your Compose File, to get it back annotated."
          >
            <div className="relative">
              <Pre ref={prompt} className="max-h-64 pr-24">{CONVERT_PROMPT}</Pre>
              <Button variant="outline" size="sm" onClick={copy} className="absolute top-2 right-2">
                {copied ? <IconCheck className="text-emerald-500" /> : <IconCopy />}
                {copied ? "Copied" : "Copy Prompt"}
              </Button>
            </div>
            <p className="text-muted-foreground">
              In Claude Code, install the <Code>compviz:convert</Code> skill instead, then ask it to convert your Compose File:
            </p>
            <Pre>{INSTALL}</Pre>
            <p className="text-muted-foreground">
              Other agents: <Code>npx skills add a2-coder/compviz</Code>. See the README for details.
            </p>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {intro && <p className="text-muted-foreground">{intro}</p>}
      {children}
    </section>
  );
}

function KeyTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full ring-1 ring-foreground/10">
      <tbody>
        {rows.map(([key, effect]) => (
          <tr key={key} className="border-b last:border-b-0">
            <td className="px-2 py-1 align-top whitespace-nowrap">
              <Code>{key}</Code>
            </td>
            <td className="px-2 py-1">{effect}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 text-foreground">{children}</code>;
}

function Pre({ children, className, ref }: { children: string; className?: string; ref?: React.Ref<HTMLPreElement> }) {
  return (
    <pre ref={ref} className={cn("overflow-auto bg-muted p-3 text-xs/relaxed whitespace-pre-wrap ring-1 ring-foreground/10", className)}>
      {children}
    </pre>
  );
}
