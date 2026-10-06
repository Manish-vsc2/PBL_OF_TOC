import React, { useState, useMemo, useCallback } from 'react';
import {
  NFA,
  DFA,
  StateBoundAnalysis,
  PRELOADED_EXAMPLES,
  subsetConstruction,
  calculateStateBound,
  validateNFA,
  minimizeDFA,
} from './algorithms/automata';
import { AutomataGraph } from './components/AutomataGraph';
import { NfaInputSection } from './components/NfaInputSection';
import { VisualCanvasBuilder } from './components/VisualCanvasBuilder';
import { RegexInputModule } from './components/RegexInputModule';
import { DfaMinimizationSection } from './components/DfaMinimizationSection';
import { StateBoundDashboard } from './components/StateBoundDashboard';
import { SubsetWalkthrough } from './components/SubsetWalkthrough';
import { DfaTableSection } from './components/DfaTableSection';
import { StringSimulator } from './components/StringSimulator';
import { PdfExportModal } from './components/PdfExportModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { useTheme } from './components/ThemeContext';
import {
  Sparkles,
  Network,
  Sun,
  Moon,
  Printer,
  Compass,
  Code2,
  Minimize2,
  Play,
  Table as TableIcon,
  CheckCircle2,
  RotateCcw,
  Palette,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // 1. Initial State loaded from the primary textbook example
  const defaultExample = PRELOADED_EXAMPLES[0];
  const [nfa, setNfa] = useState<NFA>(defaultExample.nfa);
  const [highlightStateId, setHighlightStateId] = useState<string | undefined>(undefined);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [graphViewMode, setGraphViewMode] = useState<'dfa' | 'nfa' | 'split'>('dfa');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'canvas' | 'regex' | 'steps' | 'minimization' | 'tables' | 'simulation'
  >('dashboard');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // 2. Validate current NFA input
  const validation = useMemo(() => validateNFA(nfa), [nfa]);

  // 3. Compute Subset Construction, State-Bound Analysis, and Minimization
  const { dfa, steps, boundAnalysis, minimization } = useMemo(() => {
    if (!validation.isValid) {
      const dummyDfa: DFA = {
        states: [],
        alphabet: nfa.alphabet,
        startStateId: '',
        finalStateIds: [],
        transitions: {},
        steps: [],
      };
      const dummyAnalysis: StateBoundAnalysis = {
        qCount: nfa.states.length,
        theoreticalMax: Math.pow(2, nfa.states.length),
        actualDfaStates: 0,
        unreachableSubsets: Math.pow(2, nfa.states.length),
        stateUtilization: 0,
        formulaLatex: '',
        ratioExplanation: 'Awaiting valid configuration',
        dynamicInterpretation: 'Please resolve validation errors to compute subset construction.',
      };
      return { dfa: dummyDfa, steps: [], boundAnalysis: dummyAnalysis, minimization: minimizeDFA(dummyDfa) };
    }

    const { dfa, steps } = subsetConstruction(nfa);
    const boundAnalysis = calculateStateBound(nfa, dfa);
    const minimization = minimizeDFA(dfa);
    return { dfa, steps, boundAnalysis, minimization };
  }, [nfa, validation.isValid]);

  // Handle Load Example
  const handleLoadExample = useCallback((exampleId: string) => {
    const ex = PRELOADED_EXAMPLES.find((e) => e.id === exampleId);
    if (ex) {
      setNfa(JSON.parse(JSON.stringify(ex.nfa)));
      setActiveStepIndex(0);
      setHighlightStateId(undefined);
    }
  }, []);

  // Prepare NFA Graph nodes & edges
  const nfaGraphNodes = useMemo(() => {
    return nfa.states.map((st) => ({
      id: st,
      name: st,
      isStart: st === nfa.startState,
      isFinal: nfa.finalStates.includes(st),
    }));
  }, [nfa]);

  const nfaGraphEdges = useMemo(() => {
    const edges: { from: string; to: string; symbol: string }[] = [];
    for (const [src, symMap] of Object.entries(nfa.transitions)) {
      for (const [sym, targets] of Object.entries(symMap)) {
        for (const tgt of targets) {
          edges.push({ from: src, to: tgt, symbol: sym });
        }
      }
    }
    return edges;
  }, [nfa]);

  // Prepare DFA Graph nodes & edges
  const dfaGraphNodes = useMemo(() => {
    return dfa.states.map((st) => ({
      id: st.id,
      name: st.id,
      subLabel: st.label,
      isStart: st.isStart,
      isFinal: st.isFinal,
    }));
  }, [dfa]);

  const dfaGraphEdges = useMemo(() => {
    const edges: { from: string; to: string; symbol: string }[] = [];
    for (const [src, symMap] of Object.entries(dfa.transitions)) {
      for (const [sym, targetId] of Object.entries(symMap)) {
        if (targetId) {
          edges.push({ from: src, to: targetId, symbol: sym });
        }
      }
    }
    return edges;
  }, [dfa]);

  // Trigger re-analysis / refresh
  const handleAnalyze = () => {
    setActiveStepIndex(0);
    setHighlightStateId(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* PWA Install Notification */}
      <PwaInstallPrompt />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight font-heading">
                TOC Studio
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                NFA State-Bound Analyzer & Minimizer
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Bound Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'canvas'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>Visual Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('regex')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'regex'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Regex to NFA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'steps'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Subset Steps</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('minimization')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'minimization'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>DFA Minimization</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'simulation'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-amber-600" />
              <span>String Tester</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 fill-slate-700 dark:fill-slate-200" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Print / PDF Export */}
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* Run Analysis Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Analysis</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scroll Strip */}
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-200/80 dark:border-slate-800 text-xs font-medium bg-slate-50 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Bound Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              activeTab === 'canvas'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Visual Canvas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('regex')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              activeTab === 'regex'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Regex Synthesizer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              activeTab === 'steps'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Subset Steps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('minimization')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              activeTab === 'minimization'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Minimization
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
              activeTab === 'simulation'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            String Tester
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Project Context Academic Hero Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                TOC PBL Studio
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Rabin-Scott & Hopcroft Algorithms</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-heading">
              NFA to DFA Subset Construction, Hopcroft Minimization & 2^Q State Bound Analyzer
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Evaluating the theoretical powerset cardinality bound 2^|Q| versus empirical reachable state compaction.
              Includes interactive visual automata drawing, regex synthesis, step-by-step partition refinement, and full PDF export.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleLoadExample('ending-abb')}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-colors"
            >
              Reset Example
            </button>
          </div>
        </div>

        {/* TAB 1: BOUND ANALYSIS & OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <NfaInputSection
              nfa={nfa}
              onChangeNfa={setNfa}
              onAnalyze={handleAnalyze}
              onLoadExample={handleLoadExample}
              validationErrors={validation.errors}
            />

            {boundAnalysis && (
              <section id="bound-analysis">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    3. State-Bound Analysis & Powerset Metrics
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">Formula: |Q_D| ≤ 2^|Q|</span>
                </div>
                <StateBoundDashboard analysis={boundAnalysis} />
              </section>
            )}

            {/* Automata Visualizer */}
            <section id="visualization" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Automata State Graph Visualizations
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Compare the original nondeterministic state machine with the synthesized deterministic automaton.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setGraphViewMode('dfa')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      graphViewMode === 'dfa'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    DFA ({dfa.states.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphViewMode('nfa')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      graphViewMode === 'nfa'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    NFA ({nfa.states.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphViewMode('split')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      graphViewMode === 'split'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Side-by-Side
                  </button>
                </div>
              </div>

              {graphViewMode === 'dfa' && (
                <AutomataGraph
                  title="Generated Deterministic Finite Automaton (DFA)"
                  nodes={dfaGraphNodes}
                  edges={dfaGraphEdges}
                  highlightStateId={highlightStateId}
                />
              )}

              {graphViewMode === 'nfa' && (
                <AutomataGraph
                  title="Input Non-deterministic Finite Automaton (NFA)"
                  nodes={nfaGraphNodes}
                  edges={nfaGraphEdges}
                  highlightStateId={highlightStateId}
                />
              )}

              {graphViewMode === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AutomataGraph
                    title="Original NFA"
                    nodes={nfaGraphNodes}
                    edges={nfaGraphEdges}
                    highlightStateId={highlightStateId}
                  />
                  <AutomataGraph
                    title="Equivalent DFA"
                    nodes={dfaGraphNodes}
                    edges={dfaGraphEdges}
                    highlightStateId={highlightStateId}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: VISUAL CANVAS BUILDER */}
        {activeTab === 'canvas' && (
          <div className="space-y-6">
            <VisualCanvasBuilder
              nfa={nfa}
              onChangeNfa={setNfa}
              onAnalyze={handleAnalyze}
            />
            <DfaTableSection dfa={dfa} highlightStateId={highlightStateId} />
          </div>
        )}

        {/* TAB 3: REGEX TO NFA SYNTHESIS */}
        {activeTab === 'regex' && (
          <div className="space-y-6">
            <RegexInputModule
              onLoadGeneratedNfa={(synthesizedNfa) => {
                setNfa(synthesizedNfa);
                handleAnalyze();
                setActiveTab('dashboard');
              }}
            />
            {/* Show synthesized NFA diagram preview */}
            <AutomataGraph
              title="Synthesized Thompson NFA Diagram"
              nodes={nfaGraphNodes}
              edges={nfaGraphEdges}
            />
          </div>
        )}

        {/* TAB 4: STEP-BY-STEP SUBSET TRACE */}
        {activeTab === 'steps' && (
          <div className="space-y-6">
            <SubsetWalkthrough
              dfa={dfa}
              steps={steps}
              activeStepIndex={activeStepIndex}
              onSelectStep={(idx) => {
                setActiveStepIndex(idx);
                const target = steps[idx]?.targetStateId;
                setHighlightStateId(target);
              }}
            />
            <DfaTableSection dfa={dfa} highlightStateId={highlightStateId} />
          </div>
        )}

        {/* TAB 5: DFA MINIMIZATION */}
        {activeTab === 'minimization' && (
          <div className="space-y-6">
            <DfaMinimizationSection dfa={dfa} />
          </div>
        )}

        {/* TAB 6: STRING SIMULATOR */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <StringSimulator
              nfa={nfa}
              dfa={dfa}
              onHighlightState={(stId) => setHighlightStateId(stId)}
            />
            <AutomataGraph
              title="Interactive State Traversal Visualizer"
              nodes={dfaGraphNodes}
              edges={dfaGraphEdges}
              highlightStateId={highlightStateId}
            />
          </div>
        )}

        {/* SECTION: ACADEMIC CONCLUSION & RELEVANCE */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Project Takeaway & Formal Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Mathematical Conclusion:
              </h3>
              <p>
                The subset construction algorithm is optimal for converting general NFAs to deterministic
                DFAs. While the theoretical upper bound 2^|Q| is mathematically sound (powerset cardinality),
                the actual reachable deterministic states (|Q_D| = {boundAnalysis.actualDfaStates}) are
                governed strictly by valid transition connectivity starting from ε-closure(q₀).
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300">
                Formula verified: |Q_D| = {boundAnalysis.actualDfaStates} ≤ 2^{nfa.states.length} ={' '}
                {boundAnalysis.theoreticalMax} (State utilization: {boundAnalysis.stateUtilization}%)
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Practical Systems & Compiler Engineering:
              </h3>
              <p>
                Lexical analyzers (Flex, LLVM) and LLM guided token decoders use NFA-to-DFA conversion
                followed by Hopcroft minimization to construct high-throughput O(1) character transition lookup
                tables that fit inside CPU L1/L2 cache lines.
              </p>
              <p>
                Minimizing this DFA achieves {minimization.reductionPercentage}% reduction, reducing the
                hardware memory footprint without altering accepted language semantics L(M).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">TOC Studio</span>
            <span>·</span>
            <span>Theory of Computation PBL Studio</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Rabin-Scott & Hopcroft Algorithms</span>
          </div>
        </div>
      </footer>

      {/* PDF / Print Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        nfa={nfa}
        dfa={dfa}
        boundAnalysis={boundAnalysis}
        minimizedDfa={minimization}
      />
    </div>
  );
}
