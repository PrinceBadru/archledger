import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchComponents } from "@/lib/catalog/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json([]);
  }

  const components = await prisma.component.findMany();
  
  const searchable = components.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    tags: c.tags,
  }));

  const results = searchComponents(searchable, q);

  return NextResponse.json(results);
}
