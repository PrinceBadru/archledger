"use client";

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

export interface Edge {
  sourceId: string;
  targetId: string;
  type: string;
}

export interface ComponentData {
  id: string;
  name: string;
  lifecycleStage: string;
  tags: string | null;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const PADDING = 100;

export function InteractiveGraph({
  initialNodes,
  edges,
  components,
  initialWidth,
  initialHeight,
}: {
  initialNodes: LayoutNode[];
  edges: Edge[];
  components: ComponentData[];
  initialWidth: number;
  initialHeight: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Node positions state
  const [nodes, setNodes] = useState<Record<string, { x: number, y: number }>>(() => {
    const acc: Record<string, { x: number, y: number }> = {};
    initialNodes.forEach(n => {
      acc[n.id] = { x: n.x, y: n.y };
    });
    return acc;
  });

  // Node dragging state
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [hasDraggedNode, setHasDraggedNode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = rect.width / initialWidth;
      const scaleY = rect.height / initialHeight;
      // Ensure the scale doesn't drop below 0.75 so text remains readable
      const initialScale = Math.max(Math.min(scaleX, scaleY) * 0.9, 0.75);
      
      const initialX = (rect.width - initialWidth * initialScale) / 2;
      const initialY = (rect.height - initialHeight * initialScale) / 2;
      
      setTransform({ x: initialX, y: initialY, scale: initialScale });
    }
  }, [initialWidth, initialHeight, isFullscreen]);

  const handleWheel = (e: ReactWheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * (1 + delta), 0.1), 3);
        if (!containerRef.current) return { ...prev, scale: newScale };
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        
        return { x: newX, y: newY, scale: newScale };
      });
    } else {
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const handleContainerMouseDown = (e: ReactMouseEvent) => {
    if (draggingNode) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (draggingNode) {
      setHasDraggedNode(true);
      const movementX = e.movementX / transform.scale;
      const movementY = e.movementY / transform.scale;
      setNodes(prev => ({
        ...prev,
        [draggingNode]: {
          x: prev[draggingNode].x + movementX,
          y: prev[draggingNode].y + movementY,
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    // Keep hasDraggedNode true for a tick so onClick can read it, then reset
    setTimeout(() => setHasDraggedNode(false), 50);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleNodeMouseDown = (e: ReactMouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevents HTML link dragging
    setDraggingNode(id);
    setHasDraggedNode(false);
  };

  // Compute dynamic width/height to ensure SVG covers everything
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.values(nodes).forEach(pos => {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y > maxY) maxY = pos.y;
  });
  
  // Use initial dimensions if they are larger to avoid jitter, but allow expanding
  const canvasWidth = Math.max(initialWidth, maxX - minX + NODE_WIDTH + PADDING * 2);
  const canvasHeight = Math.max(initialHeight, maxY - minY + NODE_HEIGHT + PADDING * 2);

  return (
    <div 
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative w-full h-full rounded-lg'} overflow-hidden border bg-gray-50 dark:bg-gray-900 dark:border-gray-800 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 pointer-events-none flex items-start justify-between p-2 text-xs text-gray-400 z-10">
        <span>Scroll to pan. Ctrl+Scroll (or pinch) to zoom. Drag nodes to move them. Click node to open.</span>
      </div>
      
      <div className="absolute top-2 right-2 z-20">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-white/50 backdrop-blur dark:bg-black/50"
          title={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      <div 
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: canvasWidth,
          height: canvasHeight,
        }}
        className="relative transition-transform duration-75 ease-out"
      >
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: canvasWidth, height: canvasHeight }}>
           {edges.map(e => {
              const source = nodes[e.sourceId];
              const target = nodes[e.targetId];
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
           const pos = nodes[c.id];
           if (!pos) return null;
           const isDraggingThis = draggingNode === c.id;
           
           return (
             <div
               key={c.id}
               className="absolute"
               style={{
                 left: pos.x - NODE_WIDTH / 2 + PADDING,
                 top: pos.y + PADDING,
                 width: NODE_WIDTH,
                 height: NODE_HEIGHT,
                 zIndex: isDraggingThis ? 50 : 10,
               }}
             >
               <Card 
                  className={`w-full h-full flex flex-col justify-center items-center text-center overflow-hidden transition-all select-none
                             ${isDraggingThis ? 'border-blue-500 shadow-xl cursor-grabbing' : 'cursor-grab hover:border-blue-400 hover:shadow-md'}`}
                  onMouseDown={(e) => handleNodeMouseDown(e, c.id)}
                >
                  <Link 
                    href={`/dashboard/components/${c.id}`} 
                    className="w-full h-full flex flex-col items-center justify-center pointer-events-auto p-2" 
                    draggable={false} 
                    onDragStart={e => e.preventDefault()}
                    onClick={(e) => {
                      if (hasDraggedNode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <h3 className="font-semibold text-sm leading-normal line-clamp-2">{c.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 pointer-events-none border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">{c.lifecycleStage}</p>
                    {c.tags && (
                      <div className="flex gap-1 mt-2 flex-wrap justify-center pointer-events-none">
                        {c.tags.split(',').map(tag => (
                          <span key={tag} className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm px-1.5 py-0.5">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
               </Card>
             </div>
           )
        })}
      </div>
    </div>
  );
}
