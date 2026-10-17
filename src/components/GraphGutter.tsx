import { useMemo } from "react";
import {
  graphGutterWidth,
  graphXStep,
  renderRowSvg,
  type GraphNode,
} from "../graph";

export function GraphGutter({
  node,
  prev,
  laneCount,
  selected,
  dotStroke,
  selectedStroke,
}: {
  node: GraphNode;
  prev: GraphNode | null;
  laneCount: number;
  selected: boolean;
  dotStroke?: string;
  selectedStroke?: string;
}) {
  const xs = graphXStep(laneCount);
  const src = useMemo(() => {
    const svg = renderRowSvg(node, prev, laneCount, xs, {
      selected,
      dotStroke,
      selectedStroke,
    });
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [node, prev, laneCount, xs, selected, dotStroke, selectedStroke]);
  return (
    <img
      src={src}
      style={{ width: graphGutterWidth(laneCount), height: 24, flexShrink: 0 }}
    />
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";
import { GRAPH_LANE_COUNT, GRAPH_NODES } from "../../scripts/shot-data";

export const GraphGutterShot: ComponentShot = {
  name: "GraphGutter",
  el: (
    <Shot>
      <GraphGutter
        node={GRAPH_NODES[0]}
        prev={null}
        laneCount={GRAPH_LANE_COUNT}
        selected={false}
      />
    </Shot>
  ),
};
