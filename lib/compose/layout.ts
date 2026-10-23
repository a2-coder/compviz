import { graphlib, layout } from "@dagrejs/dagre";
import type { Diagram, DiagramEdge, DiagramNode } from "./compose-to-diagram";

export const NODE_W = 208;
export const NODE_H = 76;
/** JetBrains Mono advance width is 0.6em, so text width is chars × 0.6 × font size. */
export const charW = (px: number) => px * 0.6;
export const EDGE_LABEL_PX = 10;
const MARGIN = 24;

export type Point = { x: number; y: number };
export type PlacedNode = DiagramNode & Point;
export type PlacedEdge = DiagramEdge & { points: Point[]; labelAt?: Point };
export type Layout = { width: number; height: number; nodes: PlacedNode[]; edges: PlacedEdge[] };

/** Positions are top-left corners for Nodes, and absolute points for Edges. */
export function layoutDiagram(diagram: Diagram): Layout {
  const g = new graphlib.Graph({ multigraph: false });
  g.setGraph({ rankdir: diagram.settings.direction, nodesep: 40, ranksep: 64, edgesep: 20, marginx: MARGIN, marginy: MARGIN });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of diagram.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of diagram.edges) {
    g.setEdge(
      e.from,
      e.to,
      e.label ? { width: e.label.length * charW(EDGE_LABEL_PX) + 12, height: 18, labelpos: "c" } : {},
    );
  }
  layout(g);

  const { width = 0, height = 0 } = g.graph();
  return {
    width,
    height,
    nodes: diagram.nodes.map((n) => {
      const { x, y } = g.node(n.id);
      return { ...n, x: x - NODE_W / 2, y: y - NODE_H / 2 };
    }),
    edges: diagram.edges.map((e) => {
      const { points = [], x, y } = g.edge(e.from, e.to);
      return { ...e, points, labelAt: e.label && x !== undefined && y !== undefined ? { x, y } : undefined };
    }),
  };
}
