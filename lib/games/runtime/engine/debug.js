import * as THREE from "three";

/**
 * Arcadia Debug - FPS Counter, Bounding Box Visualizer, and Axes Helper
 */

export class Debug {
  constructor(scene, container = document.body) {
    this.scene = scene;
    this.container = container;
    this.fps = 60;
    this.frames = 0;
    this.prevTime = performance.now();
    this.boxes = new Map();

    this._createDOM();
  }

  _createDOM() {
    this.el = document.createElement("div");
    Object.assign(this.el.style, {
      position: "fixed",
      bottom: "12px",
      right: "12px",
      padding: "6px 12px",
      background: "rgba(9, 9, 11, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "6px",
      color: "#10b981",
      fontFamily: "monospace",
      fontSize: "12px",
      zIndex: "9999",
      pointerEvents: "none",
    });
    this.el.textContent = "60 FPS";
    this.container.appendChild(this.el);
  }

  update() {
    this.frames++;
    const now = performance.now();
    if (now >= this.prevTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (now - this.prevTime));
      this.el.textContent = `${this.fps} FPS`;
      if (this.fps < 30) {
        this.el.style.color = "#ef4444";
      } else if (this.fps < 50) {
        this.el.style.color = "#f59e0b";
      } else {
        this.el.style.color = "#10b981";
      }
      this.frames = 0;
      this.prevTime = now;
    }

    // Update debug bounding boxes
    for (const [mesh, helper] of this.boxes.entries()) {
      helper.update();
    }
  }

  showAxes(size = 5) {
    if (!this.axesHelper) {
      this.axesHelper = new THREE.AxesHelper(size);
      this.scene.add(this.axesHelper);
    }
  }

  showBoundingBox(mesh, color = 0x10b981) {
    if (this.boxes.has(mesh)) return;
    const helper = new THREE.BoxHelper(mesh, color);
    this.scene.add(helper);
    this.boxes.set(mesh, helper);
  }

  hideBoundingBox(mesh) {
    if (this.boxes.has(mesh)) {
      const helper = this.boxes.get(mesh);
      this.scene.remove(helper);
      this.boxes.delete(mesh);
    }
  }
}
