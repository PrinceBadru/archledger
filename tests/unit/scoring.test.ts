import { describe, it, expect } from "vitest";
import { computeHealthScore } from "../../lib/catalog/scoring";

describe("scoring", () => {
  it("returns 100 for active component with few dependencies", () => {
    expect(computeHealthScore({ lifecycleStage: "active", dependencyCount: 2 })).toBe(100);
  });

  it("applies penalty for deprecated stage", () => {
    expect(computeHealthScore({ lifecycleStage: "deprecated", dependencyCount: 0 })).toBe(60);
  });

  it("applies penalty for proposed stage", () => {
    expect(computeHealthScore({ lifecycleStage: "proposed", dependencyCount: 0 })).toBe(90);
  });

  it("applies penalty for superseded stage", () => {
    expect(computeHealthScore({ lifecycleStage: "superseded", dependencyCount: 0 })).toBe(40);
  });

  it("applies penalty for high dependency count", () => {
    expect(computeHealthScore({ lifecycleStage: "active", dependencyCount: 7 })).toBe(90);
  });

  it("caps minimum score at 0", () => {
    expect(computeHealthScore({ lifecycleStage: "superseded", dependencyCount: 20 })).toBe(0);
  });
});
