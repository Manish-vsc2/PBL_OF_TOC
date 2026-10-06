/**
 * NFA to DFA Subset Construction Algorithm and State-Bound Analysis
 * Theory of Computation / Formal Languages & Automata Theory
 */

export const EPSILON = 'ε';

export interface NFA {
  states: string[];
  alphabet: string[];
  startState: string;
  finalStates: string[];
  // transitions[state][symbol] = array of target states
  transitions: Record<string, Record<string, string[]>>;
}

export interface DFAState {
  id: string; // e.g. "D0", "D1", "TRAP"
  label: string; // formatted e.g. "{q0, q1}"
  nfaStates: string[]; // sorted array of states
  isStart: boolean;
  isFinal: boolean;
}

export interface DFATransition {
  from: string;
  symbol: string;
  to: string;
}

export interface SubsetStep {
  stepNumber: number;
  sourceStateId: string;
  sourceNfaStates: string[];
  symbol: string;
  moveResult: string[];
  closureResult: string[];
  targetStateId: string;
  isNewState: boolean;
  explanation: string;
}

export interface DFA {
  states: DFAState[];
  alphabet: string[];
  startStateId: string;
  finalStateIds: string[];
  // transitions[stateId][symbol] = target stateId
  transitions: Record<string, Record<string, string>>;
  steps: SubsetStep[];
}

export interface StateBoundAnalysis {
  qCount: number;
  theoreticalMax: number; // 2^Q
  actualDfaStates: number;
  unreachableSubsets: number;
  stateUtilization: number; // (actual / 2^Q) * 100
  formulaLatex: string;
  ratioExplanation: string;
  dynamicInterpretation: string;
}

/**
 * Computes epsilon-closure of a given set of NFA states.
 * ε-closure(T) is the set of all NFA states reachable from any state in T
 * on zero or more epsilon transitions.
 */
export function epsilonClosure(states: string[], nfa: NFA): string[] {
  const closureSet = new Set<string>(states);
  const queue: string[] = [...states];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const epsTransitions = nfa.transitions[curr]?.[EPSILON] || [];

    for (const nextState of epsTransitions) {
      if (!closureSet.has(nextState)) {
        closureSet.add(nextState);
        queue.push(nextState);
      }
    }
  }

  return Array.from(closureSet).sort();
}

/**
 * Computes direct transitions from a set of states on a given input symbol.
 * move(T, a) = ⋃ { δ(s, a) | s ∈ T }
 */
export function move(states: string[], symbol: string, nfa: NFA): string[] {
  const result = new Set<string>();

  for (const state of states) {
    const targets = nfa.transitions[state]?.[symbol] || [];
    for (const target of targets) {
      result.add(target);
    }
  }

  return Array.from(result).sort();
}

/**
 * Helper to turn a state array into a canonical string key.
 */
export function stateSetToKey(states: string[]): string {
  if (states.length === 0) return '∅';
  return states.slice().sort().join(',');
}

/**
 * Formats a state array into formal set notation {q0, q1}.
 */
export function formatStateSet(states: string[]): string {
  if (states.length === 0) return '∅';
  return `{${states.slice().sort().join(', ')}}`;
}

/**
 * Runs the complete Subset Construction (Powerset Construction) algorithm.
 * Dynamically converts NFA to DFA, logging every single algorithmic step.
 */
export function subsetConstruction(nfa: NFA): { dfa: DFA; steps: SubsetStep[] } {
  const steps: SubsetStep[] = [];
  const stateMap = new Map<string, DFAState>();
  const transitions: Record<string, Record<string, string>> = {};

  // 1. Initial State: ε-closure({startState})
  const initialClosure = epsilonClosure([nfa.startState], nfa);
  const initialKey = stateSetToKey(initialClosure);

  let stateCounter = 0;
  const initialStateId = `D${stateCounter++}`;
  const isInitialFinal = initialClosure.some((s) => nfa.finalStates.includes(s));

  const startDfaState: DFAState = {
    id: initialStateId,
    label: formatStateSet(initialClosure),
    nfaStates: initialClosure,
    isStart: true,
    isFinal: isInitialFinal,
  };

  stateMap.set(initialKey, startDfaState);
  transitions[initialStateId] = {};

  const queue: DFAState[] = [startDfaState];
  let stepIndex = 1;

  // Track if empty trap state is generated
  let trapStateCreated = false;
  let trapStateId = '';

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const symbol of nfa.alphabet) {
      // 2. Compute move(current, symbol)
      const moveResult = move(current.nfaStates, symbol, nfa);

      // 3. Compute ε-closure(moveResult)
      const closureResult = epsilonClosure(moveResult, nfa);
      const targetKey = stateSetToKey(closureResult);

      let targetDfaState = stateMap.get(targetKey);
      let isNew = false;

      if (!targetDfaState) {
        isNew = true;
        let newId: string;

        if (closureResult.length === 0) {
          // Dead / Trap state
          newId = trapStateCreated ? trapStateId : `D${stateCounter++}`;
          trapStateCreated = true;
          trapStateId = newId;
        } else {
          newId = `D${stateCounter++}`;
        }

        const isFinal = closureResult.some((s) => nfa.finalStates.includes(s));
        targetDfaState = {
          id: newId,
          label: formatStateSet(closureResult),
          nfaStates: closureResult,
          isStart: false,
          isFinal: isFinal,
        };

        stateMap.set(targetKey, targetDfaState);
        transitions[newId] = {};
        queue.push(targetDfaState);
      }

      // Record transition
      transitions[current.id][symbol] = targetDfaState.id;

      // Explanation string for pedagogy
      const moveStr = moveResult.length > 0 ? `{${moveResult.join(', ')}}` : '∅';
      const closureStr = closureResult.length > 0 ? `{${closureResult.join(', ')}}` : '∅';
      const exp =
        `move(${current.id}, '${symbol}') = ${moveStr} ➔ ` +
        `ε-closure(${moveStr}) = ${closureStr} (${targetDfaState.id})${isNew ? ' [New DFA state discovered]' : ' [Existing state reused]'}`;

      steps.push({
        stepNumber: stepIndex++,
        sourceStateId: current.id,
        sourceNfaStates: current.nfaStates,
        symbol: symbol,
        moveResult: moveResult,
        closureResult: closureResult,
        targetStateId: targetDfaState.id,
        isNewState: isNew,
        explanation: exp,
      });
    }
  }

  const dfaStates = Array.from(stateMap.values());
  const finalStateIds = dfaStates.filter((s) => s.isFinal).map((s) => s.id);

  const dfa: DFA = {
    states: dfaStates,
    alphabet: [...nfa.alphabet],
    startStateId: initialStateId,
    finalStateIds: finalStateIds,
    transitions: transitions,
    steps: steps,
  };

  return { dfa, steps };
}

/**
 * Top-level wrapper to generate DFA.
 */
export function generateDFA(nfa: NFA): DFA {
  const { dfa } = subsetConstruction(nfa);
  return dfa;
}

/**
 * Computes state-bound metrics and qualitative academic interpretation.
 */
export function calculateStateBound(nfa: NFA, dfa: DFA): StateBoundAnalysis {
  const qCount = nfa.states.length;
  // Handle theoretical upper bound 2^Q
  const theoreticalMax = Math.pow(2, qCount);
  const actualDfaStates = dfa.states.length;
  const unreachableSubsets = Math.max(0, theoreticalMax - actualDfaStates);
  const stateUtilization = Number(((actualDfaStates / theoreticalMax) * 100).toFixed(2));

  let ratioExplanation = '';
  if (stateUtilization < 30) {
    ratioExplanation = 'Sparse Reachability: High structural pruning during subset expansion.';
  } else if (stateUtilization < 70) {
    ratioExplanation = 'Moderate Reachability: Typical regular grammar state compaction.';
  } else {
    ratioExplanation = 'High Reachability: Tight subset bounds approaching worst-case powerset explosion.';
  }

  // Dynamic interpretation text based on calculated metrics
  const dynamicInterpretation =
    `The input NFA contains |Q| = ${qCount} states, establishing a theoretical maximum powerset bound of ` +
    `2^|Q| = 2^${qCount} = ${theoreticalMax} possible DFA states (cardinality of the powerset 𝒫(Q)). ` +
    `Upon executing the Subset Construction algorithm starting from ε-closure(${nfa.startState}) = ${dfa.states[0]?.label || ''}, ` +
    `only ${actualDfaStates} state subset${actualDfaStates === 1 ? '' : 's'} are reachable along valid transition paths. ` +
    `The remaining ${unreachableSubsets} subset${unreachableSubsets === 1 ? '' : 's'} (${(100 - stateUtilization).toFixed(1)}%) are unreachable ` +
    `from the initial state and are eliminated. The state utilization rate is ${stateUtilization}%, ` +
    `verifying that the actual deterministic automaton is significantly more compact than the theoretical worst-case bound.`;

  return {
    qCount,
    theoreticalMax,
    actualDfaStates,
    unreachableSubsets,
    stateUtilization,
    formulaLatex: `|Q_D| \\le 2^{|Q_N|} = 2^{${qCount}} = ${theoreticalMax}`,
    ratioExplanation,
    dynamicInterpretation,
  };
}

/**
 * Validates NFA configuration with clear, informative error reporting.
 */
export function validateNFA(input: Partial<NFA>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.states || input.states.length === 0) {
    errors.push('NFA must have at least one state.');
  }

  if (!input.alphabet || input.alphabet.length === 0) {
    errors.push('Alphabet must contain at least one symbol.');
  }

  const stateSet = new Set(input.states || []);
  if (input.states && stateSet.size !== input.states.length) {
    errors.push('State names must be distinct; duplicate names found.');
  }

  if (!input.startState || !stateSet.has(input.startState)) {
    errors.push(`Start state "${input.startState || ''}" must be one of the defined NFA states.`);
  }

  if (input.finalStates) {
    for (const fs of input.finalStates) {
      if (!stateSet.has(fs)) {
        errors.push(`Accepting state "${fs}" is not in the declared states list.`);
      }
    }
  }

  // Check transitions for invalid references
  if (input.transitions) {
    const validSymbols = new Set([...(input.alphabet || []), EPSILON]);
    for (const [srcState, symMap] of Object.entries(input.transitions)) {
      if (!stateSet.has(srcState)) {
        errors.push(`Transition defined for unknown source state: "${srcState}".`);
      }
      for (const [sym, targets] of Object.entries(symMap)) {
        if (!validSymbols.has(sym)) {
          errors.push(`Transition on unknown symbol "${sym}" from state "${srcState}".`);
        }
        for (const tgt of targets) {
          if (!stateSet.has(tgt)) {
            errors.push(`Target state "${tgt}" in transition δ(${srcState}, ${sym}) is not defined in NFA states.`);
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Simulates string acceptance on both NFA and DFA simultaneously.
 */
export function simulateString(
  nfa: NFA,
  dfa: DFA,
  inputStr: string
): {
  acceptedDfa: boolean;
  acceptedNfa: boolean;
  dfaTrace: { stateId: string; stateLabel: string; symbol?: string }[];
  isMatch: boolean;
} {
  const cleanStr = inputStr.trim();
  const dfaTrace: { stateId: string; stateLabel: string; symbol?: string }[] = [];

  let currDfaId = dfa.startStateId;
  let currDfaState = dfa.states.find((s) => s.id === currDfaId)!;
  dfaTrace.push({ stateId: currDfaId, stateLabel: currDfaState.label });

  let acceptedDfa = false;
  let hasBrokenDfa = false;

  for (let i = 0; i < cleanStr.length; i++) {
    const sym = cleanStr[i];
    const nextDfaId = dfa.transitions[currDfaId]?.[sym];

    if (!nextDfaId) {
      hasBrokenDfa = true;
      break;
    }

    currDfaId = nextDfaId;
    currDfaState = dfa.states.find((s) => s.id === currDfaId)!;
    dfaTrace.push({ stateId: currDfaId, stateLabel: currDfaState?.label || '∅', symbol: sym });
  }

  if (!hasBrokenDfa && currDfaState?.isFinal) {
    acceptedDfa = true;
  }

  // NFA string evaluation via BFS
  let currentNfaStates = epsilonClosure([nfa.startState], nfa);
  for (let i = 0; i < cleanStr.length; i++) {
    const sym = cleanStr[i];
    const moved = move(currentNfaStates, sym, nfa);
    currentNfaStates = epsilonClosure(moved, nfa);
  }
  const acceptedNfa = currentNfaStates.some((s) => nfa.finalStates.includes(s));

  return {
    acceptedDfa,
    acceptedNfa,
    dfaTrace,
    isMatch: acceptedDfa === acceptedNfa,
  };
}

/**
 * Curated Pre-loaded Examples for Academic Demonstration
 */
export interface PreloadedExample {
  id: string;
  name: string;
  description: string;
  nfa: NFA;
  technicalNote: string;
}

export const PRELOADED_EXAMPLES: PreloadedExample[] = [
  {
    id: 'ending-abb',
    name: 'Ending in "abb" — (a+b)*abb',
    description: 'Classic textbook NFA with 4 states. Demonstrates 25% state utilization (4 of 16 states).',
    technicalNote: 'Notice how the loop on q0 allows nondeterminism, but only 4 subsets {q0}, {q0,q1}, {q0,q2}, and {q0,q3} are ever reachable.',
    nfa: {
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a', 'b'],
      startState: 'q0',
      finalStates: ['q3'],
      transitions: {
        q0: {
          a: ['q0', 'q1'],
          b: ['q0'],
        },
        q1: {
          b: ['q2'],
        },
        q2: {
          b: ['q3'],
        },
        q3: {},
      },
    },
  },
  {
    id: 'epsilon-pattern',
    name: 'Epsilon NFA — 0*1*2*',
    description: 'Demonstrates cascading ε-closure propagation across 3 states.',
    technicalNote: 'The start state ε-closure captures {q0, q1, q2} immediately, showing how epsilon links collapse subsets in step 0.',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1', '2'],
      startState: 'q0',
      finalStates: ['q2'],
      transitions: {
        q0: {
          '0': ['q0'],
          [EPSILON]: ['q1'],
        },
        q1: {
          '1': ['q1'],
          [EPSILON]: ['q2'],
        },
        q2: {
          '2': ['q2'],
        },
      },
    },
  },
  {
    id: 'exponential-near-bound',
    name: 'High State Explosion — (a|b)*a(a|b)',
    description: 'Language where 2nd symbol from end is "a". DFA states reach 4 subsets out of 8 (50% utilization).',
    technicalNote: 'Demonstrates how tracking historical symbol offsets requires exponentially more subset memory.',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      startState: 'q0',
      finalStates: ['q2'],
      transitions: {
        q0: {
          a: ['q0', 'q1'],
          b: ['q0'],
        },
        q1: {
          a: ['q2'],
          b: ['q2'],
        },
        q2: {},
      },
    },
  },
  {
    id: 'union-epsilon',
    name: 'NFA Union — (ab | ba)',
    description: 'Demonstrates branching starting from a single initial state via ε-transitions to parallel branches.',
    technicalNote: 'Start state ε-closure splits the nondeterministic branch path right at initialization.',
    nfa: {
      states: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'],
      alphabet: ['a', 'b'],
      startState: 'q0',
      finalStates: ['q5'],
      transitions: {
        q0: {
          [EPSILON]: ['q1', 'q3'],
        },
        q1: {
          a: ['q2'],
        },
        q2: {
          b: ['q5'],
        },
        q3: {
          b: ['q4'],
        },
        q4: {
          a: ['q5'],
        },
        q5: {},
      },
    },
  },
];

// ==========================================
// REGEX TO NFA (THOMPSON'S CONSTRUCTION)
// ==========================================

interface NfaFragment {
  start: number;
  accept: number;
  states: Set<number>;
  transitions: Map<number, Map<string, Set<number>>>;
}

function createFragment(stateCounter: { val: number }, symbol?: string): NfaFragment {
  const s = stateCounter.val++;
  const a = stateCounter.val++;
  const transitions = new Map<number, Map<string, Set<number>>>();
  const addTrans = (from: number, sym: string, to: number) => {
    if (!transitions.has(from)) transitions.set(from, new Map());
    const m = transitions.get(from)!;
    if (!m.has(sym)) m.set(sym, new Set());
    m.get(sym)!.add(to);
  };

  if (symbol !== undefined) {
    addTrans(s, symbol, a);
  }

  return {
    start: s,
    accept: a,
    states: new Set([s, a]),
    transitions,
  };
}

function mergeTransitions(
  target: Map<number, Map<string, Set<number>>>,
  source: Map<number, Map<string, Set<number>>>
) {
  for (const [from, map] of source.entries()) {
    if (!target.has(from)) target.set(from, new Map());
    const tMap = target.get(from)!;
    for (const [sym, set] of map.entries()) {
      if (!tMap.has(sym)) tMap.set(sym, new Set());
      for (const to of set) {
        tMap.get(sym)!.add(to);
      }
    }
  }
}

function addFragTrans(frag: NfaFragment, from: number, sym: string, to: number) {
  if (!frag.transitions.has(from)) frag.transitions.set(from, new Map());
  const m = frag.transitions.get(from)!;
  if (!m.has(sym)) m.set(sym, new Set());
  m.get(sym)!.add(to);
}

/**
 * Inserts explicit concatenation '.' operators into a regular expression.
 */
export function insertConcatOperators(regex: string): string {
  let output = '';
  // Normalize infix plus (like a+b or 0+1) to union |
  let normalized = regex.replace(/\s+/g, '');
  // Replace + with | only if followed by an operand or '('
  normalized = normalized.replace(/([^|+()*.?])\+([^|+()*?])/g, '$1|$2');
  normalized = normalized.replace(/\)\+\(/g, ')|(');
  normalized = normalized.replace(/\)\+([^|+()*?])/g, ')|$1');
  normalized = normalized.replace(/([^|+()*.?])\+\(/g, '$1|(');

  for (let i = 0; i < normalized.length; i++) {
    const c1 = normalized[i];
    output += c1;

    if (i + 1 < normalized.length) {
      const c2 = normalized[i + 1];
      const isC1Operand = c1 !== '(' && c1 !== '|';
      const isC2Operand = c2 !== ')' && c2 !== '*' && c2 !== '+' && c2 !== '|' && c2 !== '?';

      if (isC1Operand && isC2Operand) {
        output += '.';
      } else if (c1 === ')' && isC2Operand) {
        output += '.';
      } else if (c1 === '*' && isC2Operand) {
        output += '.';
      } else if (c1 === '+' && isC2Operand) {
        output += '.';
      } else if (c1 === '?' && isC2Operand) {
        output += '.';
      }
    }
  }

  return output;
}

/**
 * Converts infix regular expression to postfix notation (Shunting-Yard algorithm).
 */
export function regexToPostfix(infix: string): string {
  const precedence: Record<string, number> = {
    '*': 3,
    '+': 3, // Postfix Positive closure
    '?': 3,
    '.': 2,
    '|': 1,
  };

  const formatted = insertConcatOperators(infix);
  let postfix = '';
  const stack: string[] = [];

  for (let i = 0; i < formatted.length; i++) {
    const token = formatted[i];

    if (token === '(') {
      stack.push(token);
    } else if (token === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        postfix += stack.pop();
      }
      stack.pop(); // discard '('
    } else if (token in precedence) {
      while (
        stack.length > 0 &&
        stack[stack.length - 1] !== '(' &&
        precedence[stack[stack.length - 1]] >= precedence[token]
      ) {
        postfix += stack.pop();
      }
      stack.push(token);
    } else {
      // Operand
      postfix += token;
    }
  }

  while (stack.length > 0) {
    postfix += stack.pop();
  }

  return postfix;
}

/**
 * Builds an NFA from a Regular Expression using Thompson's Construction.
 */
export function regexToNfa(regex: string): { nfa: NFA; postfix: string; error?: string } {
  try {
    const clean = regex.trim();
    if (!clean) throw new Error('Regex cannot be empty');

    const postfix = regexToPostfix(clean);
    const stack: NfaFragment[] = [];
    const stateCounter = { val: 0 };
    const alphabetSet = new Set<string>();

    for (let i = 0; i < postfix.length; i++) {
      const token = postfix[i];

      if (token === '*') {
        // Kleene Star (0 or more)
        if (stack.length < 1) throw new Error('Invalid regex syntax for *');
        const frag = stack.pop()!;
        const newStart = stateCounter.val++;
        const newAccept = stateCounter.val++;

        frag.states.add(newStart);
        frag.states.add(newAccept);

        addFragTrans(frag, newStart, EPSILON, frag.start);
        addFragTrans(frag, newStart, EPSILON, newAccept);
        addFragTrans(frag, frag.accept, EPSILON, frag.start);
        addFragTrans(frag, frag.accept, EPSILON, newAccept);

        frag.start = newStart;
        frag.accept = newAccept;
        stack.push(frag);
      } else if (token === '+') {
        // Positive Closure (1 or more)
        if (stack.length < 1) throw new Error('Invalid regex syntax for +');
        const frag = stack.pop()!;
        const newStart = stateCounter.val++;
        const newAccept = stateCounter.val++;

        frag.states.add(newStart);
        frag.states.add(newAccept);

        addFragTrans(frag, newStart, EPSILON, frag.start);
        addFragTrans(frag, frag.accept, EPSILON, frag.start);
        addFragTrans(frag, frag.accept, EPSILON, newAccept);

        frag.start = newStart;
        frag.accept = newAccept;
        stack.push(frag);
      } else if (token === '?') {
        // Optional (0 or 1)
        if (stack.length < 1) throw new Error('Invalid regex syntax for ?');
        const frag = stack.pop()!;
        const newStart = stateCounter.val++;
        const newAccept = stateCounter.val++;

        frag.states.add(newStart);
        frag.states.add(newAccept);

        addFragTrans(frag, newStart, EPSILON, frag.start);
        addFragTrans(frag, newStart, EPSILON, newAccept);
        addFragTrans(frag, frag.accept, EPSILON, newAccept);

        frag.start = newStart;
        frag.accept = newAccept;
        stack.push(frag);
      } else if (token === '|') {
        // Union / Alternation
        if (stack.length < 2) throw new Error('Invalid regex syntax for |');
        const frag2 = stack.pop()!;
        const frag1 = stack.pop()!;

        const newStart = stateCounter.val++;
        const newAccept = stateCounter.val++;

        const combinedStates = new Set([...frag1.states, ...frag2.states, newStart, newAccept]);
        const combinedTrans = new Map(frag1.transitions);
        mergeTransitions(combinedTrans, frag2.transitions);

        const newFrag: NfaFragment = {
          start: newStart,
          accept: newAccept,
          states: combinedStates,
          transitions: combinedTrans,
        };

        addFragTrans(newFrag, newStart, EPSILON, frag1.start);
        addFragTrans(newFrag, newStart, EPSILON, frag2.start);
        addFragTrans(newFrag, frag1.accept, EPSILON, newAccept);
        addFragTrans(newFrag, frag2.accept, EPSILON, newAccept);

        stack.push(newFrag);
      } else if (token === '.') {
        // Concatenation
        if (stack.length < 2) throw new Error('Invalid regex syntax for concatenation');
        const frag2 = stack.pop()!;
        const frag1 = stack.pop()!;

        const combinedStates = new Set([...frag1.states, ...frag2.states]);
        const combinedTrans = new Map(frag1.transitions);
        mergeTransitions(combinedTrans, frag2.transitions);

        const newFrag: NfaFragment = {
          start: frag1.start,
          accept: frag2.accept,
          states: combinedStates,
          transitions: combinedTrans,
        };

        addFragTrans(newFrag, frag1.accept, EPSILON, frag2.start);
        stack.push(newFrag);
      } else {
        // Symbol operand
        const symbol = token === 'ε' ? EPSILON : token;
        if (symbol !== EPSILON) alphabetSet.add(symbol);
        const frag = createFragment(stateCounter, symbol);
        stack.push(frag);
      }
    }

    if (stack.length !== 1) {
      throw new Error('Malformed regular expression syntax');
    }

    const finalFrag = stack[0];
    // Rename states canonically to q0, q1, ...
    const oldStates = Array.from(finalFrag.states).sort((a, b) => a - b);
    const stateRenameMap = new Map<number, string>();
    // Make start state q0
    stateRenameMap.set(finalFrag.start, 'q0');
    let nextNum = 1;
    for (const os of oldStates) {
      if (os !== finalFrag.start) {
        stateRenameMap.set(os, `q${nextNum++}`);
      }
    }

    const nfaStates = Array.from(stateRenameMap.values()).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, '')) || 0;
      const nb = parseInt(b.replace(/\D/g, '')) || 0;
      return na - nb;
    });

    const transitions: Record<string, Record<string, string[]>> = {};
    for (const st of nfaStates) {
      transitions[st] = {};
    }

    for (const [from, map] of finalFrag.transitions.entries()) {
      const srcName = stateRenameMap.get(from)!;
      for (const [sym, toSet] of map.entries()) {
        const targetNames = Array.from(toSet).map((t) => stateRenameMap.get(t)!);
        transitions[srcName][sym] = targetNames.sort();
      }
    }

    const startStateName = stateRenameMap.get(finalFrag.start)!;
    const finalStateName = stateRenameMap.get(finalFrag.accept)!;

    const alphabet = Array.from(alphabetSet).sort();
    if (alphabet.length === 0) alphabet.push('a');

    const nfa: NFA = {
      states: nfaStates,
      alphabet,
      startState: startStateName,
      finalStates: [finalStateName],
      transitions,
    };

    return { nfa, postfix };
  } catch (err: any) {
    return {
      nfa: PRELOADED_EXAMPLES[0].nfa,
      postfix: '',
      error: err.message || 'Failed to parse regular expression',
    };
  }
}

// ==========================================
// DFA MINIMIZATION (HOPCROFT / PARTITIONING)
// ==========================================

export interface MinimizationStep {
  stepNumber: number;
  partitionLabel: string;
  partitions: string[][];
  explanation: string;
}

export interface MinimizedDFA {
  originalStateCount: number;
  minimizedStateCount: number;
  reductionPercentage: number;
  partitionsHistory: MinimizationStep[];
  minimizedDfa: DFA;
  stateEquivalenceMap: Record<string, string>; // e.g. "D0" -> "M0"
}

/**
 * Minimizes a DFA using Partition Refinement (Hopcroft's Algorithm).
 */
export function minimizeDFA(dfa: DFA): MinimizedDFA {
  if (dfa.states.length <= 1) {
    return {
      originalStateCount: dfa.states.length,
      minimizedStateCount: dfa.states.length,
      reductionPercentage: 0,
      partitionsHistory: [
        {
          stepNumber: 0,
          partitionLabel: 'P₀',
          partitions: [dfa.states.map((s) => s.id)],
          explanation: 'DFA is already minimal with 1 state.',
        },
      ],
      minimizedDfa: dfa,
      stateEquivalenceMap: dfa.states.reduce((acc, s) => ({ ...acc, [s.id]: s.id }), {}),
    };
  }

  const allStateIds = dfa.states.map((s) => s.id);
  const finalSet = new Set(dfa.finalStateIds);

  const nonFinalGroup = allStateIds.filter((id) => !finalSet.has(id));
  const finalGroup = allStateIds.filter((id) => finalSet.has(id));

  let currentPartitions: string[][] = [];
  if (nonFinalGroup.length > 0) currentPartitions.push(nonFinalGroup);
  if (finalGroup.length > 0) currentPartitions.push(finalGroup);

  const stepsHistory: MinimizationStep[] = [];
  let stepCounter = 0;

  stepsHistory.push({
    stepNumber: stepCounter++,
    partitionLabel: 'P₀ (Initial: Non-Accepting vs Accepting)',
    partitions: currentPartitions.map((g) => [...g]),
    explanation: `Split initial state space into non-final {${nonFinalGroup.join(', ') || '∅'}} and final {${finalGroup.join(', ') || '∅'}} sets.`,
  });

  // Iterative Partition Refinement
  let changed = true;
  while (changed) {
    changed = false;
    const nextPartitions: string[][] = [];

    // Helper: Find which partition index a state belongs to
    const getPartitionIndex = (stateId: string, parts: string[][]): number => {
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].includes(stateId)) return i;
      }
      return -1;
    };

    for (const group of currentPartitions) {
      if (group.length <= 1) {
        nextPartitions.push(group);
        continue;
      }

      // Group states by signature: transition target partition indices across all alphabet symbols
      const signatureMap = new Map<string, string[]>();

      for (const st of group) {
        const signatureParts: string[] = [];
        for (const sym of dfa.alphabet) {
          const target = dfa.transitions[st]?.[sym];
          const partIdx = target ? getPartitionIndex(target, currentPartitions) : -1;
          signatureParts.push(`${sym}->${partIdx}`);
        }
        const sigKey = signatureParts.join('|');
        if (!signatureMap.has(sigKey)) {
          signatureMap.set(sigKey, []);
        }
        signatureMap.get(sigKey)!.push(st);
      }

      const subGroups = Array.from(signatureMap.values());
      if (subGroups.length > 1) {
        changed = true;
      }
      for (const sg of subGroups) {
        nextPartitions.push(sg);
      }
    }

    if (changed) {
      stepsHistory.push({
        stepNumber: stepCounter++,
        partitionLabel: `P${stepsHistory.length}`,
        partitions: nextPartitions.map((g) => [...g]),
        explanation: `Refined partitions based on next-state behavior across alphabet Σ = {${dfa.alphabet.join(', ')}}. Split into ${nextPartitions.length} equivalent subsets.`,
      });
      currentPartitions = nextPartitions;
    }
  }

  // Construct Minimized DFA
  const stateEquivalenceMap: Record<string, string> = {};
  const minimizedDfaStates: DFAState[] = [];
  const minTransitions: Record<string, Record<string, string>> = {};

  // Find partition containing start state and make it M0
  const startPartIdx = currentPartitions.findIndex((p) => p.includes(dfa.startStateId));
  const orderedPartitions = [
    currentPartitions[startPartIdx],
    ...currentPartitions.filter((_, idx) => idx !== startPartIdx),
  ];

  orderedPartitions.forEach((part, idx) => {
    const minId = `M${idx}`;
    for (const stId of part) {
      stateEquivalenceMap[stId] = minId;
    }

    const isStart = part.includes(dfa.startStateId);
    const isFinal = part.some((s) => dfa.finalStateIds.includes(s));
    // Aggregate constituent NFA states
    const constituentNfa = Array.from(
      new Set(part.flatMap((stId) => dfa.states.find((s) => s.id === stId)?.nfaStates || []))
    ).sort();

    minimizedDfaStates.push({
      id: minId,
      label: `{${part.join(', ')}}`,
      nfaStates: constituentNfa,
      isStart,
      isFinal,
    });
    minTransitions[minId] = {};
  });

  // Fill minimized transitions
  for (const st of minimizedDfaStates) {
    const representativeOriginalId = orderedPartitions[parseInt(st.id.replace('M', ''))][0];
    for (const sym of dfa.alphabet) {
      const origTarget = dfa.transitions[representativeOriginalId]?.[sym];
      if (origTarget) {
        minTransitions[st.id][sym] = stateEquivalenceMap[origTarget];
      }
    }
  }

  const finalMinStateIds = minimizedDfaStates.filter((s) => s.isFinal).map((s) => s.id);
  const minDfa: DFA = {
    states: minimizedDfaStates,
    alphabet: [...dfa.alphabet],
    startStateId: 'M0',
    finalStateIds: finalMinStateIds,
    transitions: minTransitions,
    steps: [],
  };

  const origCount = dfa.states.length;
  const minCount = minimizedDfaStates.length;
  const reduction = origCount > 0 ? Number((((origCount - minCount) / origCount) * 100).toFixed(1)) : 0;

  return {
    originalStateCount: origCount,
    minimizedStateCount: minCount,
    reductionPercentage: reduction,
    partitionsHistory: stepsHistory,
    minimizedDfa: minDfa,
    stateEquivalenceMap,
  };
}

