import * as THREE from "three";
import { Input } from "./input.js";
import { damp } from "./math.js";

/**
 * Arcadia Controls - Player and Camera Controllers
 */

export class CharacterController {
  constructor(mesh, input = new Input(), options = {}) {
    this.mesh = mesh;
    this.input = input;
    this.speed = options.speed || 8;
    this.jumpForce = options.jumpForce || 10;
    this.gravity = options.gravity || 25;
    this.turnSpeed = options.turnSpeed || 12;

    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.groundY = options.groundY || 0;
  }

  update(dt) {
    const axis = this.input.getAxis2D("left", "right", "backward", "forward");

    // Horizontal Movement
    const targetVelX = axis.x * this.speed;
    const targetVelZ = -axis.y * this.speed;

    this.velocity.x = damp(this.velocity.x, targetVelX, 10, dt);
    this.velocity.z = damp(this.velocity.z, targetVelZ, 10, dt);

    // Jump
    if (this.input.wasPressed("jump") && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Apply Gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // Update Position
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;

    // Ground Check
    if (this.mesh.position.y <= this.groundY) {
      this.mesh.position.y = this.groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Rotate Mesh towards movement direction
    if (Math.hypot(axis.x, axis.y) > 0.05) {
      const targetAngle = Math.atan2(axis.x, -axis.y);
      this.mesh.rotation.y = damp(this.mesh.rotation.y, targetAngle, this.turnSpeed, dt);
    }
  }
}

export class ThirdPersonCamera {
  constructor(camera, target, options = {}) {
    this.camera = camera;
    this.target = target;
    this.offset = options.offset || new THREE.Vector3(0, 4, 7);
    this.lookOffset = options.lookOffset || new THREE.Vector3(0, 1.2, 0);
    this.smoothness = options.smoothness || 0.1;
  }

  update(dt) {
    if (!this.target) return;
    const targetPos = this.target.position;

    const desiredPos = new THREE.Vector3().copy(targetPos).add(this.offset);
    this.camera.position.lerp(desiredPos, this.smoothness);

    const lookAtPos = new THREE.Vector3().copy(targetPos).add(this.lookOffset);
    this.camera.lookAt(lookAtPos);
  }
}

export class FirstPersonCamera {
  constructor(camera, domElement = document.body, options = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.sensitivity = options.sensitivity || 0.002;
    this.pitch = 0;
    this.yaw = 0;

    this._bind();
  }

  _bind() {
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== this.domElement) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    });
  }
}

export class VirtualJoystick {
  constructor() {
    this.vector = { x: 0, y: 0 };
    this.isActive = false;
    this._createDOM();
  }

  _createDOM() {
    if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;

    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      position: "fixed",
      bottom: "28px",
      left: "28px",
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      backgroundColor: "rgba(24, 24, 27, 0.5)",
      border: "2px solid rgba(245, 158, 11, 0.4)",
      backdropFilter: "blur(8px)",
      touchAction: "none",
      zIndex: "999",
      userSelect: "none",
    });

    this.stick = document.createElement("div");
    Object.assign(this.stick.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      backgroundColor: "#f59e0b",
      boxShadow: "0 0 15px rgba(245, 158, 11, 0.6)",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    });

    this.container.appendChild(this.stick);
    document.body.appendChild(this.container);

    const radius = 60;
    const handleTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      this.stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.vector.x = dx / radius;
      this.vector.y = dy / radius;
      this.isActive = true;
    };

    const resetTouch = () => {
      this.stick.style.transform = "translate(-50%, -50%)";
      this.vector.x = 0;
      this.vector.y = 0;
      this.isActive = false;
    };

    this.container.addEventListener("touchstart", handleTouch, { passive: false });
    this.container.addEventListener("touchmove", handleTouch, { passive: false });
    this.container.addEventListener("touchend", resetTouch);
    this.container.addEventListener("touchcancel", resetTouch);
  }
}
