import React, { useState } from 'react';
import { regexToNfa, NFA } from '../algorithms/automata';
import { Sparkles, ArrowRight, BookOpen, AlertCircle, CheckCircle2, Code2, Layers } from 'lucide-react';

interface RegexInputModuleProps {
  onLoadGeneratedNfa: (nfa: NFA) => void;
}

const SAMPLE_REGEXES = [
  { label: '(a|b)*abb', desc: 'Ends in abb', regex: '(a|b)*abb' },
  { label: '(0+1)*00', desc: 'Binary ends in 00', regex: '(0+1)*00' },
  { label: '(a|b)*a(a|b)', desc: '2nd from end is a', regex: '(a|b)*a(a|b)' },
  { label: 'a*b*c*', desc: 'Ordered characters', regex: 'a*b*c*' },
  { label: '(ab|ba)*', desc: 'Alternating pairs', regex: '(ab|ba)*' },
];

export const RegexInputModule: React.FC<RegexInputModuleProps> = ({ onLoadGeneratedNfa }) => {
  const [regexStr, setRegexStr] = useState('(a|b)*abb');
  const [applied, setApplied] = useState(false);

  const conversionResult = React.useMemo(() => {
    return regexToNfa(regexStr);
  }, [regexStr]);

  const handleApplyToAnalyzer = () => {
    if (!conversionResult.error && conversionResult.nfa) {
      onLoadGeneratedNfa(conversionResult.nfa);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Regular Expression to NFA (Thompson's Construction)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transform regular expressions into ε-NFAs using Thompson's structural recursion algorithm.
            </p>
          </div>
        </div>

        {/* Preset quick chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Presets:</span>
          {SAMPLE_REGEXES.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => setRegexStr(item.regex)}
              className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={regexStr}
            onChange={(e) => setRegexStr(e.target.value)}
            placeholder="e.g. (a|b)*abb, (0+1)*00..."
            className="w-full text-sm font-mono font-medium px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
          />
        </div>

        <button
          type="button"
          onClick={handleApplyToAnalyzer}
          disabled={!!conversionResult.error}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all whitespace-nowrap ${
            applied
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 disabled:opacity-50'
          }`}
        >
          {applied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Loaded into Analyzer!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Synthesize & Analyze NFA</span>
            </>
          )}
        </button>
      </div>

      {/* Error or Postfix & Synthesized stats */}
      {conversionResult.error ? (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{conversionResult.error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Postfix Shunting-Yard Tokenization
            </span>
            <div className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">
              {conversionResult.postfix}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Generated NFA 5-Tuple Size
            </span>
            <div className="font-mono text-slate-800 dark:text-slate-200 font-bold">
              |Q| = {conversionResult.nfa.states.length} states · |Σ| = {conversionResult.nfa.alphabet.length} symbols
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Start & Final States
            </span>
            <div className="font-mono text-slate-800 dark:text-slate-200">
              Start: <span className="font-bold text-blue-600 dark:text-blue-400">{conversionResult.nfa.startState}</span> · 
              Final: <span className="font-bold text-emerald-600 dark:text-emerald-400">{conversionResult.nfa.finalStates.join(', ')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
