import { describe, it, expect } from "vitest";
import { searchComponents, SearchableComponent } from "../../lib/catalog/search";

describe("searchComponents", () => {
  const components: SearchableComponent[] = [
    { id: "1", name: "Auth Service", description: "Handles authentication", tags: "core, security" },
    { id: "2", name: "Payment Gateway", description: "Processes payments", tags: "core, finance" },
    { id: "3", name: "Email Worker", description: "Sends notifications", tags: "worker, async" },
  ];

  it("returns all components when query is empty", () => {
    expect(searchComponents(components, "")).toHaveLength(3);
    expect(searchComponents(components, "   ")).toHaveLength(3);
  });

  it("matches component name", () => {
    const result = searchComponents(components, "auth");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Auth Service");
  });

  it("matches component description", () => {
    const result = searchComponents(components, "payments");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Payment Gateway");
  });

  it("matches component tags", () => {
    const result = searchComponents(components, "worker");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Email Worker");
  });

  it("returns empty array when no matches found", () => {
    const result = searchComponents(components, "nonexistent");
    expect(result).toHaveLength(0);
  });
});
