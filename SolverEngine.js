import { CubeState } from './CubeState.js';

export class SolverEngine {
  static invertSequence(sequence) {
    const moves = Array.isArray(sequence) ? sequence : CubeState.parseSequence(sequence);
    const inverted = [];
    for (let i = moves.length - 1; i >= 0; i--) {
      const move = moves[i];
      const face = move[0];
      const mod = move.substring(1);
      if (mod === "'") inverted.push(face);
      else if (mod === '2') inverted.push(face + '2');
      else inverted.push(face + "'");
    }
    return inverted;
  }

  static solve(cubeState) {
    const workingCube = cubeState.clone();
    if (workingCube.isSolved()) {
      return { solution: [], moveCount: 0, isSolved: true };
    }

    const solution = [];
    const exec = (movesStr) => {
      const moves = workingCube.applySequence(movesStr);
      solution.push(...moves);
    };

    // Layer-By-Layer (LBL) 단계별 해법 적용
    this._solveWhiteCross(workingCube, exec);
    this._solveWhiteCorners(workingCube, exec);
    this._solveMiddleLayer(workingCube, exec);
    this._solveYellowCross(workingCube, exec);
    this._orientYellowCorners(workingCube, exec);
    this._permuteYellowCorners(workingCube, exec);
    this._permuteYellowEdges(workingCube, exec);

    const optimized = this.optimizeSequence(solution);

    // 해법 자가 검증 (Solved Check)
    const verifyCube = cubeState.clone();
    verifyCube.applySequence(optimized.join(' '));

    return {
      solution: optimized,
      moveCount: optimized.length,
      isSolved: verifyCube.isSolved()
    };
  }

  static optimizeSequence(moves) {
    const faceVal = { '': 1, "'": 3, '2': 2 };
    const valFace = { 0: '', 1: '', 2: '2', 3: "'" };
    let stack = [];

    for (const move of moves) {
      const face = move[0];
      const mod = move.substring(1);
      const val = faceVal[mod];

      if (stack.length > 0 && stack[stack.length - 1].face === face) {
        stack[stack.length - 1].val = (stack[stack.length - 1].val + val) % 4;
        if (stack[stack.length - 1].val === 0) stack.pop();
      } else {
        stack.push({ face, val });
      }
    }
    return stack.map(item => item.face + valFace[item.val]);
  }

  static _solveWhiteCross(cube, exec) {
    for (let step = 0; step < 4; step++) {
      if (this._isWhiteEdgeCount(cube) > step) continue;
      this._bfsSolveStep(cube, exec, (c) => this._isWhiteEdgeCount(c) > step, 5);
    }
  }

  static _isWhiteEdgeCount(cube) {
    let count = 0;
    const s = cube.state;
    if (s.U[1] === 'U' && s.B[1] === 'B') count++;
    if (s.U[3] === 'U' && s.L[1] === 'L') count++;
    if (s.U[5] === 'U' && s.R[1] === 'R') count++;
    if (s.U[7] === 'U' && s.F[1] === 'F') count++;
    return count;
  }

  static _solveWhiteCorners(cube, exec) {
    for (let step = 0; step < 4; step++) {
      if (this._isFirstLayerCornerCount(cube) > step) continue;
      this._bfsSolveStep(cube, exec, (c) => this._isFirstLayerCornerCount(c) > step, 6);
    }
  }

  static _isFirstLayerCornerCount(cube) {
    let count = 0;
    const s = cube.state;
    if (s.U[0] === 'U' && s.L[0] === 'L' && s.B[2] === 'B') count++;
    if (s.U[2] === 'U' && s.B[0] === 'B' && s.R[2] === 'R') count++;
    if (s.U[6] === 'U' && s.F[0] === 'F' && s.L[2] === 'L') count++;
    if (s.U[8] === 'U' && s.R[0] === 'R' && s.F[2] === 'F') count++;
    return count;
  }

  static _solveMiddleLayer(cube, exec) {
    for (let step = 0; step < 4; step++) {
      if (this._isMiddleEdgeCount(cube) > step) continue;
      const alg1 = "D L D' L' D' F' D F";
      const alg2 = "D' R' D R D F D' F'";
      this._bfsSolveStep(cube, exec, (c) => this._isMiddleEdgeCount(c) > step, 6, [alg1, alg2]);
    }
  }

  static _isMiddleEdgeCount(cube) {
    let count = 0;
    const s = cube.state;
    if (s.F[3] === 'F' && s.L[5] === 'L') count++;
    if (s.F[5] === 'F' && s.R[3] === 'R') count++;
    if (s.B[3] === 'B' && s.R[5] === 'R') count++;
    if (s.B[5] === 'B' && s.L[3] === 'L') count++;
    return count;
  }

  static _solveYellowCross(cube, exec) {
    for (let i = 0; i < 4; i++) {
      const s = cube.state;
      if (s.D[1] === 'D' && s.D[3] === 'D' && s.D[5] === 'D' && s.D[7] === 'D') break;
      exec("F D L D' L' F'");
    }
  }

  static _orientYellowCorners(cube, exec) {
    for (let i = 0; i < 8; i++) {
      const s = cube.state;
      const count = [s.D[0], s.D[2], s.D[6], s.D[8]].filter(c => c === 'D').length;
      if (count === 4) break;
      exec("L D L' D L D2 L'");
    }
  }

  static _permuteYellowCorners(cube, exec) {
    for (let i = 0; i < 5; i++) {
      if (this._isYellowCornersPermuted(cube)) break;
      exec("L' F L' B2 L F' L' B2 L2");
      if (!this._isYellowCornersPermuted(cube)) exec("D");
    }
  }

  static _isYellowCornersPermuted(cube) {
    const s = cube.state;
    return (s.F[6] === s.F[8] && s.R[6] === s.R[8] && s.B[6] === s.B[8] && s.L[6] === s.L[8]);
  }

  static _permuteYellowEdges(cube, exec) {
    for (let i = 0; i < 6; i++) {
      if (cube.isSolved()) break;
      exec("R2 D F B' R2 F' B D R2");
      if (cube.isSolved()) break;
      exec("F2 D L R' F2 L' R D F2");
      if (!cube.isSolved()) exec("D");
    }
    for (let i = 0; i < 4; i++) {
      if (cube.isSolved()) break;
      exec("D");
    }
  }

  static _bfsSolveStep(cube, exec, checkGoalFn, maxDepth = 5, extraMacroAlgs = []) {
    if (checkGoalFn(cube)) return true;

    const baseMoves = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2", "L", "L'", "L2", "D", "D'", "D2", "B", "B'", "B2"];
    const moveSet = [...baseMoves, ...extraMacroAlgs];
    const queue = [{ state: cube.clone(), path: [] }];
    const visited = new Set([JSON.stringify(cube.state)]);

    while (queue.length > 0) {
      const { state, path } = queue.shift();
      if (path.length >= maxDepth) continue;

      for (const m of moveSet) {
        const nextState = state.clone();
        nextState.applySequence(m);

        if (checkGoalFn(nextState)) {
          exec([...path, m].join(' '));
          return true;
        }

        const key = JSON.stringify(nextState.state);
        if (!visited.has(key) && path.length + 1 < maxDepth) {
          visited.add(key);
          queue.push({ state: nextState, path: [...path, m] });
        }
      }
    }
    return false;
  }
}
