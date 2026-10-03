import { prisma } from "@/lib/db";
import { computeLayout } from "@/lib/catalog/layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function GraphPage() {
  const components = await prisma.component.findMany();
  const dependencies = await prisma.dependency.findMany();

  const nodes = components.map(c => ({ id: c.id, name: c.name }));
  const edges = dependencies.map(d => ({ sourceId: d.sourceId, targetId: d.targetId, type: d.type }));

  const layoutNodes = computeLayout(nodes, edges);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const OFFSET_X = 1500;
  const OFFSET_Y = 100;

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Architecture Graph" />
      <div className="flex-1 overflow-auto relative p-8 bg-gray-50 dark:bg-gray-900 rounded-lg m-4">
        <div className="relative w-full h-full min-h-[3000px] min-w-[3000px]">
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minHeight: 3000, minWidth: 3000 }}>
             {edges.map(e => {
                const source = layoutNodes.find(n => n.id === e.sourceId);
                const target = layoutNodes.find(n => n.id === e.targetId);
                if (!source || !target) return null;
                
                const startX = source.x + OFFSET_X;
                const startY = source.y + OFFSET_Y + NODE_HEIGHT;
                const endX = target.x + OFFSET_X;
                const endY = target.y + OFFSET_Y;
                
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
               <Card key={c.id} 
                    className="absolute flex flex-col justify-center items-center text-center overflow-hidden"
                    style={{
                      left: layout.x - NODE_WIDTH / 2 + OFFSET_X,
                      top: layout.y + OFFSET_Y,
                      width: NODE_WIDTH,
                      height: NODE_HEIGHT
                    }}>
                 <h3 className="font-semibold text-lg truncate w-full px-2">{c.name}</h3>
                 <p className="text-sm text-gray-500 mt-1">{c.lifecycleStage}</p>
                 {c.tags && <p className="text-xs text-blue-500 mt-2 truncate w-full px-2">{c.tags}</p>}
               </Card>
             )
          })}
        </div>
      </div>
    </div>
  )
}
