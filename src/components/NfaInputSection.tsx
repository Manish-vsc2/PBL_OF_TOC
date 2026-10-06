import React, { useState } from 'react';
import { NFA, EPSILON, PRELOADED_EXAMPLES } from '../algorithms/automata';
import { Plus, Trash2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface NfaInputSectionProps {
  nfa: NFA;
  onChangeNfa: (updated: NFA) => void;
  onAnalyze: () => void;
  onLoadExample: (exampleId: string) => void;
  validationErrors: string[];
}

export const NfaInputSection: React.FC<NfaInputSectionProps> = ({
  nfa,
  onChangeNfa,
  onAnalyze,
  onLoadExample,
  validationErrors,
}) => {
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('ending-abb');

  // Handle state count changes
  const handleStateCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(count, 8)); // sensible limit for manual table
    const newStates: string[] = [];
    for (let i = 0; i < validCount; i++) {
      newStates.push(`q${i}`);
    }

    // Preserve existing transitions where possible
    const newTransitions: Record<string, Record<string, string[]>> = {};
    for (const s of newStates) {
      newTransitions[s] = {};
      for (const sym of [...nfa.alphabet, EPSILON]) {
        const existing = nfa.transitions[s]?.[sym] || [];
        // Keep only targets that exist in newStates
        newTransitions[s][sym] = existing.filter((t) => newStates.includes(t));
      }
    }

    const startState = newStates.includes(nfa.startState) ? nfa.startState : newStates[0];
    const finalStates = nfa.finalStates.filter((s) => newStates.includes(s));

    onChangeNfa({
      states: newStates,
      alphabet: nfa.alphabet,
      startState,
      finalStates,
      transitions: newTransitions,
    });
  };

  // Add individual state
  const handleAddState = () => {
    const nextIdx = nfa.states.length;
    const newStateName = `q${nextIdx}`;
    if (nfa.states.includes(newStateName)) return;

    const newStates = [...nfa.states, newStateName];
    const newTransitions = { ...nfa.transitions, [newStateName]: {} };

    onChangeNfa({
      ...nfa,
      states: newStates,
      transitions: newTransitions,
    });
  };

  // Remove specific state
  const handleRemoveState = (stateToRemove: string) => {
    if (nfa.states.length <= 1) return;
    const newStates = nfa.states.filter((s) => s !== stateToRemove);
    const newTransitions: Record<string, Record<string, string[]>> = {};

    for (const s of newStates) {
      newTransitions[s] = {};
      for (const sym of [...nfa.alphabet, EPSILON]) {
        const targets = nfa.transitions[s]?.[sym] || [];
        newTransitions[s][sym] = targets.filter((t) => t !== stateToRemove);
      }
    }

    const startState = nfa.startState === stateToRemove ? newStates[0] : nfa.startState;
    const finalStates = nfa.finalStates.filter((s) => s !== stateToRemove);

    onChangeNfa({
      states: newStates,
      alphabet: nfa.alphabet,
      startState,
      finalStates,
      transitions: newTransitions,
    });
  };

  // Add alphabet symbol
  const handleAddSymbol = () => {
    const sym = newSymbolInput.trim();
    if (!sym || sym === EPSILON || nfa.alphabet.includes(sym)) return;

    const newAlphabet = [...nfa.alphabet, sym];
    setNewSymbolInput('');
    onChangeNfa({
      ...nfa,
      alphabet: newAlphabet,
    });
  };

  // Remove alphabet symbol
  const handleRemoveSymbol = (symToRemove: string) => {
    if (nfa.alphabet.length <= 1) return;
    const newAlphabet = nfa.alphabet.filter((s) => s !== symToRemove);
    onChangeNfa({
      ...nfa,
      alphabet: newAlphabet,
    });
  };

  // Toggle Final State
  const toggleFinalState = (st: string) => {
    const exists = nfa.finalStates.includes(st);
    const updated = exists ? nfa.finalStates.filter((s) => s !== st) : [...nfa.finalStates, st];
    onChangeNfa({
      ...nfa,
      finalStates: updated,
    });
  };

  // Handle cell transition edit (comma separated or multi-input)
  const handleCellChange = (fromState: string, symbol: string, value: string) => {
    // Parse targets: comma-separated or space-separated
    const targets = value
      .split(/[, \t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && nfa.states.includes(s));

    const updatedTransitions = { ...nfa.transitions };
    if (!updatedTransitions[fromState]) {
      updatedTransitions[fromState] = {};
    }
    updatedTransitions[fromState] = {
      ...updatedTransitions[fromState],
      [symbol]: targets,
    };

    onChangeNfa({
      ...nfa,
      transitions: updatedTransitions,
    });
  };

  // Fast toggle a target state inside a transition cell
  const toggleTargetInCell = (fromState: string, symbol: string, targetState: string) => {
    const currTargets = nfa.transitions[fromState]?.[symbol] || [];
    const exists = currTargets.includes(targetState);
    const updatedTargets = exists
      ? currTargets.filter((t) => t !== targetState)
      : [...currTargets, targetState].sort();

    const updatedTransitions = { ...nfa.transitions };
    if (!updatedTransitions[fromState]) {
      updatedTransitions[fromState] = {};
    }
    updatedTransitions[fromState] = {
      ...updatedTransitions[fromState],
      [symbol]: updatedTargets,
    };

    onChangeNfa({
      ...nfa,
      transitions: updatedTransitions,
    });
  };

  return (
    <div className="space-y-6">
      {/* Example Presets Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">1. NFA Configuration & Setup</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify the 5-tuple NFA formal definition: (Q, Σ, δ, q₀, F) with optional ε-transitions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select preloaded example NFA"
              value={selectedPresetId}
              onChange={(e) => {
                setSelectedPresetId(e.target.value);
                onLoadExample(e.target.value);
              }}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              {PRELOADED_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  Load: {ex.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onLoadExample(selectedPresetId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Load Preset</span>
            </button>
          </div>
        </div>

        {/* 5-Tuple Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          {/* 1. States Q */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                States Q ({nfa.states.length})
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Max 8</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="8"
                aria-label="Number of NFA states"
                value={nfa.states.length}
                onChange={(e) => handleStateCountChange(parseInt(e.target.value) || 1)}
                className="w-20 text-xs text-center font-mono font-medium border border-slate-300 rounded-lg py-1.5 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleAddState}
                disabled={nfa.states.length >= 8}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>State</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
              {nfa.states.map((st) => (
                <span
                  key={st}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {st}
                  {nfa.states.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove state ${st}`}
                      onClick={() => handleRemoveState(st)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Alphabet Symbols Σ */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Alphabet Σ ({nfa.alphabet.length})
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Sym"
                maxLength={2}
                value={newSymbolInput}
                onChange={(e) => setNewSymbolInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                className="w-16 text-xs text-center font-mono border border-slate-300 rounded-lg py-1.5 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleAddSymbol}
                disabled={!newSymbolInput.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {nfa.alphabet.map((sym) => (
                <span
                  key={sym}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {sym}
                  {nfa.alphabet.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove symbol ${sym}`}
                      onClick={() => handleRemoveSymbol(sym)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {EPSILON} (ε-moves)
              </span>
            </div>
          </div>

          {/* 3. Initial State q0 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Start State (q₀)</label>
            <select
              aria-label="Select start state"
              value={nfa.startState}
              onChange={(e) => onChangeNfa({ ...nfa, startState: e.target.value })}
              className="w-full text-xs font-mono font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              {nfa.states.map((st) => (
                <option key={st} value={st}>
                  {st} (Initial)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Initial subset D₀ will be ε-closure({nfa.startState})
            </p>
          </div>

          {/* 4. Accepting States F */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Final / Accepting States F
            </label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {nfa.states.map((st) => {
                const isAccept = nfa.finalStates.includes(st);
                return (
                  <button
                    type="button"
                    key={st}
                    onClick={() => toggleFinalState(st)}
                    className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md transition-colors border ${
                      isAccept
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isAccept ? `*${st}` : st}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Click state to toggle acceptance status (*)
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: NFA Transition Table Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">2. NFA Transition Table (δ)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter target state subsets for each (state, symbol) pair. Multiple transitions denote
              nondeterminism. Click state tags below inputs for 1-click toggling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAnalyze}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Analysis</span>
            </button>
          </div>
        </div>

        {/* Validation Errors Box if any */}
        {validationErrors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Validation Warning:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Transition Matrix Grid */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-32">
                  State (Q)
                </th>
                {nfa.alphabet.map((sym) => (
                  <th key={sym} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">
                    δ(q, {sym})
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                  δ(q, ε)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono bg-white dark:bg-slate-900">
              {nfa.states.map((st) => {
                const isStart = nfa.startState === st;
                const isFinal = nfa.finalStates.includes(st);

                return (
                  <tr key={st} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Row Header: State Info */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        {isStart && <span className="text-blue-600 font-bold">➔</span>}
                        {isFinal && <span className="text-slate-900 dark:text-white font-bold">*</span>}
                        <span>{st}</span>
                        {isFinal && (
                          <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1 py-0.2 rounded font-sans font-normal border border-blue-200 dark:border-blue-800">
                            final
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alphabet columns */}
                    {nfa.alphabet.map((sym) => {
                      const currentTargets = nfa.transitions[st]?.[sym] || [];
                      const valueStr = currentTargets.join(', ');

                      return (
                        <td key={sym} className="py-2 px-2.5 border-r border-slate-200 dark:border-slate-700 align-top">
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="∅"
                              value={valueStr}
                              onChange={(e) => handleCellChange(st, sym, e.target.value)}
                              className="w-full text-xs font-mono font-medium px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                            />
                            {/* Fast-pick state toggles */}
                            <div className="flex flex-wrap gap-1">
                              {nfa.states.map((targetCandidate) => {
                                const isSelected = currentTargets.includes(targetCandidate);
                                return (
                                  <button
                                    type="button"
                                    key={targetCandidate}
                                    onClick={() => toggleTargetInCell(st, sym, targetCandidate)}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
                                      isSelected
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {targetCandidate}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Epsilon Column */}
                    <td className="py-2 px-2.5 bg-amber-50/30 dark:bg-amber-950/20 align-top">
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="∅"
                          value={(nfa.transitions[st]?.[EPSILON] || []).join(', ')}
                          onChange={(e) => handleCellChange(st, EPSILON, e.target.value)}
                          className="w-full text-xs font-mono font-medium px-2 py-1 bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800/80 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        />
                        <div className="flex flex-wrap gap-1">
                          {nfa.states.map((targetCandidate) => {
                            const isSelected = (nfa.transitions[st]?.[EPSILON] || []).includes(
                              targetCandidate
                            );
                            return (
                              <button
                                type="button"
                                key={targetCandidate}
                                onClick={() => toggleTargetInCell(st, EPSILON, targetCandidate)}
                                className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
                                  isSelected
                                    ? 'bg-amber-600 text-white font-bold'
                                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                                }`}
                              >
                                {targetCandidate}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
