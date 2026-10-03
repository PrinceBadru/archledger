// Server-only: resource name → descriptor and table (maintained by flare gen).
// generated:start hash=3adbeb0694e4
import { prisma } from "@/lib/db";
import { componentResource, decisionResource, dependencyResource, securityEventResource } from "./index";

export const resourceTables = {
  Component: { resource: componentResource, delegate: prisma.component },
  Decision: { resource: decisionResource, delegate: prisma.decision },
  Dependency: { resource: dependencyResource, delegate: prisma.dependency },
  SecurityEvent: { resource: securityEventResource, delegate: prisma.securityEvent },
} as const;

export type ResourceName = keyof typeof resourceTables;
// generated:end
