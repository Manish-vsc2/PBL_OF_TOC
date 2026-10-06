import React, { useMemo } from 'react';
import { DFA, minimizeDFA } from '../algorithms/automata';
import { AutomataGraph } from './AutomataGraph';
import { Minimize2, TrendingDown, Layers, CheckCircle2, Split, ArrowRight } from 'lucide-react';

interface DfaMinimizationSectionProps {
  dfa: DFA;
}

export const DfaMinimizationSection: React.FC<DfaMinimizationSectionProps> = ({ dfa }) => {
  const minimization = useMemo(() => minimizeDFA(dfa), [dfa]);
  const { minDfa, partitionsHistory, reductionPercentage, stateEquivalenceMap } = {
    minDfa: minimization.minimizedDfa,
    partitionsHistory: minimization.partitionsHistory,
    reductionPercentage: minimization.reductionPercentage,
    stateEquivalenceMap: minimization.stateEquivalenceMap,
  };

  // Minimized DFA graph nodes & edges
  const minGraphNodes = useMemo(() => {
    return minDfa.states.map((st) => ({
      id: st.id,
      name: st.id,
      subLabel: st.label,
      isStart: st.isStart,
      isFinal: st.isFinal,
    }));
  }, [minDfa]);

  const minGraphEdges = useMemo(() => {
    const edges: { from: string; to: string; symbol: string }[] = [];
    for (const [src, symMap] of Object.entries(minDfa.transitions)) {
      for (const [sym, targetId] of Object.entries(symMap)) {
        if (targetId) {
          edges.push({ from: src, to: targetId, symbol: sym });
        }
      }
    }
    return edges;
  }, [minDfa]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Minimize2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              7. DFA Minimization & State Compaction (Hopcroft's Partitioning)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Derives the canonical minimal DFA with the strictly minimal number of states recognizing the same language.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {reductionPercentage > 0
              ? `${reductionPercentage}% State Space Reduction`
              : 'Already Minimal DFA'}
          </span>
        </div>
      </div>

      {/* 4 Metric Compaction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Original DFA States</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {minimization.originalStateCount} states
          </div>
          <p className="text-[10px] text-slate-500">From subset construction</p>
        </div>

        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Minimized DFA States</span>
          <div className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
            {minimization.minimizedStateCount} states
          </div>
          <p className="text-[10px] text-emerald-700/80">Canonical minimal machine</p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Partition Iterations</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {partitionsHistory.length} passes
          </div>
          <p className="text-[10px] text-slate-500">Fixed-point convergence</p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Reduction Gain</span>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {reductionPercentage}%
          </div>
          <p className="text-[10px] text-slate-500">Redundant state elimination</p>
        </div>
      </div>

      {/* Step-by-Step Partition History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Split className="w-3.5 h-3.5 text-blue-600" />
          <span>Partition Refinement Progression</span>
        </h3>

        <div className="space-y-2">
          {partitionsHistory.map((step, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-400">{step.partitionLabel}</span>
                <span className="text-[11px] text-slate-400 font-sans">
                  {step.partitions.length} partition group{step.partitions.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {step.partitions.map((group, gIdx) => (
                  <span
                    key={gIdx}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                  >
                    {'{'}
                    {group.join(', ')}
                    {'}'}
                  </span>
                ))}
              </div>

              <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 pt-0.5">
                {step.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Minimized Transition Table & Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Minimized Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Minimized DFA Transition Matrix
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">Merged Subsets</th>
                  {minDfa.alphabet.map((sym) => (
                    <th key={sym} className="py-2 px-3 text-center">
                      δ({sym})
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right">Accepting?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {minDfa.states.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        {st.isStart && <span className="text-blue-600 font-bold">➔</span>}
                        {st.isFinal && <span className="text-slate-900 dark:text-white font-bold">*</span>}
                        <span>{st.id}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{st.label}</td>
                    {minDfa.alphabet.map((sym) => {
                      const tgt = minDfa.transitions[st.id]?.[sym];
                      return (
                        <td key={sym} className="py-2 px-3 text-center">
                          {tgt ? (
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                              {tgt}
                            </span>
                          ) : (
                            <span className="text-slate-400">∅</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right">
                      {st.isFinal ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                          Final
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Minimized Graph */}
        <div>
          <AutomataGraph
            title="Minimal Deterministic Automaton"
            nodes={minGraphNodes}
            edges={minGraphEdges}
          />
        </div>
      </div>
    </div>
  );
};
