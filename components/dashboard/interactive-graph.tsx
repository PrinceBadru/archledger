"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

export function InteractiveGraph({
  children,
  width,
  height,
}: {
  children: ReactNode;
  width: number;
  height: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initial centering logic can go here if needed
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Center the graph initially if it fits, else just start at 0,0 with scale 0.8
      const scaleX = rect.width / width;
      const scaleY = rect.height / height;
      const initialScale = Math.min(Math.max(Math.min(scaleX, scaleY) * 0.9, 0.2), 1);
      
      const initialX = (rect.width - width * initialScale) / 2;
      const initialY = (rect.height - height * initialScale) / 2;
      
      setTransform({ x: initialX, y: initialY, scale: initialScale });
    }
  }, [width, height]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * (1 + delta), 0.1), 3);
        
        // Zoom towards mouse cursor
        if (!containerRef.current) return { ...prev, scale: newScale };
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        
        return { x: newX, y: newY, scale: newScale };
      });
    } else {
      // Pan
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 pointer-events-none flex items-start p-2 text-xs text-gray-400 z-10">
        Scroll to pan. Ctrl+Scroll (or pinch) to zoom. Click and drag to move.
      </div>
      <div 
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width,
          height,
        }}
        className="relative transition-transform duration-75 ease-out"
      >
        {children}
      </div>
    </div>
  );
}
