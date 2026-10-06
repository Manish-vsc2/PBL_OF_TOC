import React from 'react';
import { NFA, DFA, StateBoundAnalysis, MinimizedDFA } from '../algorithms/automata';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfa: NFA;
  dfa: DFA;
  boundAnalysis: StateBoundAnalysis;
  minimizedDfa?: MinimizedDFA;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  nfa,
  dfa,
  boundAnalysis,
  minimizedDfa,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Academic PBL Experiment Report Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div id="printable-report" className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 text-slate-800 dark:text-slate-200 font-sans print:p-0 print:text-black">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Department of Computer Science & Engineering</span>
              <span>Date: {currentDate}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
              Theory of Computation: NFA to DFA Subset Construction & State-Bound Analysis
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              PBL Experiment No. 04 · Formal Languages and Automata Theory (FLAT)
            </p>
          </div>

          {/* Formal Definitions */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
              1. Input NFA Formal Specification (5-Tuple)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">States Q</span>
                <span className="font-bold">{'{'}{nfa.states.join(', ')}{'}'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Alphabet Σ</span>
                <span className="font-bold">{'{'}{nfa.alphabet.join(', ')}{'}'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Start State q₀</span>
                <span className="font-bold text-blue-600">{nfa.startState}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Accepting States F</span>
                <span className="font-bold text-emerald-600">{'{'}{nfa.finalStates.join(', ')}{'}'}</span>
              </div>
            </div>
          </div>

          {/* State-Bound Analysis Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
              2. Theoretical vs Empirical State Bounds
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Powerset Bound (2^|Q|)</span>
                <span className="text-lg font-bold text-indigo-600">{boundAnalysis.theoreticalMax}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Actual DFA States (|Q_D|)</span>
                <span className="text-lg font-bold text-blue-600">{boundAnalysis.actualDfaStates}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Unreachable Subsets</span>
                <span className="text-lg font-bold text-amber-600">{boundAnalysis.unreachableSubsets}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block">State Utilization Rate</span>
                <span className="text-lg font-bold text-emerald-600">{boundAnalysis.stateUtilization}%</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">Analytical Evaluation:</span>
              <p className="font-mono text-slate-700 dark:text-slate-300">{boundAnalysis.dynamicInterpretation}</p>
            </div>
          </div>

          {/* Generated DFA Transition Table */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
              3. Deterministic Finite Automaton (DFA) Transition Table
            </h2>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <tr>
                    <th className="py-2 px-3">State</th>
                    <th className="py-2 px-3">Equivalent NFA Subset</th>
                    {dfa.alphabet.map((sym) => (
                      <th key={sym} className="py-2 px-3 text-center">δ({sym})</th>
                    ))}
                    <th className="py-2 px-3 text-right">Accepting?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {dfa.states.map((st) => (
                    <tr key={st.id}>
                      <td className="py-2 px-3 font-bold">
                        {st.isStart ? '➔ ' : ''}{st.id}{st.isFinal ? ' *' : ''}
                      </td>
                      <td className="py-2 px-3">{st.label}</td>
                      {dfa.alphabet.map((sym) => (
                        <td key={sym} className="py-2 px-3 text-center">{dfa.transitions[st.id]?.[sym] || '∅'}</td>
                      ))}
                      <td className="py-2 px-3 text-right">{st.isFinal ? 'Final' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Minimized DFA if available */}
          {minimizedDfa && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                4. Minimized DFA (Hopcroft's Partitioning: {minimizedDfa.minimizedStateCount} States, {minimizedDfa.reductionPercentage}% Reduction)
              </h2>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">Min State</th>
                      <th className="py-2 px-3">Merged DFA States</th>
                      {minimizedDfa.minimizedDfa.alphabet.map((sym) => (
                        <th key={sym} className="py-2 px-3 text-center">δ({sym})</th>
                      ))}
                      <th className="py-2 px-3 text-right">Accepting?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {minimizedDfa.minimizedDfa.states.map((st) => (
                      <tr key={st.id}>
                        <td className="py-2 px-3 font-bold">
                          {st.isStart ? '➔ ' : ''}{st.id}{st.isFinal ? ' *' : ''}
                        </td>
                        <td className="py-2 px-3">{st.label}</td>
                        {minimizedDfa.minimizedDfa.alphabet.map((sym) => (
                          <td key={sym} className="py-2 px-3 text-center">
                            {minimizedDfa.minimizedDfa.transitions[st.id]?.[sym] || '∅'}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right">{st.isFinal ? 'Final' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conclusion */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">Conclusion:</span>
            <p>
              The Rabin-Scott powerset construction algorithm guarantees language equivalence L(NFA) = L(DFA).
              Theoretical bound 2^|Q| establishes an upper bound, but reachable state cardinality is strictly
              determined by live symbol transitions starting from ε-closure(q₀).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
