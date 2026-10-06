import React, { useState, useEffect } from 'react';
import { SubsetStep, DFA } from '../algorithms/automata';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, CheckCircle, PlusCircle } from 'lucide-react';

interface SubsetWalkthroughProps {
  dfa: DFA;
  steps: SubsetStep[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
}

export const SubsetWalkthrough: React.FC<SubsetWalkthroughProps> = ({
  dfa,
  steps,
  activeStepIndex,
  onSelectStep,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterSymbol, setFilterSymbol] = useState<string>('all');

  // Auto-play interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying) {
      timer = setInterval(() => {
        if (activeStepIndex >= steps.length - 1) {
          setIsPlaying(false);
        } else {
          onSelectStep(activeStepIndex + 1);
        }
      }, 1400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, steps.length, activeStepIndex, onSelectStep]);

  const currentStep = steps[activeStepIndex] || steps[0];

  const filteredSteps = steps.filter((step) => {
    if (filterSymbol !== 'all' && step.symbol !== filterSymbol) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-5 transition-colors">
      {/* Top Header & Playback Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Step-by-Step Subset Construction Walkthrough
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trace the exact evaluation of move(T, a) and ε-closure for each state subset.
          </p>
        </div>

        {/* Stepper Controller */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSelectStep(0)}
            disabled={activeStepIndex === 0}
            title="Reset to Step 1"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectStep(Math.max(0, activeStepIndex - 1))}
            disabled={activeStepIndex === 0}
            title="Previous Step"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Trace</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectStep(Math.min(steps.length - 1, activeStepIndex + 1))}
            disabled={activeStepIndex >= steps.length - 1}
            title="Next Step"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 ml-2">
            Step {activeStepIndex + 1} / {steps.length}
          </span>
        </div>
      </div>

      {/* Active Step Detailed Inspector Card */}
      {currentStep && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-600 text-white">
                Step {currentStep.stepNumber}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Evaluating source state {currentStep.sourceStateId} on input '{currentStep.symbol}'
              </span>
            </div>

            {currentStep.isNewState ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New DFA State: {currentStep.targetStateId}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Reused Existing State: {currentStep.targetStateId}</span>
              </span>
            )}
          </div>

          {/* Mathematical Expansion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block mb-0.5">1. Source Subset</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentStep.sourceStateId} = {'{'}
                {currentStep.sourceNfaStates.join(', ')}
                {'}'}
              </span>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block mb-0.5">
                2. Direct move({currentStep.sourceStateId}, '{currentStep.symbol}')
              </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">
                {currentStep.moveResult.length > 0 ? `{${currentStep.moveResult.join(', ')}}` : '∅'}
              </span>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block mb-0.5">
                3. ε-closure(move) ➔ Target State
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-400">
                {currentStep.targetStateId} ={' '}
                {currentStep.closureResult.length > 0
                  ? `{${currentStep.closureResult.join(', ')}}`
                  : '∅'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {currentStep.explanation}
          </div>
        </div>
      )}

      {/* Full Construction Trace Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">All Expansion Steps ({steps.length})</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Filter symbol:</span>
            <select
              aria-label="Filter steps by symbol"
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All ({dfa.alphabet.join(', ')})</option>
              {dfa.alphabet.map((s) => (
                <option key={s} value={s}>
                  Symbol '{s}'
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-2 px-3 w-16">Step</th>
                <th className="py-2 px-3">Source DFA State</th>
                <th className="py-2 px-3 text-center w-16">Symbol</th>
                <th className="py-2 px-3">move(T, a)</th>
                <th className="py-2 px-3">ε-closure</th>
                <th className="py-2 px-3">Target State</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredSteps.map((step, idx) => {
                const isSelected = steps.indexOf(step) === activeStepIndex;

                return (
                  <tr
                    key={step.stepNumber}
                    onClick={() => onSelectStep(steps.indexOf(step))}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 font-semibold text-blue-900 dark:text-blue-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{step.stepNumber}</td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-900 dark:text-white mr-1.5">{step.sourceStateId}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal">
                        {'{'}
                        {step.sourceNfaStates.join(', ')}
                        {'}'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-indigo-700 dark:text-indigo-400">
                      {step.symbol}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                      {step.moveResult.length > 0 ? `{${step.moveResult.join(', ')}}` : '∅'}
                    </td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                      {step.closureResult.length > 0 ? `{${step.closureResult.join(', ')}}` : '∅'}
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{step.targetStateId}</td>
                    <td className="py-2 px-3 text-right">
                      {step.isNewState ? (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          + New
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Reused</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
