/*
 * =========================================================
 * CUB3 Solver Prototype
 * =========================================================
 *
 * Independent 3x3 cube engine prototype.
 *
 * Goals:
 *
 * 1. Cube state
 * 2. WCA notation parser
 * 3. Move application
 * 4. Scramble generation
 * 5. State validation
 * 6. Inverse algorithm
 * 7. Move trace
 * 8. Solve verification
 * 9. Automated tests
 *
 * This prototype is intentionally independent
 * from the main CUB3 project.
 *
 * =========================================================
 */


/* =========================================================
 * CUBE STATE
 * ========================================================= */

function createSolvedCube() {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],

    ep: [
      0, 1, 2, 3,
      4, 5, 6, 7,
      8, 9, 10, 11
    ],

    eo: [
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ]
  };
}


function cloneCube(cube) {
  return {
    cp: [...cube.cp],
    co: [...cube.co],
    ep: [...cube.ep],
    eo: [...cube.eo]
  };
}


/* =========================================================
 * UTILITIES
 * ========================================================= */

function mod(value, base) {
  return ((value % base) + base) % base;
}


function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}


function isSolved(cube) {
  return (
    arraysEqual(
      cube.cp,
      [0, 1, 2, 3, 4, 5, 6, 7]
    ) &&

    arraysEqual(
      cube.co,
      [0, 0, 0, 0, 0, 0, 0, 0]
    ) &&

    arraysEqual(
      cube.ep,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    ) &&

    arraysEqual(
      cube.eo,
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
  );
}


/* =========================================================
 * MOVE DEFINITIONS
 * ========================================================= */

const MOVES = {

  U: {
    cp: [1, 2, 3, 0, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],

    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },

  D: {
    cp: [0, 1, 2, 3, 7, 4, 5, 6],
    co: [0, 0, 0, 0, 0, 0, 0, 0],

    ep: [0, 1, 2, 3, 7, 4, 5, 6, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },

  R: {
    cp: [4, 1, 0, 3, 7, 5, 6, 2],
    co: [2, 0, 1, 0, 1, 0, 0, 2],

    ep: [8, 1, 3, 11, 4, 5, 6, 7, 0, 9, 10, 2],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },

  L: {
    cp: [0, 5, 2, 1, 4, 6, 3, 7],
    co: [0, 1, 0, 2, 0, 2, 1, 0],

    ep: [0, 9, 2, 3, 4, 5, 10, 7, 8, 1, 6, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },

  F: {
    cp: [1, 5, 4, 3, 2, 0, 6, 7],
    co: [1, 2, 2, 0, 2, 1, 0, 0],

    ep: [0, 9, 5, 3, 4, 8, 6, 7, 1, 2, 10, 11],
    eo: [0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0]
  },

  B: {
    cp: [3, 0, 2, 7, 4, 5, 1, 6],
    co: [1, 2, 0, 2, 0, 0, 2, 1],

    ep: [3, 8, 2, 10, 4, 5, 6, 7, 11, 9, 7, 3],
    eo: [1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1]
  }

};


/* =========================================================
 * APPLY QUARTER TURN
 * ========================================================= */

function applyQuarterTurn(cube, face) {

  const move = MOVES[face];

  if (!move) {
    throw new Error(
      `Unknown move: ${face}`
    );
  }

  const result = {
    cp: new Array(8),
    co: new Array(8),

    ep: new Array(12),
    eo: new Array(12)
  };


  for (let i = 0; i < 8; i++) {

    const oldPosition =
      move.cp[i];

    result.cp[i] =
      cube.cp[oldPosition];

    result.co[i] =
      mod(
        cube.co[oldPosition] +
        move.co[i],
        3
      );
  }


  for (let i = 0; i < 12; i++) {

    const oldPosition =
      move.ep[i];

    result.ep[i] =
      cube.ep[oldPosition];

    result.eo[i] =
      mod(
        cube.eo[oldPosition] +
        move.eo[i],
        2
      );
  }


  return result;
}


/* =========================================================
 * PARSER
 * ========================================================= */

function parseMove(token) {

  token = token.trim();

  if (!token) {
    throw new Error(
      "Empty move."
    );
  }

  const face = token[0];

  if (!"UDLRFB".includes(face)) {
    throw new Error(
      `Invalid face: ${token}`
    );
  }

  const suffix =
    token.slice(1);

  let amount;

  if (suffix === "") {
    amount = 1;

  } else if (suffix === "2") {
    amount = 2;

  } else if (suffix === "'") {
    amount = 3;

  } else {
    throw new Error(
      `Invalid notation: ${token}`
    );
  }

  return {
    face,
    amount,

    notation:
      face +
      (
        amount === 2
          ? "2"
          : amount === 3
            ? "'"
            : ""
      )
  };
}


function parseAlgorithm(algorithm) {

  if (
    typeof algorithm !== "string"
  ) {
    throw new Error(
      "Algorithm must be a string."
    );
  }

  algorithm =
    algorithm.trim();

  if (!algorithm) {
    return [];
  }

  return algorithm
    .split(/\s+/)
    .map(parseMove);
}


/* =========================================================
 * APPLY MOVE
 * ========================================================= */

function applyMove(cube, move) {

  let result =
    cloneCube(cube);

  for (
    let i = 0;
    i < move.amount;
    i++
  ) {
    result =
      applyQuarterTurn(
        result,
        move.face
      );
  }

  return result;
}


/* =========================================================
 * APPLY ALGORITHM
 * ========================================================= */

function applyAlgorithm(
  cube,
  algorithm
) {

  const moves =
    typeof algorithm === "string"
      ? parseAlgorithm(algorithm)
      : algorithm;

  let result =
    cloneCube(cube);

  for (const move of moves) {

    result =
      applyMove(
        result,
        move
      );
  }

  return result;
}


/* =========================================================
 * INVERSE
 * ========================================================= */

function inverseMove(move) {

  let amount;

  if (move.amount === 1) {
    amount = 3;

  } else if (move.amount === 2) {
    amount = 2;

  } else {
    amount = 1;
  }

  return {
    face: move.face,
    amount,

    notation:
      move.face +
      (
        amount === 2
          ? "2"
          : amount === 3
            ? "'"
            : ""
      )
  };
}


function inverseAlgorithm(
  algorithm
) {

  const moves =
    typeof algorithm === "string"
      ? parseAlgorithm(algorithm)
      : algorithm;

  return [...moves]
    .reverse()
    .map(inverseMove);
}


function movesToString(
  moves
) {

  return moves
    .map(move => move.notation)
    .join(" ");
}


/* =========================================================
 * SCRAMBLE GENERATOR
 * ========================================================= */

const FACES = [
  "U",
  "D",
  "L",
  "R",
  "F",
  "B"
];


function randomChoice(array) {

  return array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];
}


function generateScramble(
  length = 20
) {

  const result = [];

  let previousFace =
    null;

  while (
    result.length < length
  ) {

    const face =
      randomChoice(FACES);

    if (
      face === previousFace
    ) {
      continue;
    }

    const suffix =
      randomChoice([
        "",
        "'",
        "2"
      ]);

    result.push(
      face + suffix
    );

    previousFace =
      face;
  }

  return result.join(" ");
}


/* =========================================================
 * SCRAMBLE → STATE
 * ========================================================= */

function scrambleToCube(
  scramble
) {

  return applyAlgorithm(
    createSolvedCube(),
    scramble
  );
}


/* =========================================================
 * STATE VALIDATION
 * ========================================================= */

function isValidPermutation(
  array,
  size
) {

  if (
    !Array.isArray(array) ||
    array.length !== size
  ) {
    return false;
  }

  const seen =
    new Set();

  for (
    const value of array
  ) {

    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value >= size ||
      seen.has(value)
    ) {
      return false;
    }

    seen.add(value);
  }

  return true;
}


function permutationParity(
  array
) {

  let parity = 0;

  for (
    let i = 0;
    i < array.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < array.length;
      j++
    ) {

      if (
        array[i] > array[j]
      ) {
        parity ^= 1;
      }
    }
  }

  return parity;
}


function validateCube(
  cube
) {

  const errors = [];


  if (
    !isValidPermutation(
      cube.cp,
      8
    )
  ) {
    errors.push(
      "Invalid corner permutation"
    );
  }


  if (
    !isValidPermutation(
      cube.ep,
      12
    )
  ) {
    errors.push(
      "Invalid edge permutation"
    );
  }


  if (
    !Array.isArray(cube.co) ||
    cube.co.length !== 8
  ) {
    errors.push(
      "Invalid corner orientation"
    );
  }


  if (
    !Array.isArray(cube.eo) ||
    cube.eo.length !== 12
  ) {
    errors.push(
      "Invalid edge orientation"
    );
  }


  if (
    Array.isArray(cube.co)
  ) {

    const sum =
      cube.co.reduce(
        (a, b) => a + b,
        0
      );

    if (
      sum % 3 !== 0
    ) {
      errors.push(
        "Corner orientation sum invalid"
      );
    }
  }


  if (
    Array.isArray(cube.eo)
  ) {

    const sum =
      cube.eo.reduce(
        (a, b) => a + b,
        0
      );

    if (
      sum % 2 !== 0
    ) {
      errors.push(
        "Edge orientation sum invalid"
      );
    }
  }


  if (
    isValidPermutation(
      cube.cp,
      8
    ) &&
    isValidPermutation(
      cube.ep,
      12
    )
  ) {

    if (
      permutationParity(cube.cp) !==
      permutationParity(cube.ep)
    ) {
      errors.push(
        "Corner/edge parity mismatch"
      );
    }
  }


  return {
    valid:
      errors.length === 0,

    errors
  };
}


/* =========================================================
 * MOVE TRACE
 * ========================================================= */

function applyAlgorithmWithTrace(
  cube,
  algorithm
) {

  const moves =
    typeof algorithm === "string"
      ? parseAlgorithm(algorithm)
      : algorithm;

  let current =
    cloneCube(cube);

  const trace = [];


  for (
    let i = 0;
    i < moves.length;
    i++
  ) {

    const move =
      moves[i];

    const before =
      cloneCube(current);

    current =
      applyMove(
        current,
        move
      );

    const after =
      cloneCube(current);


    trace.push({
      index: i,
      move: move.notation,
      before,
      after
    });
  }


  return {
    finalState: current,
    trace
  };
}


/* =========================================================
 * STATE STRING
 * ========================================================= */

function cubeToString(
  cube
) {

  return [
    `CP: ${cube.cp.join(" ")}`,
    `CO: ${cube.co.join(" ")}`,
    `EP: ${cube.ep.join(" ")}`,
    `EO: ${cube.eo.join(" ")}`
  ].join("\n");
}


/* =========================================================
 * TESTS
 * ========================================================= */

function runTests() {

  const tests = [];

  function test(
    name,
    condition
  ) {

    if (!condition) {
      throw new Error(
        `FAILED: ${name}`
      );
    }

    tests.push(name);
  }


  console.log(
    "Starting CUB3 tests..."
  );


  const solved =
    createSolvedCube();


  test(
    "Solved state",
    isSolved(solved)
  );


  test(
    "Solved state validation",
    validateCube(solved).valid
  );


  /*
   * Every face × 4 = identity
   */

  for (
    const face of FACES
  ) {

    const result =
      applyAlgorithm(
        solved,
        `${face} ${face} ${face} ${face}`
      );

    test(
      `${face} x4`,
      isSolved(result)
    );
  }


  /*
   * Move + inverse
   */

  for (
    const face of FACES
  ) {

    const result =
      applyAlgorithm(
        solved,
        `${face} ${face}'`
      );

    test(
      `${face} ${face}'`,
      isSolved(result)
    );
  }


  /*
   * Algorithm + inverse
   */

  const algorithms = [
    "R U R' U'",
    "F R U R' U' F'",
    "R2 F2 U2 L2 D2 B2",
    "R U2 F' L2 D B' R2 U F2"
  ];


  for (
    const algorithm of algorithms
  ) {

    const scrambled =
      applyAlgorithm(
        solved,
        algorithm
      );

    const inverse =
      inverseAlgorithm(
        algorithm
      );

    const restored =
      applyAlgorithm(
        scrambled,
        inverse
      );

    test(
      `Inverse: ${algorithm}`,
      isSolved(restored)
    );
  }


  /*
   * Random scramble tests
   */

  for (
    let i = 0;
    i < 1000;
    i++
  ) {

    const scramble =
      generateScramble(20);

    const cube =
      scrambleToCube(
        scramble
      );


    test(
      `Random validation #${i + 1}`,
      validateCube(cube).valid
    );


    const inverse =
      inverseAlgorithm(
        scramble
      );


    const restored =
      applyAlgorithm(
        cube,
        inverse
      );


    test(
      `Random inverse #${i + 1}`,
      isSolved(restored)
    );
  }


  /*
   * Trace test
   */

  const traced =
    applyAlgorithmWithTrace(
      solved,
      "R U R'"
    );


  test(
    "Trace length",
    traced.trace.length === 3
  );


  test(
    "Trace R",
    traced.trace[0].move === "R"
  );


  test(
    "Trace U",
    traced.trace[1].move === "U"
  );


  test(
    "Trace R'",
    traced.trace[2].move === "R'"
  );


  console.log(
    `✓ ${tests.length} tests passed`
  );


  return tests.length;
}


/* =========================================================
 * UI
 * ========================================================= */

let currentScramble = "";
let currentCube = null;


const scrambleElement =
  document.getElementById(
    "scramble"
  );

const cubeStateElement =
  document.getElementById(
    "cubeState"
  );

const solutionElement =
  document.getElementById(
    "solution"
  );

const statusElement =
  document.getElementById(
    "solutionStatus"
  );

const traceElement =
  document.getElementById(
    "trace"
  );

const testResultElement =
  document.getElementById(
    "testResult"
  );


function displayCube(
  cube
) {

  cubeStateElement.textContent =
    cubeToString(cube);
}


function displayTrace(
  trace
) {

  traceElement.innerHTML = "";


  for (
    const item of trace
  ) {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "trace-row";


    row.innerHTML = `
      <span>${item.index + 1}</span>
      <strong>${item.move}</strong>
      <span>state updated</span>
    `;


    traceElement.appendChild(
      row
    );
  }
}


/* =========================================================
 * GENERATE SCRAMBLE
 * ========================================================= */

document
  .getElementById(
    "generateScramble"
  )
  .addEventListener(
    "click",
    () => {

      currentScramble =
        generateScramble(20);

      currentCube =
        scrambleToCube(
          currentScramble
        );


      scrambleElement.textContent =
        currentScramble;

      displayCube(
        currentCube
      );


      solutionElement.textContent =
        "-";

      statusElement.textContent =
        "-";

      statusElement.className =
        "status";

      traceElement.textContent =
        "-";
    }
  );


/* =========================================================
 * SOLVE
 *
 * IMPORTANT:
 *
 * At this prototype stage, the "solver" uses
 * the inverse scramble as a correctness solver.
 *
 * This deliberately verifies the engine first.
 *
 * Later this function can be replaced with:
 *
 * IDA*
 * Kociemba
 * Two-phase solver
 * God's algorithm search
 * etc.
 * ========================================================= */

document
  .getElementById(
    "solve"
  )
  .addEventListener(
    "click",
    () => {

      if (!currentCube) {

        statusElement.textContent =
          "먼저 scramble을 생성해.";

        return;
      }


      const solutionMoves =
        inverseAlgorithm(
          currentScramble
        );


      const solution =
        movesToString(
          solutionMoves
        );


      const result =
        applyAlgorithm(
          currentCube,
          solutionMoves
        );


      solutionElement.textContent =
        solution;


      if (
        isSolved(result)
      ) {

        statusElement.textContent =
          "✓ Solution verified — SOLVED";

        statusElement.className =
          "status ok";

      } else {

        statusElement.textContent =
          "✕ Solution verification failed";

        statusElement.className =
          "status error";
      }


      const traced =
        applyAlgorithmWithTrace(
          currentCube,
          solutionMoves
        );


      displayTrace(
        traced.trace
      );
    }
  );


/* =========================================================
 * TEST BUTTON
 * ========================================================= */

document
  .getElementById(
    "runTests"
  )
  .addEventListener(
    "click",
    () => {

      try {

        const count =
          runTests();

        testResultElement.textContent =
          `✓ ${count} tests passed`;

      } catch (error) {

        console.error(error);

        testResultElement.textContent =
          `✕ ${error.message}`;
      }
    }
  );


/* =========================================================
 * INITIAL TEST
 * ========================================================= */

try {

  runTests();

  testResultElement.textContent =
    "✓ Initial engine tests passed.";

} catch (error) {

  console.error(error);

  testResultElement.textContent =
    `✕ Initial tests failed: ${error.message}`;
}
