/**
 * Arcadia HUD - Glassmorphic HUD overlay for 3D games
 */

export class HUD {
  constructor(container = document.body) {
    this.container = container;
    this.score = 0;
    this.highScore = Number(localStorage.getItem("arcadia_high_score") || 0);
    this.health = 100;
    this.maxHealth = 100;

    this._injectStyles();
    this._createDOM();
  }

  _injectStyles() {
    if (document.getElementById("arcadia-hud-styles")) return;

    const style = document.createElement("style");
    style.id = "arcadia-hud-styles";
    style.textContent = `
      #arcadia-hud {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #f8fafc;
        z-index: 100;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px;
        box-sizing: border-box;
      }
      .hud-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
      }
      .hud-card {
        background: rgba(9, 9, 11, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 10px 18px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
      }
      .hud-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        font-weight: 600;
      }
      .hud-value {
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
        font-variant-numeric: tabular-nums;
        transition: transform 0.15s ease-out, color 0.15s ease-out;
      }
      .hud-value.amber { color: #f59e0b; }
      .hud-value.pop {
        transform: scale(1.3);
        color: #fbbf24;
      }
      .health-bar-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 140px;
      }
      .health-bar-bg {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        overflow: hidden;
      }
      .health-bar-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
        border-radius: 4px;
        transition: width 0.25s ease-out;
      }
      .hud-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(9, 9, 11, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        pointer-events: auto;
        animation: hudFadeIn 0.3s ease-out;
      }
      .hud-modal {
        background: #18181b;
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 20px;
        padding: 36px 40px;
        max-width: 440px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.15);
      }
      .hud-modal h2 {
        font-size: 32px;
        margin: 0 0 12px 0;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .hud-modal p {
        color: #a1a1aa;
        font-size: 15px;
        line-height: 1.5;
        margin: 0 0 28px 0;
      }
      .hud-btn {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #09090b;
        font-weight: 700;
        font-size: 16px;
        padding: 14px 32px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
      }
      .hud-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(245, 158, 11, 0.6);
      }
      .floating-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(245, 158, 11, 0.95);
        color: #09090b;
        font-weight: 700;
        font-size: 15px;
        padding: 10px 24px;
        border-radius: 30px;
        box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
        pointer-events: none;
        animation: hudToastIn 0.3s ease-out;
      }
      @keyframes hudFadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes hudToastIn {
        from { opacity: 0; transform: translate(-50%, 15px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  _createDOM() {
    this.root = document.createElement("div");
    this.root.id = "arcadia-hud";

    this.root.innerHTML = `
      <div class="hud-top">
        <div class="hud-card" id="hud-score-card">
          <div>
            <div class="hud-label">Score</div>
            <div class="hud-value amber" id="hud-score">0</div>
          </div>
          <div>
            <div class="hud-label">Best</div>
            <div class="hud-value" style="font-size: 16px; color: #a1a1aa;" id="hud-best">${this.highScore}</div>
          </div>
        </div>

        <div class="hud-card" id="hud-health-card">
          <div class="health-bar-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="hud-label">Health</span>
              <span id="hud-health-text" style="font-size: 12px; font-weight: 700;">100%</span>
            </div>
            <div class="health-bar-bg">
              <div class="health-bar-fill" id="hud-health-fill" style="width: 100%;"></div>
            </div>
          </div>
        </div>

        <div class="hud-card" id="hud-meta-card">
          <div>
            <div class="hud-label" id="hud-meta-label">Time</div>
            <div class="hud-value" id="hud-meta-value">00:00</div>
          </div>
        </div>
      </div>

      <div id="hud-toast-container"></div>
    `;

    this.container.appendChild(this.root);

    this.scoreEl = this.root.querySelector("#hud-score");
    this.bestEl = this.root.querySelector("#hud-best");
    this.healthFillEl = this.root.querySelector("#hud-health-fill");
    this.healthTextEl = this.root.querySelector("#hud-health-text");
    this.metaLabelEl = this.root.querySelector("#hud-meta-label");
    this.metaValueEl = this.root.querySelector("#hud-meta-value");
    this.toastContainer = this.root.querySelector("#hud-toast-container");
  }

  setScore(val) {
    this.score = val;
    this.scoreEl.textContent = this.score;
    this.scoreEl.classList.remove("pop");
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add("pop");
    setTimeout(() => this.scoreEl.classList.remove("pop"), 200);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.bestEl.textContent = this.highScore;
      localStorage.setItem("arcadia_high_score", String(this.highScore));
    }
  }

  addScore(delta) {
    this.setScore(this.score + delta);
  }

  setHealth(val, max = this.maxHealth) {
    this.health = Math.max(0, Math.min(val, max));
    this.maxHealth = max;
    const pct = Math.round((this.health / this.maxHealth) * 100);
    this.healthFillEl.style.width = `${pct}%`;
    this.healthTextEl.textContent = `${pct}%`;

    if (pct < 30) {
      this.healthFillEl.style.background = "#ef4444";
    } else if (pct < 60) {
      this.healthFillEl.style.background = "#f59e0b";
    } else {
      this.healthFillEl.style.background = "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)";
    }
  }

  setTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.metaLabelEl.textContent = "Time";
    this.metaValueEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  setMeta(label, value) {
    this.metaLabelEl.textContent = label;
    this.metaValueEl.textContent = value;
  }

  showToast(text, duration = 2000) {
    const toast = document.createElement("div");
    toast.className = "floating-toast";
    toast.textContent = text;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  showStartScreen(options = {}) {
    const modal = document.createElement("div");
    modal.className = "hud-modal-overlay";
    modal.innerHTML = `
      <div class="hud-modal">
        <h2>${options.title || "Arcadia Game"}</h2>
        <p>${options.instructions || "Use WASD or Arrow keys to move, Space to jump."}</p>
        <button class="hud-btn" id="hud-start-btn">${options.btnText || "Play Game"}</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#hud-start-btn").onclick = () => {
      modal.remove();
      if (options.onStart) options.onStart();
    };
    return modal;
  }

  showGameOver(options = {}) {
    const modal = document.createElement("div");
    modal.className = "hud-modal-overlay";
    modal.innerHTML = `
      <div class="hud-modal">
        <h2 style="color: #ef4444;">Game Over</h2>
        <p>Final Score: <strong style="color: #f59e0b; font-size: 20px;">${this.score}</strong><br>Best: ${this.highScore}</p>
        <button class="hud-btn" id="hud-retry-btn">${options.btnText || "Play Again"}</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#hud-retry-btn").onclick = () => {
      modal.remove();
      if (options.onRestart) options.onRestart();
    };
    return modal;
  }

  showVictory(options = {}) {
    const modal = document.createElement("div");
    modal.className = "hud-modal-overlay";
    modal.innerHTML = `
      <div class="hud-modal">
        <h2 style="color: #10b981;">Victory!</h2>
        <p>${options.message || "Stage Clear!"}<br>Score: <strong style="color: #f59e0b; font-size: 20px;">${this.score}</strong></p>
        <button class="hud-btn" id="hud-win-btn">${options.btnText || "Next Stage"}</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#hud-win-btn").onclick = () => {
      modal.remove();
      if (options.onRestart) options.onRestart();
    };
    return modal;
  }
}
