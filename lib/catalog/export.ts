export interface DecisionInput {
  title: string;
  state: string;
  body?: string | null;
  tags?: string | null;
}

export function formatAdrMarkdown(decisions: DecisionInput[]): string {
  let md = "# Architecture Decision Records\n\n";

  decisions.forEach((decision, index) => {
    md += `## ${index + 1}. ${decision.title}\n`;
    md += `**State:** ${decision.state}\n`;
    if (decision.tags) {
      md += `**Tags:** ${decision.tags}\n`;
    }
    md += `\n${decision.body || "_No body provided._"}\n\n`;
    md += `---\n\n`;
  });

  return md;
}
