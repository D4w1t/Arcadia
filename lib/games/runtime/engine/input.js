/**
 * Arcadia Input - Raw Keyboard, Mouse, Pointer Lock, and Touch Handling
 */

export class Input {
  constructor(domElement = window) {
    this.domElement = domElement;
    this.keys = new Map();
    this.justPressed = new Set();
    this.justReleased = new Set();

    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: new Set(),
      isDown: false,
      isLocked: false,
    };

    this.touches = new Map();
    this.actions = new Map();

    this._bindDefaultActions();
    this._bindEvents();
  }

  _bindDefaultActions() {
    this.mapAction("forward", ["KeyW", "ArrowUp"]);
    this.mapAction("backward", ["KeyS", "ArrowDown"]);
    this.mapAction("left", ["KeyA", "ArrowLeft"]);
    this.mapAction("right", ["KeyD", "ArrowRight"]);
    this.mapAction("jump", ["Space", "KeyJ"]);
    this.mapAction("fire", ["KeyK", "Enter", "MouseButton0"]);
    this.mapAction("sprint", ["ShiftLeft", "ShiftRight"]);
    this.mapAction("pause", ["Escape", "KeyP"]);
  }

  mapAction(action, keyOrCodeList) {
    this.actions.set(action, Array.isArray(keyOrCodeList) ? keyOrCodeList : [keyOrCodeList]);
  }

  _bindEvents() {
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys.get(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.set(e.code, true);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.set(e.code, false);
      this.justReleased.add(e.code);
    });

    window.addEventListener("mousedown", (e) => {
      this.mouse.buttons.add(e.button);
      this.mouse.isDown = true;
      this.justPressed.add(`MouseButton${e.button}`);
    });

    window.addEventListener("mouseup", (e) => {
      this.mouse.buttons.delete(e.button);
      this.mouse.isDown = this.mouse.buttons.size > 0;
      this.justReleased.add(`MouseButton${e.button}`);
    });

    window.addEventListener("mousemove", (e) => {
      this.mouse.deltaX = e.movementX || 0;
      this.mouse.deltaY = e.movementY || 0;
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    document.addEventListener("pointerlockchange", () => {
      this.mouse.isLocked = document.pointerLockElement !== null;
    });
  }

  requestPointerLock(element = document.body) {
    element.requestPointerLock?.();
  }

  exitPointerLock() {
    document.exitPointerLock?.();
  }

  isDown(actionOrCode) {
    if (this.keys.get(actionOrCode)) return true;
    if (this.actions.has(actionOrCode)) {
      const keys = this.actions.get(actionOrCode);
      return keys.some((k) => this.keys.get(k) || this.mouse.buttons.has(Number(k.replace("MouseButton", ""))));
    }
    return false;
  }

  wasPressed(actionOrCode) {
    if (this.justPressed.has(actionOrCode)) return true;
    if (this.actions.has(actionOrCode)) {
      const keys = this.actions.get(actionOrCode);
      return keys.some((k) => this.justPressed.has(k));
    }
    return false;
  }

  getAxis2D(negX = "left", posX = "right", negY = "backward", posY = "forward") {
    let x = 0;
    let y = 0;
    if (this.isDown(posX)) x += 1;
    if (this.isDown(negX)) x -= 1;
    if (this.isDown(posY)) y += 1;
    if (this.isDown(negY)) y -= 1;

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  clearFrame() {
    this.justPressed.clear();
    this.justReleased.clear();
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }
}
