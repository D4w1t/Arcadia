/**
 * Arcadia PostFX - Lightweight Post-Processing and Screen Overlays
 * Provides zero-overhead visual enhancements: Vignette, CRT scanlines, screen flash, and color grading.
 */

export class PostFX {
  constructor(container = document.body) {
    this.container = container;
    this._injectStyles();
    this._createDOM();
  }

  _injectStyles() {
    if (document.getElementById("arcadia-postfx-styles")) return;

    const style = document.createElement("style");
    style.id = "arcadia-postfx-styles";
    style.textContent = `
      .arcadia-fx-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 50;
      }
      .arcadia-vignette {
        box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.7);
      }
      .arcadia-scanlines {
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
        background-size: 100% 4px;
      }
      .arcadia-flash {
        opacity: 0;
        transition: opacity 0.05s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  _createDOM() {
    this.root = document.createElement("div");
    this.root.className = "arcadia-fx-overlay arcadia-vignette";

    this.flashEl = document.createElement("div");
    this.flashEl.className = "arcadia-fx-overlay arcadia-flash";

    this.container.appendChild(this.root);
    this.container.appendChild(this.flashEl);
  }

  enableScanlines(enable = true) {
    this.root.classList.toggle("arcadia-scanlines", enable);
  }

  flash(color = "rgba(239, 68, 68, 0.4)", duration = 200) {
    this.flashEl.style.backgroundColor = color;
    this.flashEl.style.opacity = "1";
    setTimeout(() => {
      this.flashEl.style.opacity = "0";
      this.flashEl.style.transition = `opacity ${duration}ms ease-out`;
    }, 40);
  }

  flashDamage() {
    this.flash("rgba(239, 68, 68, 0.45)", 250);
  }

  flashCoin() {
    this.flash("rgba(245, 158, 11, 0.35)", 200);
  }
}
