import React, { useState } from 'react';
import { NFA, DFA, simulateString } from '../algorithms/automata';
import { Play, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface StringSimulatorProps {
  nfa: NFA;
  dfa: DFA;
  onHighlightState?: (stateId: string) => void;
}

export const StringSimulator: React.FC<StringSimulatorProps> = ({
  nfa,
  dfa,
  onHighlightState,
}) => {
  const [testInput, setTestInput] = useState('abb');
  const [simResult, setSimResult] = useState<ReturnType<typeof simulateString> | null>(() => {
    try {
      return simulateString(nfa, dfa, 'abb');
    } catch {
      return null;
    }
  });

  const handleSimulate = (strToTest?: string) => {
    const stringVal = strToTest !== undefined ? strToTest : testInput;
    const res = simulateString(nfa, dfa, stringVal);
    setSimResult(res);
  };

  const sampleStrings = ['abb', 'aab', 'bba', 'ab', 'bb', ''];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            6. Automata Equivalence & String Simulation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test any input string simultaneously on both NFA and DFA to verify language equivalence
            L(NFA) = L(DFA).
          </p>
        </div>

        {/* Quick sample chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Quick tests:</span>
          {sampleStrings.map((s) => (
            <button
              type="button"
              key={s || 'empty'}
              onClick={() => {
                setTestInput(s);
                handleSimulate(s);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {s === '' ? 'ε (empty)' : `"${s}"`}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field & Run Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter input string over alphabet (e.g., abb)..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
            className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSimulate()}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Simulate String</span>
        </button>
      </div>

      {/* Simulation Result Box */}
      {simResult && (
        <div className="space-y-4 pt-1">
          {/* Dual Verdict Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* DFA Result */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                simResult.acceptedDfa
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-300'
              }`}
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
                  DFA Outcome
                </span>
                <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  {simResult.acceptedDfa ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>STRING ACCEPTED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>STRING REJECTED</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono font-semibold">
                Ends in {simResult.dfaTrace[simResult.dfaTrace.length - 1]?.stateId || '∅'}
              </span>
            </div>

            {/* NFA Result */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                simResult.acceptedNfa
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-300'
              }`}
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
                  NFA Parallel Outcome
                </span>
                <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  {simResult.acceptedNfa ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>STRING ACCEPTED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>STRING REJECTED</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono font-semibold">
                {simResult.isMatch ? 'Equivalence Verified ✓' : 'Mismatch'}
              </span>
            </div>
          </div>

          {/* DFA State-by-State Execution Path */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Deterministic Traversal Path:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {simResult.dfaTrace.map((step, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 px-1">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">'{step.symbol}'</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onHighlightState?.(step.stateId)}
                    className="flex flex-col items-center px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg transition-colors shrink-0"
                  >
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
                      {step.stateId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{step.stateLabel}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
