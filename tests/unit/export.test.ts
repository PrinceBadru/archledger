import { describe, it, expect } from "vitest";
import { formatAdrMarkdown } from "../../lib/catalog/export";

describe("formatAdrMarkdown", () => {
  it("formats decisions correctly into markdown", () => {
    const decisions = [
      { title: "Use Next.js", state: "Accepted", body: "We chose Next.js for SSR.", tags: "frontend, framework" },
      { title: "Use Prisma", state: "Accepted", body: null, tags: null }
    ];

    const md = formatAdrMarkdown(decisions);

    expect(md).toContain("# Architecture Decision Records");
    expect(md).toContain("## 1. Use Next.js");
    expect(md).toContain("**State:** Accepted");
    expect(md).toContain("**Tags:** frontend, framework");
    expect(md).toContain("We chose Next.js for SSR.");
    
    expect(md).toContain("## 2. Use Prisma");
    expect(md).toContain("_No body provided._");
  });

  it("handles empty array", () => {
    expect(formatAdrMarkdown([])).toBe("# Architecture Decision Records\n\n");
  });
});
