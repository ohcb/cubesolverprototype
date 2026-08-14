import { FACES } from './CubeState.js';

export class UIController {
  constructor(cubeState) {
    this.cube = cubeState;
    this.netContainer = document.getElementById('cube-net-container');
    this.statusBadge = document.getElementById('cube-status-badge');
    this.statusText = document.getElementById('cube-status-text');
    this.solverResultBox = document.getElementById('solver-result-box');
    this.solutionCountEl = document.getElementById('solution-count');
    this.solutionSeqEl = document.getElementById('solution-sequence');
    this.solutionVerEl = document.getElementById('solution-verification');
    this.errorBox = document.getElementById('error-box');

    this.renderCubeNet();
    this.updateStatus();
  }

  renderCubeNet() {
    this.netContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'cube-net-grid';

    for (const f of FACES) {
      const faceGrid = document.createElement('div');
      faceGrid.className = `face-grid face-${f}`;
      
      const faceStickers = this.cube.state[f];
      for (let i = 0; i < 9; i++) {
        const sticker = document.createElement('div');
        const color = faceStickers[i];
        sticker.className = `sticker color-${color}`;
        faceGrid.appendChild(sticker);
      }
      grid.appendChild(faceGrid);
    }
    this.netContainer.appendChild(grid);
  }

  updateStatus() {
    const isSolved = this.cube.isSolved();
    if (isSolved) {
      this.statusBadge.textContent = 'Solved';
      this.statusBadge.className = 'badge badge-solved';
      this.statusText.textContent = 'Cube is in target solved state.';
    } else {
      this.statusBadge.textContent = 'Scrambled / Unsolved';
      this.statusBadge.className = 'badge badge-unsolved';
      this.statusText.textContent = 'Cube state requires solving.';
    }
  }

  displaySolution(result) {
    this.hideError();
    this.solverResultBox.classList.remove('hidden');
    this.solutionCountEl.textContent = result.moveCount;
    this.solutionSeqEl.textContent = result.solution.length > 0 ? result.solution.join(' ') : 'None (Already Solved)';
    
    if (result.isSolved) {
      this.solutionVerEl.textContent = '✓ Solution verified: State reaches SOLVED upon application.';
      this.solutionVerEl.style.color = '#3fb950';
    } else {
      this.solutionVerEl.textContent = '✕ Solution failed: Verification failed!';
      this.solutionVerEl.style.color = '#f85149';
    }
  }

  displayError(msg) {
    this.errorBox.textContent = `Error: ${msg}`;
    this.errorBox.classList.remove('hidden');
  }

  hideError() { this.errorBox.classList.add('hidden'); }
  hideSolution() { this.solverResultBox.classList.add('hidden'); }
}
