import { describe, it, expect } from "vitest";
import { computeLayout } from "../../lib/catalog/layout";

describe("layout", () => {
  it("assigns distinct layers and coordinates to a simple DAG", () => {
    const nodes = [{ id: "A" }, { id: "B" }, { id: "C" }];
    const edges = [
      { sourceId: "A", targetId: "B" },
      { sourceId: "B", targetId: "C" },
    ];

    const { nodes: result } = computeLayout(nodes, edges);

    expect(result).toHaveLength(3);
    const nodeA = result.find((n) => n.id === "A")!;
    const nodeB = result.find((n) => n.id === "B")!;
    const nodeC = result.find((n) => n.id === "C")!;

    expect(nodeA.y).toBeLessThan(nodeB.y);
    expect(nodeB.y).toBeLessThan(nodeC.y);
  });

  it("handles empty input", () => {
    const result = computeLayout([], []);
    expect(result).toEqual({ nodes: [], width: 0, height: 0 });
  });

  it("spreads siblings evenly on the X axis", () => {
    const nodes = [{ id: "Root" }, { id: "Child1" }, { id: "Child2" }];
    const edges = [
      { sourceId: "Root", targetId: "Child1" },
      { sourceId: "Root", targetId: "Child2" },
    ];

    const { nodes: result } = computeLayout(nodes, edges);

    const child1 = result.find((n) => n.id === "Child1")!;
    const child2 = result.find((n) => n.id === "Child2")!;

    expect(child1.y).toEqual(child2.y);
    expect(child1.x).not.toEqual(child2.x);
  });
});
