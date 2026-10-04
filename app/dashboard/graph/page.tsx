import { prisma } from "@/lib/db";
import { computeLayout } from "@/lib/catalog/layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { requireAccess } from "@/lib/dashboard";
import { resourceTables } from "@/resources/server";
import { InteractiveGraph } from "@/components/dashboard/interactive-graph";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function GraphPage() {
  await requireAccess(resourceTables.Component.resource, "read");
  
  const components = await prisma.component.findMany();
  const dependencies = await prisma.dependency.findMany();

  const nodes = components.map(c => ({ id: c.id, name: c.name }));
  const edges = dependencies.map(d => ({ sourceId: d.sourceId, targetId: d.targetId, type: d.type }));

  const { nodes: layoutNodes, width: layoutWidth, height: layoutHeight } = computeLayout(nodes, edges);


  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <PageHeader title="Architecture Graph" />
      <div className="flex-1 m-4 min-h-0 relative">
        <div className="absolute inset-0">
          <InteractiveGraph 
          initialNodes={layoutNodes} 
          edges={edges} 
          components={components.map(c => ({ id: c.id, name: c.name, lifecycleStage: c.lifecycleStage, tags: c.tags }))}
          initialWidth={layoutWidth} 
          initialHeight={layoutHeight} 
        />
        </div>
      </div>
    </div>
  )
}
