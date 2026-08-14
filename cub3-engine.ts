// cub3-engine.ts

/* =========================================================
 * CUB3 - 3x3 Cube Engine Prototype
 * ========================================================= */

export type Face = "U" | "D" | "L" | "R" | "F" | "B";
export type Move = Face;
export type Turn = 1 | 2 | 3; // 1 = clockwise, 2 = 180, 3 = counter-clockwise

export interface MoveToken {
  move: Move;
  turn: Turn;
  notation: string;
}

export interface CubeState {
  // Corner permutation.
  // Index:
  // 0 URF
  // 1 UFL
  // 2 ULB
  // 3 UBR
  // 4 DFR
  // 5 DLF
  // 6 DBL
  // 7 DRB
  cp: number[];

  // Corner orientation: 0, 1, 2
  co: number[];

  // Edge permutation.
  // Index:
  // 0 UR
  // 1 UF
  // 2 UL
  // 3 UB
  // 4 DR
  // 5 DF
  // 6 DL
  // 7 DB
  // 8 FR
  // 9 FL
  // 10 BL
  // 11 BR
  ep: number[];

  // Edge orientation: 0, 1
  eo: number[];
}

export interface MoveTrace {
  index: number;
  move: string;
  before: CubeState;
  after: CubeState;
}

/* =========================================================
 * Constants
 * ========================================================= */

const SOLVED_CP = [0, 1, 2, 3, 4, 5, 6, 7];
const SOLVED_CO = [0, 0, 0, 0, 0, 0, 0, 0];

const SOLVED_EP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const SOLVED_EO = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/* =========================================================
 * Cube State
 * ========================================================= */

export function createSolvedCube(): CubeState {
  return {
    cp: [...SOLVED_CP],
    co: [...SOLVED_CO],
    ep: [...SOLVED_EP],
    eo: [...SOLVED_EO],
  };
}

export function cloneCube(state: CubeState): CubeState {
  return {
    cp: [...state.cp],
    co: [...state.co],
    ep: [...state.ep],
    eo: [...state.eo],
  };
}

/* =========================================================
 * Utility
 * ========================================================= */

function mod(value: number, base: number): number {
  return ((value % base) + base) % base;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/* =========================================================
 * Solved Check
 * ========================================================= */

export function isSolved(state: CubeState): boolean {
  return (
    arraysEqual(state.cp, SOLVED_CP) &&
    arraysEqual(state.co, SOLVED_CO) &&
    arraysEqual(state.ep, SOLVED_EP) &&
    arraysEqual(state.eo, SOLVED_EO)
  );
}

/* =========================================================
 * State Validation
 * ========================================================= */

function isPermutation(arr: number[], size: number): boolean {
  if (arr.length !== size) return false;

  const seen = new Set<number>();

  for (const value of arr) {
    if (!Number.isInteger(value)) return false;
    if (value < 0 || value >= size) return false;
    if (seen.has(value)) return false;

    seen.add(value);
  }

  return true;
}

function permutationParity(arr: number[]): number {
  let inversions = 0;

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) {
        inversions++;
      }
    }
  }

  return inversions % 2;
}

export interface CubeValidation {
  valid: boolean;
  errors: string[];
}

export function validateCube(state: CubeState): CubeValidation {
  const errors: string[] = [];

  if (!isPermutation(state.cp, 8)) {
    errors.push("Invalid corner permutation.");
  }

  if (!isPermutation(state.ep, 12)) {
    errors.push("Invalid edge permutation.");
  }

  if (state.co.length !== 8) {
    errors.push("Invalid corner orientation length.");
  }

  if (state.eo.length !== 12) {
    errors.push("Invalid edge orientation length.");
  }

  for (const value of state.co) {
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      errors.push("Invalid corner orientation.");
      break;
    }
  }

  for (const value of state.eo) {
    if (!Number.isInteger(value) || value < 0 || value > 1) {
      errors.push("Invalid edge orientation.");
      break;
    }
  }

  // Corner orientation constraint
  if (state.co.reduce((a, b) => a + b, 0) % 3 !== 0) {
    errors.push("Corner orientation sum is invalid.");
  }

  // Edge orientation constraint
  if (state.eo.reduce((a, b) => a + b, 0) % 2 !== 0) {
    errors.push("Edge orientation sum is invalid.");
  }

  // Permutation parity
  if (
    isPermutation(state.cp, 8) &&
    isPermutation(state.ep, 12) &&
    permutationParity(state.cp) !== permutationParity(state.ep)
  ) {
    errors.push("Corner/edge permutation parity mismatch.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/* =========================================================
 * Basic Face Moves
 *
 * These tables represent clockwise quarter turns.
 * Applying the same move 4 times returns to solved.
 * ========================================================= */

interface MoveDefinition {
  cp: number[];
  co: number[];
  ep: number[];
  eo: number[];
}

const MOVE_DEFINITIONS: Record<Face, MoveDefinition> = {
  U: {
    cp: [1, 2, 3, 0, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [2, 3, 0, 1, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  R: {
    cp: [4, 1, 0, 3, 7, 5, 6, 2],
    co: [2, 0, 1, 0, 1, 0, 0, 2],
    ep: [8, 1, 3, 11, 4, 5, 6, 7, 0, 9, 10, 2],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  L: {
    cp: [0, 5, 2, 1, 4, 6, 3, 7],
    co: [0, 1, 0, 2, 0, 2, 1, 0],
    ep: [0, 1, 9, 3, 4, 5, 10, 7, 8, 2, 6, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  F: {
    cp: [1, 5, 4, 3, 2, 0, 6, 7],
    co: [1, 2, 2, 0, 2, 1, 0, 0],
    ep: [0, 9, 5, 3, 4, 8, 6, 7, 1, 5, 10, 11],
    eo: [0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },

  B: {
    cp: [3, 0, 2, 7, 4, 5, 1, 6],
    co: [1, 2, 0, 2, 0, 0, 2, 1],
    ep: [3, 8, 2, 10, 4, 5, 6, 7, 11, 9, 7, 3],
    eo: [1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1],
  },
};

/* =========================================================
 * NOTE
 *
 * The move tables above are intentionally isolated.
 * If you later change the internal cubie indexing,
 * only the move definitions need to change.
 * ========================================================= */

/* =========================================================
 * Apply Basic Move
 * ========================================================= */

function applyQuarterTurn(
  state: CubeState,
  face: Face
): CubeState {
  const def = MOVE_DEFINITIONS[face];

  const next: CubeState = {
    cp: new Array(8),
    co: new Array(8),
    ep: new Array(12),
    eo: new Array(12),
  };

  for (let i = 0; i < 8; i++) {
    next.cp[i] = state.cp[def.cp[i]];
    next.co[i] = mod(
      state.co[def.cp[i]] + def.co[i],
      3
    );
  }

  for (let i = 0; i < 12; i++) {
    next.ep[i] = state.ep[def.ep[i]];
    next.eo[i] = mod(
      state.eo[def.ep[i]] + def.eo[i],
      2
    );
  }

  return next;
}

/* =========================================================
 * Apply Move
 * ========================================================= */

export function applyMove(
  state: CubeState,
  token: MoveToken
): CubeState {
  let result = cloneCube(state);

  for (let i = 0; i < token.turn; i++) {
    result = applyQuarterTurn(result, token.move);
  }

  return result;
}

/* =========================================================
 * Notation Parser
 * ========================================================= */

const VALID_FACE = /^[UDLRFB]$/;

export function parseMove(token: string): MoveToken {
  const cleaned = token.trim();

  if (!cleaned) {
    throw new Error("Empty move.");
  }

  const face = cleaned[0] as Face;

  if (!VALID_FACE.test(face)) {
    throw new Error(`Invalid move: ${token}`);
  }

  const suffix = cleaned.slice(1);

  let turn: Turn;

  if (suffix === "") {
    turn = 1;
  } else if (suffix === "2") {
    turn = 2;
  } else if (suffix === "'") {
    turn = 3;
  } else {
    throw new Error(`Invalid move suffix: ${token}`);
  }

  return {
    move: face,
    turn,
    notation: `${face}${turn === 3 ? "'" : turn === 2 ? "2" : ""}`,
  };
}

export function parseAlgorithm(algorithm: string): MoveToken[] {
  const trimmed = algorithm.trim();

  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(/\s+/)
    .map(parseMove);
}

/* =========================================================
 * Apply Algorithm
 * ========================================================= */

export function applyAlgorithm(
  state: CubeState,
  algorithm: string | MoveToken[]
): CubeState {
  const moves =
    typeof algorithm === "string"
      ? parseAlgorithm(algorithm)
      : algorithm;

  let result = cloneCube(state);

  for (const move of moves) {
    result = applyMove(result, move);
  }

  return result;
}

/* =========================================================
 * Move Inverse
 * ========================================================= */

export function inverseMove(token: MoveToken): MoveToken {
  let turn: Turn;

  if (token.turn === 1) {
    turn = 3;
  } else if (token.turn === 3) {
    turn = 1;
  } else {
    turn = 2;
  }

  const notation =
    token.move +
    (turn === 3 ? "'" : turn === 2 ? "2" : "");

  return {
    move: token.move,
    turn,
    notation,
  };
}

export function inverseAlgorithm(
  algorithm: string | MoveToken[]
): MoveToken[] {
  const moves =
    typeof algorithm === "string"
      ? parseAlgorithm(algorithm)
      : algorithm;

  return [...moves]
    .reverse()
    .map(inverseMove);
}

export function algorithmToString(
  moves: MoveToken[]
): string {
  return moves.map((m) => m.notation).join(" ");
}

/* =========================================================
 * Apply With Trace
 *
 * This is particularly important for CUB3 Solve Review.
 * ========================================================= */

export function applyAlgorithmWithTrace(
  state: CubeState,
  algorithm: string | MoveToken[]
): {
  finalState: CubeState;
  trace: MoveTrace[];
} {
  const moves =
    typeof algorithm === "string"
      ? parseAlgorithm(algorithm)
      : algorithm;

  let current = cloneCube(state);

  const trace: MoveTrace[] = [];

  moves.forEach((move, index) => {
    const before = cloneCube(current);

    current = applyMove(current, move);

    const after = cloneCube(current);

    trace.push({
      index,
      move: move.notation,
      before,
      after,
    });
  });

  return {
    finalState: current,
    trace,
  };
}

/* =========================================================
 * Scramble Generator
 * ========================================================= */

const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateScramble(length = 20): string {
  const moves: string[] = [];

  let previousFace: Face | null = null;

  while (moves.length < length) {
    const face = randomItem(FACES);

    // Avoid same face twice in a row.
    if (face === previousFace) {
      continue;
    }

    const suffix = randomItem(["", "'", "2"]);

    moves.push(face + suffix);
    previousFace = face;
  }

  return moves.join(" ");
}

/* =========================================================
 * Scramble State
 * ========================================================= */

export function scrambleToState(
  scramble: string
): CubeState {
  return applyAlgorithm(createSolvedCube(), scramble);
}

/* =========================================================
 * Solve Verification
 * ========================================================= */

export function verifySolution(
  scramble: string,
  solution: string
): boolean {
  const scrambled = scrambleToState(scramble);
  const solved = applyAlgorithm(scrambled, solution);

  return isSolved(solved);
}

/* =========================================================
 * Random Scramble + Inverse Solve
 *
 * This is NOT a real optimal solver.
 * It is a correctness test:
 *
 * scramble:
 *     R U F ...
 *
 * solution:
 *     ... F' U' R'
 *
 * ========================================================= */

export function generateTestCase(length = 20) {
  const scramble = generateScramble(length);

  const solutionMoves = inverseAlgorithm(scramble);
  const solution = algorithmToString(solutionMoves);

  const solved = verifySolution(scramble, solution);

  return {
    scramble,
    solution,
    solved,
  };
}

/* =========================================================
 * Debug Printer
 * ========================================================= */

export function stateToString(state: CubeState): string {
  return [
    `CP: ${state.cp.join(" ")}`,
    `CO: ${state.co.join(" ")}`,
    `EP: ${state.ep.join(" ")}`,
    `EO: ${state.eo.join(" ")}`,
  ].join("\n");
}

/* =========================================================
 * Built-in Tests
 * ========================================================= */

export function runTests(): void {
  console.log("=== CUB3 ENGINE TESTS ===");

  // -------------------------------------------------------
  // Test 1: solved
  // -------------------------------------------------------

  const solved = createSolvedCube();

  console.assert(
    isSolved(solved),
    "Test 1 failed: solved cube"
  );

  // -------------------------------------------------------
  // Test 2: validation
  // -------------------------------------------------------

  const validation = validateCube(solved);

  console.assert(
    validation.valid,
    "Test 2 failed: solved cube validation"
  );

  // -------------------------------------------------------
  // Test 3: R x 4
  // -------------------------------------------------------

  const r4 = applyAlgorithm(
    solved,
    "R R R R"
  );

  console.assert(
    isSolved(r4),
    "Test 3 failed: R4"
  );

  // -------------------------------------------------------
  // Test 4: R R'
  // -------------------------------------------------------

  const rrPrime = applyAlgorithm(
    solved,
    "R R'"
  );

  console.assert(
    isSolved(rrPrime),
    "Test 4 failed: R R'"
  );

  // -------------------------------------------------------
  // Test 5: U2 U2
  // -------------------------------------------------------

  const u4 = applyAlgorithm(
    solved,
    "U2 U2"
  );

  console.assert(
    isSolved(u4),
    "Test 5 failed: U2 U2"
  );

  // -------------------------------------------------------
  // Test 6: algorithm + inverse
  // -------------------------------------------------------

  const algorithm =
    "R U R' U' F R U R' U' F'";

  const inverse = inverseAlgorithm(algorithm);

  const restored = applyAlgorithm(
    applyAlgorithm(solved, algorithm),
    inverse
  );

  console.assert(
    isSolved(restored),
    "Test 6 failed: algorithm inverse"
  );

  // -------------------------------------------------------
  // Test 7: scramble + inverse
  // -------------------------------------------------------

  for (let i = 0; i < 100; i++) {
    const test = generateTestCase(20);

    console.assert(
      test.solved,
      `Test 7 failed at iteration ${i}`
    );
  }

  // -------------------------------------------------------
  // Test 8: trace
  // -------------------------------------------------------

  const traceResult =
    applyAlgorithmWithTrace(
      solved,
      "R U R'"
    );

  console.assert(
    traceResult.trace.length === 3,
    "Test 8 failed: trace length"
  );

  console.assert(
    traceResult.trace[0].move === "R",
    "Test 8 failed: first move"
  );

  console.assert(
    traceResult.trace[1].move === "U",
    "Test 8 failed: second move"
  );

  console.assert(
    traceResult.trace[2].move === "R'",
    "Test 8 failed: third move"
  );

  console.log("All tests completed.");
}

/* =========================================================
 * Example
 * ========================================================= */

// Uncomment to run tests:
//
// runTests();
//
// const scramble = generateScramble();
// console.log("Scramble:", scramble);
//
// const state = scrambleToState(scramble);
// console.log(stateToString(state));
//
// const test = generateTestCase();
// console.log(test);
//
// const traced = applyAlgorithmWithTrace(
//   state,
//   "R U R' U'"
// );
//
// console.log(traced.trace);
