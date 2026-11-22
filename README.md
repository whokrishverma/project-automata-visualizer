# Automata Visualizer

An interactive web-based **DFA and NFA Visualizer** that allows users to define finite automata, simulate input strings, and understand state transitions through visual representations and step-by-step execution.

## Overview

Automata Visualizer is a browser-based tool designed to make concepts from Theory of Computation easier to understand. Users can create their own Deterministic Finite Automata (DFA) and Non-Deterministic Finite Automata (NFA), visualize their state diagrams, and observe how input strings are processed.

## Features

- **DFA Support:** Define deterministic finite automata with valid state transitions.
- **NFA Support:** Define non-deterministic automata with multiple possible transitions.
- **Custom Automata:** Configure states, alphabets, start states, final states, and transitions.
- **Visual State Diagrams:** Automatically generate automata diagrams using SVG.
- **Step-by-Step Simulation:** Process input strings one symbol at a time.
- **Execution Trace:** View processed symbols, active states, and transitions.
- **String Validation:** Determine whether an input string is accepted or rejected.
- **Input Validation:** Detect invalid states, alphabets, and transition definitions.
- **Sample Automaton:** Load a predefined example to explore the application.

## Technologies Used

- **HTML5** – Application structure
- **CSS3** – Styling and responsive layout
- **JavaScript** – Automata logic and simulation
- **SVG** – Dynamic state diagram visualization

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/whokrishverma/project-automata-visualizer.git
```

### 2. Navigate to the project directory

```bash
cd project-automata-visualizer
```

### 3. Run the application

Open `automata_visualizer.html` directly in your browser.

No additional dependencies or installations are required.

## How to Use

1. Select the automaton type (DFA or NFA).
2. Enter the states, separated by commas.
3. Define the input alphabet.
4. Specify the start state and final states.
5. Enter the transitions using the required format.
6. Enter an input string to test.
7. Click **Validate & Draw** to generate the state diagram.
8. Click **Next Step** to execute the automaton one symbol at a time.
9. Observe the active states and execution trace.
10. Check the final result to see whether the string is accepted or rejected.

### Transition Format

Each transition must follow this format:

```text
from_state,symbol,to_state
```

Example:

```text
q0,0,q1
q0,1,q0
q1,0,q1
q1,1,q2
q2,0,q1
q2,1,q0
```

For an NFA, multiple transitions can originate from the same state using the same input symbol.

**Note:** This version does not support epsilon (ε) transitions.

## Project Structure

```text
project-automata-visualizer/
│
├── automata_visualizer.html   # Main application
├── style.css                  # Styling and responsive layout
├── script.js                 # Automata logic and visualization
├── AUTOMATA FINAL REPORT.docx # Project report
└── README.md                  # Project documentation
```

## Learning Objectives

This project demonstrates practical implementation of fundamental concepts in Theory of Computation, including:

- Finite Automata
- Deterministic Finite Automata (DFA)
- Non-Deterministic Finite Automata (NFA)
- State transitions
- Input string processing
- Language acceptance and rejection

## Future Improvements

- Support for epsilon (ε) transitions.
- Export automata diagrams as images.
- Improved graph layout for complex automata.
- Conversion between NFA and DFA.
- Additional automata examples and test cases.

---

**Developed by Krish Verma**

GitHub: [@whokrishverma](https://github.com/whokrishverma)