(() => {
  "use strict";

  const levels = [
    {
      mission: "Oxygen, Now",
      title: "Synthesize water",
      story:
        "Mira, the impact knocked out the oxygen loop. If we can synthesize water from the reserve tanks, the crew has four more hours.",
      tag: "Priority one",
      hint: "Hydrogen arrives as H₂ but leaves in H₂O, where every water molecule holds two H atoms. Start by matching the oxygen atoms.",
      species: [
        { formula: "H2", atoms: { H: 2 } },
        { formula: "O2", atoms: { O: 2 } },
        { formula: "H2O", atoms: { H: 2, O: 1 } }
      ],
      answer: [2, 1, 2]
    },
    {
      mission: "Clear the Scrubber",
      title: "Rebalance methane burn",
      story:
        "The carbon scrubber is choking on unburned methane. Give me a clean combustion ratio before the filters seal shut.",
      tag: "Air quality falling",
      hint: "Methane has one carbon. Preserve it with one CO₂, then account for four hydrogen atoms and the oxygen needed for both products.",
      species: [
        { formula: "CH4", atoms: { C: 1, H: 4 } },
        { formula: "O2", atoms: { O: 2 } },
        { formula: "CO2", atoms: { C: 1, O: 2 } },
        { formula: "H2O", atoms: { H: 2, O: 1 } }
      ],
      answer: [1, 2, 1, 2]
    },
    {
      mission: "Coolant Crisis",
      title: "Produce ammonia",
      story:
        "The coolant line failed. We can replace it with ammonia, but the reactor needs the exact nitrogen-to-hydrogen ratio.",
      tag: "Temperature rising",
      hint: "Each ammonia molecule needs one nitrogen and three hydrogen atoms. Balance nitrogen first, then bring in hydrogen pairs.",
      species: [
        { formula: "N2", atoms: { N: 2 } },
        { formula: "H2", atoms: { H: 2 } },
        { formula: "NH3", atoms: { N: 1, H: 3 } }
      ],
      answer: [1, 3, 2]
    },
    {
      mission: "Seal the Breach",
      title: "Form iron oxide",
      story:
        "I can manufacture an iron-oxide seal for the outer hull, but oxygen enters in pairs while the product needs three atoms. Work it out, Mira.",
      tag: "Hull pressure dropping",
      hint: "One Fe₂O₃ formula needs three oxygen atoms. Oxygen gas arrives in pairs, so find a shared multiple of two and three.",
      species: [
        { formula: "Fe", atoms: { Fe: 1 } },
        { formula: "O2", atoms: { O: 2 } },
        { formula: "Fe2O3", atoms: { Fe: 2, O: 3 } }
      ],
      answer: [4, 3, 2]
    },
    {
      mission: "Final Ignition",
      title: "Restart the generator",
      story:
        "The escape window is almost gone. Burn the last propane reserve cleanly and charge the main generator. This is the final reaction.",
      tag: "Last chance",
      hint: "Propane contains three carbon and eight hydrogen atoms. Balance carbon with CO₂ and hydrogen with H₂O, then count the remaining oxygen.",
      species: [
        { formula: "C3H8", atoms: { C: 3, H: 8 } },
        { formula: "O2", atoms: { O: 2 } },
        { formula: "CO2", atoms: { C: 1, O: 2 } },
        { formula: "H2O", atoms: { H: 2, O: 1 } }
      ],
      answer: [1, 5, 3, 4]
    }
  ];

  const state = {
    level: 0,
    score: 0,
    streak: 0,
    attempts: 0,
    totalAttempts: 0,
    locked: false
  };

  const els = {
    reactants: document.getElementById("reactants"),
    products: document.getElementById("products"),
    atomRows: document.getElementById("atomRows"),
    balanceState: document.getElementById("balanceState"),
    feedback: document.getElementById("feedback"),
    feedbackText: document.getElementById("feedbackText"),
    missionName: document.getElementById("missionName"),
    roundBadge: document.getElementById("roundBadge"),
    storyText: document.getElementById("storyText"),
    storyTag: document.getElementById("storyTag"),
    challengeTitle: document.getElementById("challengeTitle"),
    difficulty: document.getElementById("difficultyLabel"),
    missionPath: document.getElementById("missionPath"),
    coreState: document.getElementById("coreState"),
    labStatusDot: document.getElementById("labStatusDot"),
    pressure: document.getElementById("pressureValue"),
    signal: document.getElementById("signalValue"),
    ignite: document.getElementById("igniteButton"),
    hint: document.getElementById("hintButton"),
    dialog: document.getElementById("completionDialog"),
    completionTitle: document.getElementById("completionTitle"),
    completionMessage: document.getElementById("completionMessage"),
    finalScore: document.getElementById("finalScore"),
    finalAccuracy: document.getElementById("finalAccuracy"),
    replay: document.getElementById("replayButton"),
    equationCard: document.querySelector(".equation-card")
  };

  const formatFormula = (formula) =>
    formula.replace(/(\d+)/g, "<sub>$1</sub>");

  const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      [x, y] = [y, x % y];
    }
    return x;
  };

  function getCoefficients() {
    return Array.from(document.querySelectorAll(".coefficient-input")).map((input) => {
      const value = Number(input.value);
      return Number.isFinite(value) ? Math.min(9, Math.max(1, Math.round(value))) : 1;
    });
  }

  function sequenceLabel(index) {
    return levels[index].mission;
  }

  function renderMissionPath() {
    els.missionPath.innerHTML = levels
      .map((level, index) => {
        const className =
          index < state.level
            ? "is-complete"
            : index === state.level
              ? "is-active"
              : "";
        return `<li class="${className}"><span>${String(index + 1).padStart(2, "0")}</span>${level.mission}</li>`;
      })
      .join("");
  }

  function renderSpecies() {
    const level = levels[state.level];
    const reactants = [];
    const products = [];

    level.species.forEach((species, index) => {
      const symbol = Object.keys(species.atoms)[0];
      const item = `
        <div class="species">
          <span class="atom-tag" aria-hidden="true">${symbol}</span>
          <label class="coefficient-control">
            <button type="button" data-coefficient="${index}" data-step="-1" aria-label="Decrease coefficient for ${species.formula}">−</button>
            <input class="coefficient-input"
                   type="number"
                   inputmode="numeric"
                   min="1"
                   max="9"
                   step="1"
                   value="1"
                   data-index="${index}"
                   aria-label="Coefficient for ${species.formula}">
            <button type="button" data-coefficient="${index}" data-step="1" aria-label="Increase coefficient for ${species.formula}">+</button>
          </label>
          <span class="species-formula">${formatFormula(species.formula)}</span>
        </div>`;
      if (index === 0) return reactants.push(item);
      const isProduct = index >= level.species.length - (level.species.length === 3 ? 1 : 2);
      if (isProduct) products.push(item);
      else reactants.push(item);
    });

    els.reactants.innerHTML = reactants.join('<span class="equation-plus">+</span>');
    els.products.innerHTML = products.join('<span class="equation-plus">+</span>');
  }

  function calculateInventory() {
    const level = levels[state.level];
    const coefficients = getCoefficients();
    const left = {};
    const right = {};
    const firstProduct = level.species.length === 3 ? 2 : 2;

    level.species.forEach((species, index) => {
      const target = index < firstProduct ? left : right;
      Object.entries(species.atoms).forEach(([element, count]) => {
        target[element] = (target[element] || 0) + count * coefficients[index];
      });
    });

    const elements = Array.from(
      new Set(level.species.flatMap((species) => Object.keys(species.atoms)))
    );
    return {
      coefficients,
      left,
      right,
      elements,
      balanced: elements.every((element) => left[element] === right[element])
    };
  }

  function renderInventory() {
    const inventory = calculateInventory();
    const divisor = inventory.coefficients.reduce(gcd);
    const reduced = divisor === 1;

    els.atomRows.innerHTML = inventory.elements
      .map((element) => {
        const left = inventory.left[element] || 0;
        const right = inventory.right[element] || 0;
        const isBalanced = left === right;
        return `
          <div class="atom-row${isBalanced ? " is-balanced" : ""}" role="row">
            <span role="cell"><i class="element-dot" data-element="${element}">${element}</i>${element}</span>
            <span role="cell">${left}</span>
            <span role="cell">${right}</span>
            <span role="cell">${isBalanced ? "Balanced" : "Off"}</span>
          </div>`;
      })
      .join("");

    els.balanceState.classList.toggle("is-balanced", inventory.balanced && reduced);
    if (!inventory.balanced) {
      els.balanceState.textContent = "Unbalanced";
      els.coreState.textContent = "UNSTABLE";
      els.coreState.style.color = "";
      els.labStatusDot.classList.remove("is-stable");
    } else if (!reduced) {
      els.balanceState.textContent = "Reduce ratio";
      els.coreState.textContent = "OVERSIZED";
      els.coreState.style.color = "var(--acid)";
      els.labStatusDot.classList.remove("is-stable");
    } else {
      els.balanceState.textContent = "Balanced";
      els.coreState.textContent = "STABLE";
      els.coreState.style.color = "var(--mint)";
      els.labStatusDot.classList.add("is-stable");
    }

    return { ...inventory, reduced, divisor };
  }

  function setFeedback(message, type = "") {
    els.feedbackText.textContent = message;
    els.feedback.classList.remove("is-error", "is-success");
    if (type) els.feedback.classList.add(`is-${type}`);
  }

  function updateReactorReadouts() {
    els.pressure.textContent = (0.42 + state.level * 0.11).toFixed(2);
    els.signal.textContent = String(17 + state.level * 17);
  }

  function updateEquation() {
    renderInventory();
  }

  function loadLevel(index) {
    state.level = index;
    state.attempts = 0;
    state.locked = false;
    const level = levels[index];
    els.missionName.textContent = level.mission;
    els.roundBadge.textContent = `${String(index + 1).padStart(2, "0")} / ${String(levels.length).padStart(2, "0")}`;
    els.storyText.textContent = level.story;
    els.storyTag.textContent = level.tag;
    els.challengeTitle.textContent = level.title;
    els.difficulty.textContent = `Level ${index + 1}`;
    els.ignite.disabled = false;
    els.equationCard.classList.remove("is-error", "is-resolved");
    renderSpecies();
    renderMissionPath();
    updateReactorReadouts();
    updateEquation();
    setFeedback("Adjust each coefficient until the atom inventory is balanced.");
    els.reactants.querySelector("input")?.focus({ preventScroll: true });
  }

  function adjustCoefficient(index, direction) {
    if (state.locked) return;
    const input = document.querySelector(`.coefficient-input[data-index="${index}"]`);
    const value = Math.min(9, Math.max(1, Number(input.value) + direction));
    input.value = String(value);
    updateEquation();
  }

  function normalizedInput(input) {
    if (state.locked) return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      input.value = "1";
    } else {
      input.value = String(Math.min(9, Math.max(1, Math.round(value))));
    }
    updateEquation();
  }

  function checkEquation() {
    if (state.locked) return;
    const inventory = renderInventory();
    state.attempts += 1;
    state.totalAttempts += 1;

    if (!inventory.balanced) {
      state.streak = 0;
      const firstMismatch = inventory.elements.find(
        (element) => inventory.left[element] !== inventory.right[element]
      );
      const left = inventory.left[firstMismatch];
      const right = inventory.right[firstMismatch];
      setFeedback(
        `${firstMismatch} is not balanced: ${left} atom${left === 1 ? "" : "s"} on the left and ${right} on the right. Adjust the coefficients and try again.`,
        "error"
      );
      els.equationCard.classList.add("is-error");
      window.setTimeout(() => els.equationCard.classList.remove("is-error"), 600);
      return;
    }

    if (!inventory.reduced) {
      state.streak = 0;
      setFeedback(
        `Every element matches, but these are not the smallest whole-number coefficients. Divide them all by ${inventory.divisor}.`,
        "error"
      );
      return;
    }

    state.locked = true;
    state.streak += 1;
    const earned = 100 + (state.streak - 1) * 25;
    state.score += earned;
    els.ignite.disabled = true;
    els.equationCard.classList.remove("is-error");
    els.equationCard.classList.add("is-resolved");
    setFeedback(
      `Reaction stabilized. Conservation of mass confirmed. +${earned} points.`,
      "success"
    );
    els.storyText.textContent =
      state.level === levels.length - 1
        ? "Main generator online. The station is holding. We did it, Mira."
        : "Reaction stable. I am locking in the coefficients and opening the next chamber.";

    window.setTimeout(() => {
      if (state.level === levels.length - 1) {
        finishGame();
      } else {
        loadLevel(state.level + 1);
      }
    }, 1450);
  }

  function showHint() {
    const inventory = renderInventory();
    if (inventory.balanced && !inventory.reduced) {
      setFeedback(
        `The equation is balanced, but every coefficient can still be divided by ${inventory.divisor}. Use the smallest ratio.`
      );
      return;
    }
    setFeedback(levels[state.level].hint);
  }

  function finishGame() {
    const accuracy = Math.round((levels.length / state.totalAttempts) * 100);
    els.completionTitle.textContent = "Helios-9 breathes again.";
    els.completionMessage.textContent =
      accuracy === 100
        ? "Every equation balanced on the first attempt. The reactor returns to full power and the rescue crew has a safe station to reach."
        : "The reactor reaches full power. Every element balances, every chamber holds, and the station waits safely for the rescue crew.";
    els.finalScore.textContent = String(state.score);
    els.finalAccuracy.textContent = `${accuracy}%`;
    if (typeof els.dialog.showModal === "function") {
      els.dialog.showModal();
    } else {
      els.dialog.setAttribute("open", "");
    }
  }

  function restartGame() {
    state.level = 0;
    state.score = 0;
    state.streak = 0;
    state.attempts = 0;
    state.totalAttempts = 0;
    state.locked = false;
    if (els.dialog.open) els.dialog.close();
    loadLevel(0);
  }

  els.reactants.addEventListener("input", (event) => {
    if (event.target.matches(".coefficient-input")) normalizedInput(event.target);
  });
  els.products.addEventListener("input", (event) => {
    if (event.target.matches(".coefficient-input")) normalizedInput(event.target);
  });
  els.reactants.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coefficient]");
    if (button) adjustCoefficient(Number(button.dataset.coefficient), Number(button.dataset.step));
  });
  els.products.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coefficient]");
    if (button) adjustCoefficient(Number(button.dataset.coefficient), Number(button.dataset.step));
  });

  els.ignite.addEventListener("click", checkEquation);
  els.hint.addEventListener("click", showHint);
  els.replay.addEventListener("click", restartGame);
  els.dialog.addEventListener("cancel", (event) => event.preventDefault());

  loadLevel(0);
})();
