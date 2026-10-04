export interface Node {
  id: string;
}

export interface Edge {
  sourceId: string;
  targetId: string;
}

export interface LayoutNode extends Node {
  x: number;
  y: number;
}

export function computeLayout(nodes: Node[], edges: Edge[]): { nodes: LayoutNode[], width: number, height: number } {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  const layer = new Map<string, number>();

  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    graph.set(node.id, []);
    layer.set(node.id, 0);
  });

  edges.forEach(edge => {
    if (graph.has(edge.sourceId)) {
      graph.get(edge.sourceId)!.push(edge.targetId);
    }
    if (inDegree.has(edge.targetId)) {
      inDegree.set(edge.targetId, inDegree.get(edge.targetId)! + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) {
      queue.push(id);
    }
  });

  // Cycle fallback: if no nodes have in-degree 0 but there are nodes, push the first one
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    inDegree.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    const uLayer = layer.get(u)!;
    
    (graph.get(u) || []).forEach(v => {
      // Allow moving to a lower layer (higher number) to stretch edges down
      if (uLayer + 1 > layer.get(v)!) {
        layer.set(v, uLayer + 1);
      }
      
      const deg = inDegree.get(v)! - 1;
      inDegree.set(v, deg);
      if (deg === 0) {
        queue.push(v);
      } else if (deg < 0) {
        // Break infinite loop in case of cycles by ignoring negative in-degrees
      }
    });
  }

  // Handle remaining nodes not visited (cycles)
  inDegree.forEach((degree, id) => {
    if (degree > 0) {
      // Just put them on the last known max layer + 1
      let maxL = 0;
      layer.forEach(l => { if (l > maxL) maxL = l; });
      layer.set(id, maxL + 1);
    }
  });

  const layers: Map<number, string[]> = new Map();
  layer.forEach((l, id) => {
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l)!.push(id);
  });

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 120;
  const X_SPACING = 50;
  const Y_SPACING = 100;

  const result: LayoutNode[] = [];
  layers.forEach((layerNodes, l) => {
    const totalWidth = layerNodes.length * NODE_WIDTH + (layerNodes.length - 1) * X_SPACING;
    let startX = -totalWidth / 2 + NODE_WIDTH / 2;
    const y = l * (NODE_HEIGHT + Y_SPACING);

    layerNodes.forEach(id => {
      result.push({
        id,
        x: startX,
        y
      });
      startX += NODE_WIDTH + X_SPACING;
    });
  });

  if (result.length === 0) {
    return { nodes: [], width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  result.forEach(n => {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  });

  const width = maxX - minX + NODE_WIDTH;
  const height = maxY - minY + NODE_HEIGHT;

  result.forEach(n => {
    n.x = n.x - minX;
    n.y = n.y - minY;
  });

  return { nodes: result, width, height };
}
