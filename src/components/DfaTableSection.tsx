import React, { useState } from 'react';
import { DFA } from '../algorithms/automata';
import { Download, Copy, Check } from 'lucide-react';

interface DfaTableSectionProps {
  dfa: DFA;
  highlightStateId?: string;
}

export const DfaTableSection: React.FC<DfaTableSectionProps> = ({ dfa, highlightStateId }) => {
  const [copied, setCopied] = useState(false);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['DFA State', 'Equivalent NFA Subset', ...dfa.alphabet.map((s) => `δ(${s})`), 'Type'];
    const rows = dfa.states.map((st) => {
      const typeStr = [st.isStart ? 'Start' : '', st.isFinal ? 'Accepting' : '']
        .filter(Boolean)
        .join('/') || 'Normal';

      const trans = dfa.alphabet.map((sym) => dfa.transitions[st.id]?.[sym] || '∅');
      return [st.id, `"${st.label}"`, ...trans, typeStr];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'dfa_transition_table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Markdown Table
  const handleCopyMarkdown = () => {
    const headers = ['DFA State', 'NFA Subset', ...dfa.alphabet.map((s) => `δ(${s})`), 'Status'];
    const dividers = headers.map(() => '---');
    const rows = dfa.states.map((st) => {
      const status = `${st.isStart ? '→ Start ' : ''}${st.isFinal ? '* Final' : ''}`.trim() || 'Normal';
      const trans = dfa.alphabet.map((sym) => dfa.transitions[st.id]?.[sym] || '∅');
      return `| ${st.id} | ${st.label} | ${trans.join(' | ')} | ${status} |`;
    });

    const md = `| ${headers.join(' | ')} |\n| ${dividers.join(' | ')} |\n${rows.join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">5. DFA Transition Table</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Formal deterministic transition table mapping canonical state identifiers to their
            constituent NFA subsets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied MD' : 'Copy Table'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-xs text-left border-collapse font-mono">
          <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-4 w-28">DFA State</th>
              <th className="py-2.5 px-4">Equivalent NFA Subset</th>
              {dfa.alphabet.map((sym) => (
                <th key={sym} className="py-2.5 px-4 text-center">
                  δ({sym})
                </th>
              ))}
              <th className="py-2.5 px-4 text-right">Accepting?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {dfa.states.map((st) => {
              const isHighlight = highlightStateId === st.id;

              return (
                <tr
                  key={st.id}
                  className={`transition-colors ${
                    isHighlight
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 font-semibold text-blue-900 dark:text-blue-300'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      {st.isStart && <span className="text-blue-600 font-bold" title="Start State">➔</span>}
                      {st.isFinal && <span className="text-slate-900 dark:text-white font-bold" title="Accepting State">*</span>}
                      <span>{st.id}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">{st.label}</span>
                    {st.nfaStates.length === 0 && (
                      <span className="text-slate-400 font-sans ml-2 text-[11px]">(Dead / Trap state)</span>
                    )}
                  </td>

                  {dfa.alphabet.map((sym) => {
                    const targetId = dfa.transitions[st.id]?.[sym];
                    const targetState = dfa.states.find((s) => s.id === targetId);

                    return (
                      <td key={sym} className="py-2.5 px-4 text-center">
                        {targetId ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              targetState?.isFinal
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {targetId}
                          </span>
                        ) : (
                          <span className="text-slate-400">∅</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-4 text-right font-sans">
                    {st.isFinal ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        ● Accepting
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Non-accepting</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="text-blue-600 font-bold">➔</span> Initial State
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-900 dark:text-white font-bold">*</span> Final / Accepting State
          </span>
        </div>
        <span>Total DFA States Generated: {dfa.states.length}</span>
      </div>
    </div>
  );
};
