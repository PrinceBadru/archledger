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

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const PADDING = 100;

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Architecture Graph" />
      <div className="flex-1 m-4 h-[calc(100vh-120px)]">
        <InteractiveGraph width={layoutWidth + PADDING * 2} height={layoutHeight + PADDING * 2}>
          <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: layoutWidth + PADDING * 2, height: layoutHeight + PADDING * 2 }}>
             {edges.map(e => {
                const source = layoutNodes.find(n => n.id === e.sourceId);
                const target = layoutNodes.find(n => n.id === e.targetId);
                if (!source || !target) return null;
                
                const startX = source.x + PADDING;
                const startY = source.y + PADDING + NODE_HEIGHT;
                const endX = target.x + PADDING;
                const endY = target.y + PADDING;
                
                return (
                  <g key={`${e.sourceId}-${e.targetId}`}>
                    <line 
                      x1={startX} y1={startY} x2={endX} y2={endY} 
                      stroke="currentColor" strokeWidth={2} className="text-gray-400 dark:text-gray-600"
                    />
                    <circle cx={endX} cy={endY - 4} r={4} className="fill-gray-400 dark:fill-gray-600" />
                  </g>
                )
             })}
          </svg>
          
          {components.map(c => {
             const layout = layoutNodes.find(n => n.id === c.id);
             if (!layout) return null;
             return (
               <Link href={`/dashboard/components/${c.id}`} key={c.id}>
                 <Card 
                      className="absolute flex flex-col justify-center items-center text-center overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                      style={{
                        left: layout.x - NODE_WIDTH / 2 + PADDING,
                        top: layout.y + PADDING,
                        width: NODE_WIDTH,
                        height: NODE_HEIGHT
                      }}>
                   <h3 className="font-semibold text-lg truncate w-full px-2">{c.name}</h3>
                   <p className="text-sm text-gray-500 mt-1">{c.lifecycleStage}</p>
                   {c.tags && <p className="text-xs text-blue-500 mt-2 truncate w-full px-2">{c.tags}</p>}
                 </Card>
               </Link>
             )
          })}
        </InteractiveGraph>
      </div>
    </div>
  )
}
