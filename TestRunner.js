import { CubeState } from './CubeState.js';
import { SolverEngine } from './SolverEngine.js';

export class TestRunner {
  constructor(logContainerId) {
    this.logEl = document.getElementById(logContainerId);
  }

  log(msg, type = 'info') {
    const line = document.createElement('div');
    line.className = type === 'pass' ? 'test-pass' : type === 'fail' ? 'test-fail' : 'test-info';
    line.textContent = msg;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  runAllTests() {
    this.logEl.innerHTML = '';
    this.log("=== CUB3 Solver Engine Automated Test Suite ===");

    // 1. 잘못된 Move Notation 예외 테스트
    this.testInvalidMoveNotation();
    // 2. 역수(Inverse Sequence) 적용 검증
    this.testInverseVerification();
    // 3. 다양한 Scramble 해결 검증
    this.testScrambleAndSolve("R U R' U'");
    this.testScrambleAndSolve("F R U R' U' F'");
    this.testScrambleAndSolve("R2 U2 R2 U2 R2 U2");
    this.testScrambleAndSolve("L D2 B2 R F2 R' B2 D2 L'");

    this.log("\n=== All Automated Tests Completed ===", 'pass');
  }

  testInvalidMoveNotation() {
    this.log("\n[Test 1] Invalid Move Notation Handling:");
    const invalidInputs = ["R U X", "R22", "F3", "INVALID"];
    for (const input of invalidInputs) {
      try {
        CubeState.parseSequence(input);
        this.log(`  FAIL: Failed to reject invalid notation "${input}"`, 'fail');
      } catch (err) {
        this.log(`  PASS: Correctly rejected "${input}" -> ${err.message}`, 'pass');
      }
    }
  }

  testInverseVerification() {
    this.log("\n[Test 2] Inverse Move Sequence Verification:");
    const seq = "R U2 F' L2 D";
    const inv = SolverEngine.invertSequence(seq).join(' ');
    
    const cube = new CubeState();
    cube.applySequence(seq);
    cube.applySequence(inv);

    if (cube.isSolved()) {
      this.log(`  PASS: Applied "${seq}" followed by inverse "${inv}" -> Cube IS SOLVED`, 'pass');
    } else {
      this.log(`  FAIL: Inverse sequence failed to restore solved state`, 'fail');
    }
  }

  testScrambleAndSolve(scramble) {
    this.log(`\n[Test] Scramble -> Solve -> Verification for: "${scramble}"`);
    try {
      const cube = new CubeState();
      cube.applySequence(scramble);

      const res = SolverEngine.solve(cube);
      this.log(`  - Solution (${res.moveCount} moves): ${res.solution.join(' ')}`);

      if (res.isSolved) {
        this.log(`  PASS: Solution successfully solved the scrambled cube!`, 'pass');
      } else {
        this.log(`  FAIL: Solution failed to achieve solved state!`, 'fail');
      }
    } catch (err) {
      this.log(`  FAIL: Exception during solve: ${err.message}`, 'fail');
    }
  }
}
