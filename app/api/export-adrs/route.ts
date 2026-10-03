import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatAdrMarkdown } from "@/lib/catalog/export";
import { z } from "zod";

const exportSchema = z.object({
  format: z.enum(["json", "markdown"]).default("markdown")
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = exportSchema.safeParse({
    format: searchParams.get("format") || "markdown"
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid format parameter" }, { status: 400 });
  }

  const decisions = await prisma.decision.findMany();

  if (parsed.data.format === "json") {
    return NextResponse.json(decisions);
  }

  const md = formatAdrMarkdown(decisions);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": 'attachment; filename="ADRs.md"'
    }
  });
}
