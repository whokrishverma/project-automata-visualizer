const $ = id => document.getElementById(id);
let machine = null, simulation = null, currentStep = 0;

const csv = value => value.split(",").map(x => x.trim()).filter(Boolean);

const showError = message => {
  $("error").textContent = message;
  $("error").style.display = message ? "block" : "none";
};

const hideResult = () => {
  $("result").className = "result";
  $("result").style.display = "none";
};

const escapeHTML = value => String(value).replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])
);

// Read the form and validate the automaton definition.
function parseMachine() {
  const type = $("kind").value;
  const states = csv($("states").value);
  const alphabet = csv($("alphabet").value);
  const start = $("start").value.trim();
  const finals = csv($("finals").value);

  if (!states.length || new Set(states).size !== states.length)
    throw Error("Add at least one state and use unique state names.");

  if (!alphabet.length || new Set(alphabet).size !== alphabet.length)
    throw Error("Add at least one alphabet symbol and use unique symbols.");

  if (!states.includes(start))
    throw Error("The start state must be in the States list.");

  if (finals.some(s => !states.includes(s)))
    throw Error("Every final state must be in the States list.");

  const transitions = Object.fromEntries(states.map(s => [s, {}]));

  const lines = $("transitions").value
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  lines.forEach((line, i) => {
    const [from, symbol, to, ...extra] =
      line.split(",").map(x => x.trim());

    if (!from || !symbol || !to || extra.length)
      throw Error(`Transition line ${i + 1} must use from,symbol,to format.`);

    if (!states.includes(from))
      throw Error(`Unknown source state "${from}" on line ${i + 1}.`);

    if (!alphabet.includes(symbol))
      throw Error(`Unknown symbol "${symbol}" on line ${i + 1}.`);

    if (!states.includes(to))
      throw Error(`Unknown destination state "${to}" on line ${i + 1}.`);

    const destinations = transitions[from][symbol] ||= [];

    if (type === "DFA" && destinations.length)
      throw Error(`DFA cannot have multiple destinations from ${from} on ${symbol}.`);

    if (!destinations.includes(to))
      destinations.push(to);
  });

  // A DFA must have exactly one transition for every state-symbol pair.
  if (type === "DFA") {
    states.forEach(s => alphabet.forEach(a => {
      if (!transitions[s][a] || transitions[s][a].length !== 1)
        throw Error(`DFA is incomplete: define exactly one transition from ${s} on "${a}".`);
    }));
  }

  return { type, states, alphabet, start, finals, transitions };
}


// DFA tracks one state; NFA tracks all currently reachable states.
function makeSimulation(m, input) {
  for (const symbol of input) {
    if (!m.alphabet.includes(symbol))
      throw Error(`Input symbol "${symbol}" is not in the alphabet.`);
  }

  const steps = [{
    index: 0,
    symbol: "—",
    active: [m.start],
    transition: `Start at ${m.start}`
  }];

  let active = [m.start];

  [...input].forEach((symbol, i) => {
    const next = new Set();
    const moves = [];

    active.forEach(state => {
      const destinations = m.transitions[state][symbol] || [];

      if (!destinations.length)
        moves.push(`${state} —${symbol}→ ∅`);

      destinations.forEach(to => {
        next.add(to);
        moves.push(`${state} —${symbol}→ ${to}`);
      });
    });

    active = [...next];

    steps.push({
      index: i + 1,
      symbol,
      active,
      transition: moves.join("; ") || "No available transition"
    });
  });

  return {
    steps,
    input,
    finalStates: active,
    accepted: active.some(s => m.finals.includes(s))
  };
}


// Validate automaton and display its state diagram.
function validateAndDraw() {
  showError("");

  try {
    machine = parseMachine();
    simulation = null;
    currentStep = 0;

    $("typeBadge").textContent = machine.type;
    $("status").textContent =
      "Automaton is valid. Enter an input string and press Next step.";

    $("progress").textContent = "Ready to simulate.";

    $("traceBody").innerHTML =
      '<tr><td colspan="4" class="small">Execution trace will appear here.</td></tr>';

    hideResult();
    drawGraph(machine, []);

    $("step").disabled = false;

  } catch (e) {
    machine = simulation = null;

    drawGraph(null, []);
    showError(e.message);

    $("step").disabled = true;
  }
}


// Prepare a new simulation.
function prepareSimulation() {
  showError("");

  machine ||= parseMachine();

  simulation = makeSimulation(machine, $("inputString").value);
  currentStep = 0;

  hideResult();
  $("traceBody").innerHTML = "";

  renderStep();
}


// Display the current simulation step.
function renderStep() {
  if (!simulation) return;

  const step = simulation.steps[currentStep];
  const last = currentStep === simulation.steps.length - 1;

  drawGraph(machine, step.active);

  $("status").innerHTML = `<b>Step ${step.index}:</b> ${
    step.index
      ? `Read symbol <code>${escapeHTML(step.symbol)}</code>`
      : "Initialization"
  }`;

  $("progress").textContent =
    `Input: ${simulation.input || "ε (empty string)"} | Processed: ${step.index}/${simulation.input.length} | Active state(s): ${step.active.join(", ") || "∅"}`;

  // Show all steps processed so far.
  $("traceBody").innerHTML =
    simulation.steps.slice(0, currentStep + 1).map(s => `
      <tr>
        <td>${s.index}</td>
        <td>${s.index ? escapeHTML(s.symbol) : "—"}</td>
        <td>${s.active.map(escapeHTML).join(", ") || "∅"}</td>
        <td>${escapeHTML(s.transition)}</td>
      </tr>
    `).join("");

  // Display final acceptance or rejection.
  if (last) {
    const accepted = simulation.accepted;

    const finals = simulation.finalStates.filter(
      s => machine.finals.includes(s)
    );

    const detail = accepted
      ? `At least one active state (${finals.join(", ")}) is final.`
      : `None of the active states (${simulation.finalStates.join(", ") || "∅"}) is final.`;

    $("result").className =
      `result ${accepted ? "accept" : "reject"}`;

    $("result").textContent =
      `${accepted ? "ACCEPTED" : "REJECTED"} — ${detail}`;

    $("result").style.display = "block";
  }

  $("step").disabled = last;
}


// Draw the state diagram using SVG.
function drawGraph(m, active) {
  const svg = $("graph");
  const ns = "http://www.w3.org/2000/svg";

  svg.innerHTML = "";

  if (!m) {
    svg.innerHTML = `
      <text x="380" y="180" text-anchor="middle"
        fill="#64748b" font-size="16">
        Validate a valid automaton to display its graph.
      </text>`;
    return;
  }

  // Helper to create SVG elements.
  const add = (tag, attrs, parent = svg) => {
    const node = document.createElementNS(ns, tag);

    Object.entries(attrs).forEach(([key, value]) =>
      node.setAttribute(key, value)
    );

    parent.appendChild(node);
    return node;
  };

  // Helper to display text.
  const label = (x, y, value, attrs = {}) => {
    add("text", {
      x,
      y,
      "text-anchor": "middle",
      fill: "#334155",
      "font-size": 13,
      ...attrs
    }).textContent = value;
  };

  const { states, alphabet, transitions } = m;

  const radius = Math.min(125, 45 + states.length * 12);

  // Calculate positions of states in a circle.
  const pos = Object.fromEntries(states.map((s, i) => {
    const angle = -Math.PI / 2 + 2 * Math.PI * i / states.length;

    return [
      s,
      {
        x: 380 + radius * Math.cos(angle),
        y: 180 + radius * Math.sin(angle)
      }
    ];
  }));

  // Create arrow marker.
  const defs = add("defs", {});

  const marker = add("marker", {
    id: "arrow",
    markerWidth: 10,
    markerHeight: 10,
    refX: 8,
    refY: 3,
    orient: "auto",
    markerUnits: "strokeWidth"
  }, defs);

  add("path", {
    d: "M0,0 L0,6 L9,3 z",
    fill: "#64748b"
  }, marker);


  // Combine symbols that share the same source and destination.
  const edges = [];

  states.forEach(from => alphabet.forEach(symbol =>
    (transitions[from][symbol] || []).forEach(to => {
      let edge = edges.find(e => e.from === from && e.to === to);

      if (!edge)
        edges.push(edge = { from, to, labels: [] });

      edge.labels.push(symbol);
    })
  ));


  // Draw transition arrows.
  edges.forEach(({ from, to, labels }) => {
    const a = pos[from];
    const b = pos[to];

    const highlighted = active.includes(to);

    // Self-loop transition.
    if (from === to) {
      add("path", {
        d: `M ${a.x-13} ${a.y-22} C ${a.x-48} ${a.y-85}, ${a.x+48} ${a.y-85}, ${a.x+13} ${a.y-22}`,
        fill: "none",
        stroke: "#64748b",
        "stroke-width": 2,
        "marker-end": "url(#arrow)"
      });

      label(a.x, a.y - 72, labels.join(","));
      return;
    }

    // Calculate arrow positions.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;

    const px = -dy / length;
    const py = dx / length;

    const sx = a.x + dx / length * 29;
    const sy = a.y + dy / length * 29;

    const ex = b.x - dx / length * 31;
    const ey = b.y - dy / length * 31;

    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;

    add("path", {
      d: `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`,
      fill: "none",
      stroke: highlighted ? "#2563eb" : "#64748b",
      "stroke-width": highlighted ? 3 : 2,
      "marker-end": "url(#arrow)"
    });

    label(mx + px * 9, my + py * 9, labels.join(","), {
      "font-weight": 700
    });
  });


  // Draw arrow pointing to the start state.
  const start = pos[m.start];

  add("path", {
    d: `M ${start.x-70} ${start.y} L ${start.x-34} ${start.y}`,
    fill: "none",
    stroke: "#64748b",
    "stroke-width": 2,
    "marker-end": "url(#arrow)"
  });


  // Draw states and highlight active/final states.
  states.forEach(state => {
    const p = pos[state];

    const isFinal = m.finals.includes(state);
    const isActive = active.includes(state);

    add("circle", {
      cx: p.x,
      cy: p.y,
      r: 27,
      fill: isActive ? "#dbeafe" : "white",
      stroke: isActive ? "#2563eb" : "#334155",
      "stroke-width": isActive ? 4 : 2
    });

    // Double circle represents a final state.
    if (isFinal) {
      add("circle", {
        cx: p.x,
        cy: p.y,
        r: 21,
        fill: "none",
        stroke: "#15803d",
        "stroke-width": 2
      });
    }

    label(p.x, p.y + 5, state, {
      fill: "#172033",
      "font-size": 15,
      "font-weight": 800
    });

    if (isActive) {
      label(p.x, p.y + 45, "ACTIVE", {
        fill: "#2563eb",
        "font-size": 11,
        "font-weight": 700
      });
    }
  });
}


// VALIDATE button.
$("validate").addEventListener("click", validateAndDraw);

// NEXT STEP button.
$("step").addEventListener("click", () => {
  try {
    if (!simulation)
      prepareSimulation();
    else if (currentStep < simulation.steps.length - 1)
      currentStep++;

    renderStep();
  } catch (e) {
    showError(e.message);
  }
});


// RESET button.
$("reset").addEventListener("click", () => {
  simulation = null;
  currentStep = 0;

  hideResult();

  $("traceBody").innerHTML =
    '<tr><td colspan="4" class="small">Execution trace will appear here.</td></tr>';

  $("status").textContent = "Simulation reset.";
  $("progress").textContent = "Ready to simulate.";

  $("step").disabled = false;

  drawGraph(machine, []);
});


// LOAD SAMPLE button.
$("loadSample").addEventListener("click", () => {
  $("kind").value = "DFA";
  $("states").value = "q0,q1,q2";
  $("alphabet").value = "0,1";
  $("start").value = "q0";
  $("finals").value = "q2";
  $("inputString").value = "101";

  $("transitions").value = [
    "q0,0,q1",
    "q0,1,q0",
    "q1,0,q1",
    "q1,1,q2",
    "q2,0,q1",
    "q2,1,q0"
  ].join("\n");

  validateAndDraw();
});


// Clear cached automaton when type changes.
$("kind").addEventListener("change", () => {
  machine = simulation = null;
});


// Load initial automaton.
validateAndDraw();