"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { basicSetup } from "codemirror";
import { Decoration, EditorView, keymap, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder, StateField, type EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { yaml, yamlLanguage } from "@codemirror/lang-yaml";
import {
  insertCompletionText,
  startCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { tags as t } from "@lezer/highlight";
import { completeCompose } from "@/lib/compose/complete";
import { serviceRanges } from "@/lib/compose/ranges";

// Classes (not raw colours) so Tailwind generates them and `.dark` switches them.
const highlight = HighlightStyle.define([
  { tag: t.definition(t.propertyName), class: "text-foreground" },
  { tag: [t.content, t.string, t.special(t.string)], class: "text-sky-600 dark:text-sky-400" },
  { tag: [t.lineComment, t.meta], class: "text-muted-foreground italic" },
  { tag: [t.separator, t.punctuation, t.squareBracket, t.brace], class: "text-muted-foreground" },
  { tag: [t.labelName, t.typeName, t.keyword], class: "text-orange-500" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "12px", backgroundColor: "transparent", color: "var(--foreground)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.65" },
  ".cm-content": { caretColor: "var(--foreground)" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  ".cm-gutters": { backgroundColor: "transparent", color: "var(--muted-foreground)", border: "none" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in oklch, var(--muted) 60%, transparent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--muted) !important" },
  ".cm-matchingBracket": { backgroundColor: "var(--muted)", outline: "1px solid var(--border)" },
  ".cm-foldPlaceholder": { backgroundColor: "var(--muted)", border: "none", color: "var(--muted-foreground)" },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "none",
    boxShadow: "0 0 0 1px color-mix(in oklch, var(--foreground) 10%, transparent), 0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": { fontFamily: "inherit", fontSize: "12px" },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
  ".cm-completionIcon": { display: "none" },
  ".cm-completionDetail": { color: "var(--muted-foreground)", fontStyle: "normal", marginLeft: "1em" },
  ".cm-completionMatchedText": { textDecoration: "none", fontWeight: "700" },
});

function complete(ctx: CompletionContext): CompletionResult | null {
  const r = completeCompose(ctx.state.doc.toString(), ctx.pos);
  if (!r) return null;
  // Open unprompted only once something is typed, or right after `key: `, `=`, `[`, `,` or `- `.
  const before = ctx.state.doc.lineAt(ctx.pos).text.slice(0, ctx.pos - ctx.state.doc.lineAt(ctx.pos).from);
  if (!ctx.explicit && r.from === ctx.pos && !/(:\s|[=[,]\s*|-\s)$/.test(before)) return null;
  return { from: r.from, options: r.options.map(withFollowUp), validFor: /^[\w.-]*$/ };
}

/** Accepting `key: ` or `key=` goes straight on to suggesting its values. */
function withFollowUp(o: Completion): Completion {
  const text = typeof o.apply === "string" ? o.apply : undefined;
  if (!text || !/(: |=)$/.test(text)) return o;
  return {
    ...o,
    apply: (view, _completion, from, to) => {
      view.dispatch(insertCompletionText(view.state, text, from, to));
      startCompletion(view);
    },
  };
}

/** The Service block holding the cursor, if any. */
function activeRange(state: EditorState) {
  const pos = state.selection.main.head;
  return serviceRanges(state.doc.toString()).find((r) => pos >= r.from && pos <= r.to);
}

// Sky marks the focused Service in both the editor and the Diagram; orange stays for Highlight.
const blockLine = Decoration.line({ class: "bg-sky-500/10 shadow-[inset_2px_0_var(--color-sky-500)]" });

function decorateBlock(state: EditorState): DecorationSet {
  const r = activeRange(state);
  if (!r) return Decoration.none;
  const b = new RangeSetBuilder<Decoration>();
  for (let n = state.doc.lineAt(r.from).number; n <= state.doc.lineAt(r.to).number; n++) {
    const { from } = state.doc.line(n);
    b.add(from, from, blockLine);
  }
  return b.finish();
}

const activeBlock = StateField.define<DecorationSet>({
  create: decorateBlock,
  update: (deco, tr) => (tr.docChanged || tr.selection ? decorateBlock(tr.state) : deco),
  provide: (f) => EditorView.decorations.from(f),
});

export type ComposeEditorHandle = { revealService: (id: string) => void };

export function ComposeEditor({
  value,
  onChange,
  onActiveServiceChange,
  id,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  onActiveServiceChange: (id: string | null) => void;
  id?: string;
  ref?: Ref<ComposeEditorHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>(null);
  const onChangeRef = useRef(onChange);
  const onActiveRef = useRef(onActiveServiceChange);
  useEffect(() => {
    onChangeRef.current = onChange;
    onActiveRef.current = onActiveServiceChange;
  });

  useImperativeHandle(ref, () => ({
    revealService(serviceId) {
      const v = view.current;
      const r = v && serviceRanges(v.state.doc.toString()).find((s) => s.id === serviceId);
      if (!v || !r) return;
      v.dispatch({ selection: { anchor: r.at }, effects: EditorView.scrollIntoView(r.at, { y: "center" }) });
      v.focus();
    },
  }));

  useEffect(() => {
    let active: string | null = null;
    const editor = new EditorView({
      parent: host.current!,
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        yaml(),
        yamlLanguage.data.of({ autocomplete: complete }),
        syntaxHighlighting(highlight),
        theme,
        EditorView.contentAttributes.of({ "aria-label": "compose.yaml", ...(id ? { id } : {}) }),
        activeBlock,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          if (!u.docChanged && !u.selectionSet) return;
          const next = activeRange(u.state)?.id ?? null;
          if (next !== active) onActiveRef.current((active = next));
        }),
      ],
    });
    view.current = editor;
    return () => editor.destroy();
    // The editor owns the text after mount; `value` only seeds it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="h-full min-h-0" />;
}
