import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Download, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';

export interface GraphNode {
  id: string;
  name: string;
  subLabel?: string;
  isStart: boolean;
  isFinal: boolean;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  symbols: string[];
}

interface AutomataGraphProps {
  title: string;
  nodes: { id: string; name: string; subLabel?: string; isStart: boolean; isFinal: boolean }[];
  edges: { from: string; to: string; symbol: string }[];
  highlightStateId?: string;
  className?: string;
}

export const AutomataGraph: React.FC<AutomataGraphProps> = ({
  title,
  nodes: rawNodes,
  edges: rawEdges,
  highlightStateId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout positions
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Group raw edges by (from, to)
  const groupedEdges = useMemo(() => {
    const map = new Map<string, { from: string; to: string; symbols: string[] }>();
    for (const e of rawEdges) {
      const key = `${e.from}:::${e.to}`;
      if (!map.has(key)) {
        map.set(key, { from: e.from, to: e.to, symbols: [e.symbol] });
      } else {
        const item = map.get(key)!;
        if (!item.symbols.includes(e.symbol)) {
          item.symbols.push(e.symbol);
        }
      }
    }
    return Array.from(map.values());
  }, [rawEdges]);

  // Initial layout calculation (Circle / Level layout)
  useEffect(() => {
    if (rawNodes.length === 0) return;

    const count = rawNodes.length;
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 640;
    const height = 400;

    if (count === 1) {
      positions[rawNodes[0].id] = { x: width / 2, y: height / 2 };
    } else if (count <= 5) {
      // Linear or small polygon layout
      const radius = Math.min(width, height) * 0.32;
      const centerX = width / 2;
      const centerY = height / 2;
      rawNodes.forEach((node, i) => {
        // Place start state on left
        const angle = (2 * Math.PI * i) / count - Math.PI;
        positions[node.id] = {
          x: Math.round(centerX + radius * Math.cos(angle)),
          y: Math.round(centerY + radius * Math.sin(angle)),
        };
      });
    } else {
      // Circular / elliptical layout with breathing room
      const radiusX = width * 0.38;
      const radiusY = height * 0.34;
      const centerX = width / 2;
      const centerY = height / 2;
      rawNodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI;
        positions[node.id] = {
          x: Math.round(centerX + radiusX * Math.cos(angle)),
          y: Math.round(centerY + radiusY * Math.sin(angle)),
        };
      });
    }

    setNodePositions(positions);
    setZoom(1);
    setPan({ x: 20, y: 20 });
  }, [rawNodes]);

  // Handle Dragging Node
  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const newX = (e.clientX - rect.left - pan.x) / zoom;
      const newY = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY },
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleStartPan = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 20, y: 20 });
  }, []);

  const exportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_diagram.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const NODE_RADIUS = 30;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden select-none ${className}`}
    >
      {/* Top Diagram Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {rawNodes.length} state{rawNodes.length === 1 ? '' : 's'} · {groupedEdges.length} transition path
            {groupedEdges.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
            title="Zoom In"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
            title="Zoom Out"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            title="Reset View"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={exportSvg}
            title="Download SVG Diagram"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors ml-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        className="relative w-full h-[380px] bg-slate-50 dark:bg-slate-950/70 cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleStartPan}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Standard arrow marker */}
            <marker
              id={`arrow-${title.replace(/\s+/g, '')}`}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>

            {/* Start incoming arrow marker */}
            <marker
              id={`start-arrow-${title.replace(/\s+/g, '')}`}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
            </marker>

            {/* Grid pattern background */}
            <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.8" fill="#cbd5e1" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid-dots)" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. EDGES */}
            {groupedEdges.map((edge) => {
              const pFrom = nodePositions[edge.from];
              const pTo = nodePositions[edge.to];
              if (!pFrom || !pTo) return null;

              const labelText = edge.symbols.join(', ');
              const arrowMarker = `url(#arrow-${title.replace(/\s+/g, '')})`;

              // CASE A: Self-loop
              if (edge.from === edge.to) {
                const loopRadius = 26;
                const topX = pFrom.x;
                const topY = pFrom.y - NODE_RADIUS;

                // Cubic bezier curving up and looping back
                const pathD = `M ${topX - 12} ${topY + 3} C ${topX - 35} ${topY - 45}, ${topX + 35} ${topY - 45}, ${topX + 12} ${topY + 3}`;

                return (
                  <g key={`loop-${edge.from}`} className="transition-all">
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.75"
                      markerEnd={arrowMarker}
                    />
                    <rect
                      x={topX - 14}
                      y={topY - 44}
                      width={28}
                      height={18}
                      rx={4}
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x={topX}
                      y={topY - 32}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#1e293b"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              }

              // CASE B: Edge between two different nodes
              const dx = pTo.x - pFrom.x;
              const dy = pTo.y - pFrom.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              // Check if there is an opposite reverse edge between them
              const hasReverse = groupedEdges.some((e) => e.from === edge.to && e.to === edge.from);

              // Unit vector
              const ux = dx / dist;
              const uy = dy / dist;

              // Normal vector perpendicular
              const nx = -uy;
              const ny = ux;

              // If reverse exists, curve with an offset
              const curveOffset = hasReverse ? 26 : 0;

              // Calculate start and end offsets around the node perimeter
              const startX = pFrom.x + ux * NODE_RADIUS + nx * (curveOffset * 0.25);
              const startY = pFrom.y + uy * NODE_RADIUS + ny * (curveOffset * 0.25);
              const endX = pTo.x - ux * (NODE_RADIUS + 4) + nx * (curveOffset * 0.25);
              const endY = pTo.y - uy * (NODE_RADIUS + 4) + ny * (curveOffset * 0.25);

              // Control point
              const midX = (startX + endX) / 2 + nx * curveOffset;
              const midY = (startY + endY) / 2 + ny * curveOffset;

              const pathD =
                curveOffset === 0
                  ? `M ${startX} ${startY} L ${endX} ${endY}`
                  : `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

              const labelX = curveOffset === 0 ? (startX + endX) / 2 + nx * 10 : midX;
              const labelY = curveOffset === 0 ? (startY + endY) / 2 + ny * 10 : midY;

              return (
                <g key={`edge-${edge.from}-${edge.to}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.75"
                    markerEnd={arrowMarker}
                  />
                  {/* Label badge */}
                  <rect
                    x={labelX - 12}
                    y={labelY - 9}
                    width={24}
                    height={16}
                    rx={3}
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#0f172a"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}

            {/* 2. NODES */}
            {rawNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isHighlighted = highlightStateId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                  className="cursor-move"
                >
                  {/* Incoming Start Arrow if initial state */}
                  {node.isStart && (
                    <g transform="translate(-48, 0)">
                      <line
                        x1="0"
                        y1="0"
                        x2="16"
                        y2="0"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        markerEnd={`url(#start-arrow-${title.replace(/\s+/g, '')})`}
                      />
                      <text
                        x="-4"
                        y="-4"
                        fontSize="10"
                        fontWeight="700"
                        fill="#0284c7"
                        textAnchor="middle"
                      >
                        START
                      </text>
                    </g>
                  )}

                  {/* Outer circle (Double circle for accepting/final states) */}
                  {node.isFinal && (
                    <circle
                      r={NODE_RADIUS + 4}
                      fill="none"
                      stroke={isHighlighted ? '#2563eb' : '#0369a1'}
                      strokeWidth="2.2"
                      className="transition-colors"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={NODE_RADIUS}
                    fill={isHighlighted ? '#eff6ff' : '#ffffff'}
                    stroke={
                      isHighlighted
                        ? '#2563eb'
                        : node.isFinal
                          ? '#0369a1'
                          : node.isStart
                            ? '#0284c7'
                            : '#475569'
                    }
                    strokeWidth={isHighlighted ? 3 : 2}
                    className="transition-all shadow-sm"
                  />

                  {/* State Name */}
                  <text
                    y={node.subLabel ? -3 : 4}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill={isHighlighted ? '#1d4ed8' : '#0f172a'}
                  >
                    {node.name}
                  </text>

                  {/* Sub-label for subset mapping like {q0, q1} */}
                  {node.subLabel && (
                    <text
                      y="14"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="500"
                      fill="#475569"
                    >
                      {node.subLabel.length > 12
                        ? `${node.subLabel.slice(0, 10)}…}`
                        : node.subLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating pan/drag hint */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/80 backdrop-blur-xs px-2 py-1 rounded border border-slate-200 pointer-events-none">
          <Move className="w-3 h-3 text-slate-400" />
          <span>Drag nodes to arrange · Drag background to pan</span>
        </div>
      </div>
    </div>
  );
};
