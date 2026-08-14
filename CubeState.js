export const FACES = ['U', 'D', 'F', 'B', 'L', 'R'];

export class CubeState {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {};
    for (const f of FACES) {
      this.state[f] = Array(9).fill(f);
    }
  }

  clone() {
    const copy = new CubeState();
    for (const f of FACES) {
      copy.state[f] = [...this.state[f]];
    }
    return copy;
  }

  isSolved() {
    for (const f of FACES) {
      const first = this.state[f][0];
      for (let i = 1; i < 9; i++) {
        if (this.state[f][i] !== first) return false;
      }
    }
    return true;
  }

  _rotateFaceClockwise(face) {
    const s = this.state[face];
    this.state[face] = [
      s[6], s[3], s[0],
      s[7], s[4], s[1],
      s[8], s[5], s[2]
    ];
  }

  applyMove(move) {
    const face = move[0];
    const modifier = move.substring(1);

    if (!FACES.includes(face)) {
      throw new Error(`Invalid move face: ${face}`);
    }

    let count = 1;
    if (modifier === "'") count = 3;
    else if (modifier === '2') count = 2;
    else if (modifier !== '') {
      throw new Error(`Invalid move modifier: ${modifier} in move "${move}"`);
    }

    for (let c = 0; c < count; c++) {
      this._applyBaseMove(face);
    }
  }

  _applyBaseMove(face) {
    this._rotateFaceClockwise(face);
    const s = this.state;
    let tmp;

    switch (face) {
      case 'U':
        tmp = [s.F[0], s.F[1], s.F[2]];
        s.F[0] = s.R[0]; s.F[1] = s.R[1]; s.F[2] = s.R[2];
        s.R[0] = s.B[0]; s.R[1] = s.B[1]; s.R[2] = s.B[2];
        s.B[0] = s.L[0]; s.B[1] = s.L[1]; s.B[2] = s.L[2];
        s.L[0] = tmp[0]; s.L[1] = tmp[1]; s.L[2] = tmp[2];
        break;
      case 'D':
        tmp = [s.F[6], s.F[7], s.F[8]];
        s.F[6] = s.L[6]; s.F[7] = s.L[7]; s.F[8] = s.L[8];
        s.L[6] = s.B[6]; s.L[7] = s.B[7]; s.L[8] = s.B[8];
        s.B[6] = s.R[6]; s.B[7] = s.R[7]; s.B[8] = s.R[8];
        s.R[6] = tmp[0]; s.R[7] = tmp[1]; s.R[8] = tmp[2];
        break;
      case 'R':
        tmp = [s.U[2], s.U[5], s.U[8]];
        s.U[2] = s.F[2]; s.U[5] = s.F[5]; s.U[8] = s.F[8];
        s.F[2] = s.D[2]; s.F[5] = s.D[5]; s.F[8] = s.D[8];
        s.D[2] = s.B[6]; s.D[5] = s.B[3]; s.D[8] = s.B[0];
        s.B[6] = tmp[0]; s.B[3] = tmp[1]; s.B[0] = tmp[2];
        break;
      case 'L':
        tmp = [s.U[0], s.U[3], s.U[6]];
        s.U[0] = s.B[8]; s.U[3] = s.B[5]; s.U[6] = s.B[2];
        s.B[8] = s.D[0]; s.B[5] = s.D[3]; s.B[2] = s.D[6];
        s.D[0] = s.F[0]; s.D[3] = s.F[3]; s.D[6] = s.F[6];
        s.F[0] = tmp[0]; s.F[3] = tmp[1]; s.F[6] = tmp[2];
        break;
      case 'F':
        tmp = [s.U[6], s.U[7], s.U[8]];
        s.U[6] = s.L[8]; s.U[7] = s.L[5]; s.U[8] = s.L[2];
        s.L[8] = s.D[2]; s.L[5] = s.D[1]; s.L[2] = s.D[0];
        s.D[2] = s.R[0]; s.D[1] = s.R[3]; s.D[0] = s.R[6];
        s.R[0] = tmp[0]; s.R[3] = tmp[1]; s.R[6] = tmp[2];
        break;
      case 'B':
        tmp = [s.U[2], s.U[1], s.U[0]];
        s.U[2] = s.R[8]; s.U[1] = s.R[5]; s.U[0] = s.R[2];
        s.R[8] = s.D[6]; s.R[5] = s.D[7]; s.R[2] = s.D[8];
        s.D[6] = s.L[0]; s.D[7] = s.L[3]; s.D[8] = s.L[6];
        s.L[0] = tmp[0]; s.L[3] = tmp[1]; s.L[6] = tmp[2];
        break;
    }
  }

  static parseSequence(seqString) {
    if (!seqString || typeof seqString !== 'string') return [];
    const cleaned = seqString.trim().replace(/['’]/g, "'");
    if (!cleaned) return [];

    const tokens = cleaned.split(/\s+/);
    const validMoveRegex = /^[RUFLDB]['2]?$/;

    for (const token of tokens) {
      if (!validMoveRegex.test(token)) {
        throw new Error(`Invalid move notation: "${token}"`);
      }
    }
    return tokens;
  }

  applySequence(seqString) {
    const moves = CubeState.parseSequence(seqString);
    for (const m of moves) {
      this.applyMove(m);
    }
    return moves;
  }
}
