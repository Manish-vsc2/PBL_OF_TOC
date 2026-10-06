# TOC Studio: NFA State-Bound Analyzer & Minimizer

An interactive academic workbench and PBL (Project-Based Learning) visualizer for **Theory of Computation (TOC) / Formal Languages & Automata Theory (FLAT)**.

## 🚀 Key Features

1. **Rabin-Scott Powerset Subset Construction**: Converts NFA with $\varepsilon$-transitions to equivalent DFA with step-by-step mathematical trace ($\text{move}(T, a)$ and $\varepsilon\text{-closure}$).
2. **$2^{|Q|}$ State-Bound Analysis**: Calculates theoretical upper bound cardinality vs empirical reachable state utilization rate.
3. **Hopcroft's DFA Minimization**: Derives canonical minimal DFA via partition refinement ($P_0 \to P_1 \to \dots \to P_k$).
4. **Thompson's Regex Synthesizer**: Converts regular expressions into equivalent $\varepsilon$-NFA with Shunting-Yard postfix parsing.
5. **Interactive Visual Canvas Builder**: Drag-and-drop state machines with direct transition link editing.
6. **Dual Automata String Simulator**: Parallel step-by-step string traversal testing language equivalence $L(\text{NFA}) = L(\text{DFA})$.
7. **PWA & Offline Installation**: Installable as a standalone application on mobile and desktop.
8. **Academic PDF / Print Report Generator**: 1-click formatted academic report export.

## 🛠️ Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

The application will be accessible at `http://localhost:3000/`.
