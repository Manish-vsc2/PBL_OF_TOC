import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NFA, EPSILON } from '../algorithms/automata';
import {
  Plus,
  Trash2,
  Sparkles,
  MousePointer,
  ArrowUpRight,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  CircleDot
} from 'lucide-react';

interface VisualCanvasBuilderProps {
  nfa: NFA;
  onChangeNfa: (updated: NFA) => void;
  onAnalyze: () => void;
}

interface CanvasNode {
  id: string;
  x: number;
  y: number;
}

export const VisualCanvasBuilder: React.FC<VisualCanvasBuilderProps> = ({
  nfa,
  onChangeNfa,
  onAnalyze,
}) => {
  const [tool, setTool] = useState<'select' | 'add-state' | 'connect'>('select');
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Symbol modal for connecting
  const [pendingConnection, setPendingConnection] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(nfa.alphabet[0] || 'a');

  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize node positions based on existing NFA states
  useEffect(() => {
    const width = 680;
    const height = 400;
    const count = nfa.states.length;
    const radius = Math.min(width, height) * 0.32;
    const centerX = width / 2;
    const centerY = height / 2;

    setNodePositions((prev) => {
      const next = { ...prev };
      nfa.states.forEach((st, i) => {
        if (!next[st]) {
          const angle = (2 * Math.PI * i) / (count || 1) - Math.PI;
          next[st] = {
            x: Math.round(centerX + radius * Math.cos(angle)),
            y: Math.round(centerY + radius * Math.sin(angle)),
          };
        }
      });
      // Remove deleted states from positions
      Object.keys(next).forEach((k) => {
        if (!nfa.states.includes(k)) delete next[k];
      });
      return next;
    });
  }, [nfa.states]);

  // Click on SVG Canvas
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'add-state') {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      let nextIndex = nfa.states.length;
      let newName = `q${nextIndex}`;
      while (nfa.states.includes(newName)) {
        nextIndex++;
        newName = `q${nextIndex}`;
      }

      const updatedStates = [...nfa.states, newName];
      const updatedTransitions = { ...nfa.transitions, [newName]: {} };

      setNodePositions((prev) => ({ ...prev, [newName]: { x, y } }));
      onChangeNfa({
        ...nfa,
        states: updatedStates,
        transitions: updatedTransitions,
      });
      setTool('select');
      setSelectedNodeId(newName);
    } else {
      setSelectedNodeId(null);
      setConnectSource(null);
    }
  };

  // Click on a Node
  const handleNodeClick = (e: React.MouseEvent, stateId: string) => {
    e.stopPropagation();

    if (tool === 'connect') {
      if (!connectSource) {
        setConnectSource(stateId);
      } else {
        // Form connection
        setPendingConnection({ from: connectSource, to: stateId });
        setConnectSource(null);
        setTool('select');
      }
    } else {
      setSelectedNodeId(stateId);
    }
  };

  // Node Dragging
  const handleMouseDownNode = (e: React.MouseEvent, stateId: string) => {
    e.stopPropagation();
    if (tool === 'select') {
      setDraggingNodeId(stateId);
      const pos = nodePositions[stateId] || { x: 0, y: 0 };
      setDragOffset({
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = Math.max(40, Math.min(640, e.clientX - dragOffset.x));
      const newY = Math.max(40, Math.min(360, e.clientY - dragOffset.y));
      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY },
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Confirm Transition Connection
  const confirmAddTransition = () => {
    if (!pendingConnection) return;
    const { from, to } = pendingConnection;
    const sym = selectedSymbol;

    const currentTargets = nfa.transitions[from]?.[sym] || [];
    if (!currentTargets.includes(to)) {
      const updatedTransitions = { ...nfa.transitions };
      if (!updatedTransitions[from]) updatedTransitions[from] = {};
      updatedTransitions[from] = {
        ...updatedTransitions[from],
        [sym]: [...currentTargets, to].sort(),
      };

      onChangeNfa({
        ...nfa,
        transitions: updatedTransitions,
      });
    }
    setPendingConnection(null);
  };

  // Delete Transition
  const handleDeleteTransition = (from: string, sym: string, to: string) => {
    const currentTargets = nfa.transitions[from]?.[sym] || [];
    const filtered = currentTargets.filter((t) => t !== to);

    const updatedTransitions = { ...nfa.transitions };
    if (!updatedTransitions[from]) updatedTransitions[from] = {};
    updatedTransitions[from] = {
      ...updatedTransitions[from],
      [sym]: filtered,
    };

    onChangeNfa({
      ...nfa,
      transitions: updatedTransitions,
    });
  };

  // Delete State
  const handleDeleteSelectedState = () => {
    if (!selectedNodeId || nfa.states.length <= 1) return;
    const toDelete = selectedNodeId;
    const newStates = nfa.states.filter((s) => s !== toDelete);
    const newTransitions: Record<string, Record<string, string[]>> = {};

    for (const s of newStates) {
      newTransitions[s] = {};
      for (const sym of [...nfa.alphabet, EPSILON]) {
        const targets = nfa.transitions[s]?.[sym] || [];
        newTransitions[s][sym] = targets.filter((t) => t !== toDelete);
      }
    }

    const startState = nfa.startState === toDelete ? newStates[0] : nfa.startState;
    const finalStates = nfa.finalStates.filter((s) => s !== toDelete);

    onChangeNfa({
      states: newStates,
      alphabet: nfa.alphabet,
      startState,
      finalStates,
      transitions: newTransitions,
    });
    setSelectedNodeId(null);
  };

  // Toggle Start
  const handleToggleStart = () => {
    if (!selectedNodeId) return;
    onChangeNfa({ ...nfa, startState: selectedNodeId });
  };

  // Toggle Final
  const handleToggleFinal = () => {
    if (!selectedNodeId) return;
    const isFinal = nfa.finalStates.includes(selectedNodeId);
    const updated = isFinal
      ? nfa.finalStates.filter((s) => s !== selectedNodeId)
      : [...nfa.finalStates, selectedNodeId];
    onChangeNfa({ ...nfa, finalStates: updated });
  };

  // Group edges
  const groupedEdges: { from: string; to: string; symbols: string[] }[] = [];
  for (const [src, symMap] of Object.entries(nfa.transitions)) {
    for (const [sym, targets] of Object.entries(symMap)) {
      for (const tgt of targets) {
        const found = groupedEdges.find((e) => e.from === src && e.to === tgt);
        if (found) {
          if (!found.symbols.includes(sym)) found.symbols.push(sym);
        } else {
          groupedEdges.push({ from: src, to: tgt, symbols: [sym] });
        }
      }
    }
  }

  const NODE_RADIUS = 28;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-blue-600" />
            <span>Interactive Visual Automata Canvas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Design your NFA visually: click canvas to drop states, drag to link transitions.
          </p>
        </div>

        {/* Mode Tools */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setTool('select');
              setConnectSource(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tool === 'select'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Select / Drag</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTool('add-state');
              setConnectSource(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tool === 'add-state'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add State</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTool('connect');
              setConnectSource(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tool === 'connect'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Connect Transitions</span>
          </button>
        </div>
      </div>

      {/* Selected Node Action Bar */}
      {selectedNodeId && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-blue-900 dark:text-blue-300">
            <span>Selected: {selectedNodeId}</span>
            {nfa.startState === selectedNodeId && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">Start State</span>
            )}
            {nfa.finalStates.includes(selectedNodeId) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">Final State</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleStart}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Make Start (q₀)
            </button>
            <button
              type="button"
              onClick={handleToggleFinal}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              {nfa.finalStates.includes(selectedNodeId) ? 'Remove Final' : 'Make Accepting (*)'}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedState}
              disabled={nfa.states.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg font-medium transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive SVG Canvas */}
      <div className="relative w-full h-[380px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden select-none">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            <marker
              id="canvas-arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
            <marker
              id="canvas-start-arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
            </marker>
            <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.8" fill="#cbd5e1" className="dark:fill-slate-800" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#canvas-grid)" />

          {/* Edges */}
          {groupedEdges.map((edge) => {
            const pFrom = nodePositions[edge.from];
            const pTo = nodePositions[edge.to];
            if (!pFrom || !pTo) return null;

            const labelText = edge.symbols.join(', ');

            if (edge.from === edge.to) {
              const topX = pFrom.x;
              const topY = pFrom.y - NODE_RADIUS;
              const pathD = `M ${topX - 10} ${topY + 2} C ${topX - 35} ${topY - 45}, ${topX + 35} ${topY - 45}, ${topX + 10} ${topY + 2}`;

              return (
                <g key={`canvas-loop-${edge.from}`}>
                  <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#canvas-arrow)" />
                  <rect
                    x={topX - 16}
                    y={topY - 44}
                    width={32}
                    height={18}
                    rx={4}
                    fill="#ffffff"
                    className="dark:fill-slate-900"
                    stroke="#cbd5e1"
                  />
                  <text x={topX} y={topY - 32} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563eb">
                    {labelText}
                  </text>
                </g>
              );
            }

            const dx = pTo.x - pFrom.x;
            const dy = pTo.y - pFrom.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;

            const hasReverse = groupedEdges.some((e) => e.from === edge.to && e.to === edge.from);
            const ux = dx / dist;
            const uy = dy / dist;
            const nx = -uy;
            const ny = ux;
            const curveOffset = hasReverse ? 26 : 0;

            const startX = pFrom.x + ux * NODE_RADIUS + nx * (curveOffset * 0.25);
            const startY = pFrom.y + uy * NODE_RADIUS + ny * (curveOffset * 0.25);
            const endX = pTo.x - ux * (NODE_RADIUS + 4) + nx * (curveOffset * 0.25);
            const endY = pTo.y - uy * (NODE_RADIUS + 4) + ny * (curveOffset * 0.25);

            const midX = (startX + endX) / 2 + nx * curveOffset;
            const midY = (startY + endY) / 2 + ny * curveOffset;

            const pathD =
              curveOffset === 0
                ? `M ${startX} ${startY} L ${endX} ${endY}`
                : `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

            const labelX = curveOffset === 0 ? (startX + endX) / 2 + nx * 10 : midX;
            const labelY = curveOffset === 0 ? (startY + endY) / 2 + ny * 10 : midY;

            return (
              <g key={`canvas-edge-${edge.from}-${edge.to}`}>
                <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#canvas-arrow)" />
                <rect
                  x={labelX - 16}
                  y={labelY - 9}
                  width={32}
                  height={18}
                  rx={4}
                  fill="#ffffff"
                  className="dark:fill-slate-900"
                  stroke="#cbd5e1"
                />
                <text x={labelX} y={labelY + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563eb">
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nfa.states.map((st) => {
            const pos = nodePositions[st];
            if (!pos) return null;

            const isStart = nfa.startState === st;
            const isFinal = nfa.finalStates.includes(st);
            const isSelected = selectedNodeId === st;
            const isConnectSource = connectSource === st;

            return (
              <g
                key={st}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => handleNodeClick(e, st)}
                onMouseDown={(e) => handleMouseDownNode(e, st)}
                className="cursor-pointer"
              >
                {/* Start arrow */}
                {isStart && (
                  <g transform="translate(-46, 0)">
                    <line
                      x1="0"
                      y1="0"
                      x2="16"
                      y2="0"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      markerEnd="url(#canvas-start-arrow)"
                    />
                    <text x="-4" y="-4" fontSize="10" fontWeight="700" fill="#0284c7" textAnchor="middle">
                      START
                    </text>
                  </g>
                )}

                {/* Outer double circle for final */}
                {isFinal && (
                  <circle
                    r={NODE_RADIUS + 4}
                    fill="none"
                    stroke={isSelected ? '#2563eb' : '#0369a1'}
                    strokeWidth="2.5"
                  />
                )}

                <circle
                  r={NODE_RADIUS}
                  fill={
                    isConnectSource
                      ? '#c7d2fe'
                      : isSelected
                        ? '#eff6ff'
                        : '#ffffff'
                  }
                  className="dark:fill-slate-900"
                  stroke={
                    isConnectSource
                      ? '#4f46e5'
                      : isSelected
                        ? '#2563eb'
                        : isFinal
                          ? '#0369a1'
                          : isStart
                            ? '#0284c7'
                            : '#475569'
                  }
                  strokeWidth={isSelected || isConnectSource ? 3 : 2}
                />

                <text
                  y={4}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={isSelected ? '#1d4ed8' : '#0f172a'}
                  className="dark:fill-slate-100"
                >
                  {st}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Canvas instruction banner */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 pointer-events-none">
          {tool === 'add-state' && <span>Click anywhere on canvas to drop new State node</span>}
          {tool === 'connect' && (
            <span>
              {connectSource
                ? `Click target node to connect transition from ${connectSource}`
                : 'Click source node to start transition'}
            </span>
          )}
          {tool === 'select' && <span>Click node to select/edit · Drag node to reposition</span>}
        </div>
      </div>

      {/* Modal / Dialog for connecting symbol */}
      {pendingConnection && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Add Transition: {pendingConnection.from} ➔ {pendingConnection.to}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the input symbol that triggers this state transition:
            </p>

            <div className="flex flex-wrap gap-2">
              {[...nfa.alphabet, EPSILON].map((sym) => (
                <button
                  type="button"
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                    selectedSymbol === sym
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sym === EPSILON ? 'ε (epsilon)' : sym}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingConnection(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddTransition}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
              >
                Add Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
