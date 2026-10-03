// Server-only: resource name → descriptor and table (maintained by flare gen).
// generated:start hash=fc05e643e9dc
import { prisma } from "@/lib/db";
import { componentResource, decisionResource, dependencyResource } from "./index";

export const resourceTables = {
  Component: { resource: componentResource, delegate: prisma.component },
  Decision: { resource: decisionResource, delegate: prisma.decision },
  Dependency: { resource: dependencyResource, delegate: prisma.dependency },
} as const;

export type ResourceName = keyof typeof resourceTables;
// generated:end
