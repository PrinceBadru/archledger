import { prisma } from "@/lib/db";
import { cached, resourceTag } from "@/lib/cache";
import { computeHealthScore } from "@/lib/catalog/scoring";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

const getCachedScores = cached(
  async () => {
    const components = await prisma.component.findMany();
    const dependencies = await prisma.dependency.findMany();

    return components.map(c => {
      const depCount = dependencies.filter(d => d.sourceId === c.id).length;
      return {
        id: c.id,
        name: c.name,
        score: computeHealthScore({ lifecycleStage: c.lifecycleStage, dependencyCount: depCount })
      };
    });
  },
  ["catalog", "scores"],
  { tags: [resourceTag("Component"), resourceTag("Dependency")] }
);

export const dynamic = 'force-dynamic';

export default async function MetricsPage() {
  const scores = await getCachedScores();

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Health Metrics" />
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scores.map(s => (
            <Card key={s.id} className="p-6 flex flex-col items-center">
              <h3 className="font-semibold text-lg mb-4 text-center">{s.name}</h3>
              <div className={`text-4xl font-bold ${s.score >= 90 ? 'text-green-500' : s.score >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                {s.score}
              </div>
            </Card>
          ))}
          {scores.length === 0 && (
            <p className="text-gray-500 col-span-full">No components found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
