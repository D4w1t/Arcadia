/**
 * Arcadia State - Game State Machine, Event Bus, and Session Statistics
 */

export const GameStates = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAMEOVER: "GAMEOVER",
  VICTORY: "VICTORY",
};

export class GameState {
  constructor(initialState = GameStates.START) {
    this.current = initialState;
    this.previous = null;
    this.listeners = new Map();
    this.stats = {
      score: 0,
      highScore: Number(localStorage.getItem("arcadia_high_score") || 0),
      time: 0,
      kills: 0,
      coins: 0,
      level: 1,
    };
  }

  setState(newState, data = {}) {
    if (this.current === newState) return;
    this.previous = this.current;
    this.current = newState;
    this.emit("stateChange", { state: newState, prev: this.previous, data });
  }

  is(state) {
    return this.current === state;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data = {}) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        cb(data);
      }
    }
  }

  addScore(points) {
    this.stats.score += points;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem("arcadia_high_score", String(this.stats.highScore));
    }
    this.emit("score", { score: this.stats.score, delta: points });
  }

  reset() {
    this.stats.score = 0;
    this.stats.time = 0;
    this.stats.kills = 0;
    this.stats.coins = 0;
    this.setState(GameStates.START);
  }
}
