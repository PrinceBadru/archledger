import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // In a real Vercel Cron setup, we would verify the Authorization header
  // provided by Vercel to ensure this endpoint is only called by cron.
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Example cron task: log a sync event or clean up old data
  // For now, just return success
  
  return NextResponse.json({ success: true, message: "Cron sync executed" });
}
