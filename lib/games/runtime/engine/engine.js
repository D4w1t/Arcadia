import * as THREE from "three";
import { Lighting } from "./lighting.js";
import { PhysicsWorld } from "./physics.js";

/**
 * Arcadia Engine - Core 3D Scene, Renderer, and Game Loop Orchestrator
 */

export class Engine {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.shadows = options.shadows !== false;
    this.antialias = options.antialias !== false;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.background || 0x09090b);

    const fov = options.fov || 50;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    this.camera.position.set(0, 3, 7);
    this.camera.lookAt(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.antialias,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = options.exposure || 1.1;

    if (this.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.container.appendChild(this.renderer.domElement);

    // Physics World
    this.physics = new PhysicsWorld();

    // Lighting
    this.lighting = Lighting.setup(this.scene, options.lighting || "arcade");

    // Entities & Loop
    this.clock = new THREE.Clock();
    this.time = 0;
    this.dt = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.updatables = [];

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Resize Handler
    this._handleResize = this._onResize.bind(this);
    window.addEventListener("resize", this._handleResize);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  add(entity) {
    if (!entity) return;
    if (entity.isObject3D) {
      this.scene.add(entity);
    } else if (entity.mesh && entity.mesh.isObject3D) {
      this.scene.add(entity.mesh);
    }

    if (typeof entity.update === "function") {
      this.updatables.push(entity);
    }

    if (typeof entity.init === "function") {
      entity.init(this);
    }

    return entity;
  }

  remove(entity) {
    if (!entity) return;
    if (entity.isObject3D) {
      this.scene.remove(entity);
    } else if (entity.mesh && entity.mesh.isObject3D) {
      this.scene.remove(entity.mesh);
    }

    const idx = this.updatables.indexOf(entity);
    if (idx !== -1) this.updatables.splice(idx, 1);

    if (typeof entity.destroy === "function") {
      entity.destroy();
    }
  }

  start(onUpdate) {
    this.onUpdateCallback = onUpdate;
    this.isRunning = true;
    this.clock.start();
    this._loop();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.clock.getDelta();
  }

  _loop() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this._loop());

    let dt = this.clock.getDelta();
    if (dt > 0.1) dt = 0.1; // Clamp delta
    this.dt = dt;
    this.time = this.clock.getElapsedTime();

    if (!this.isPaused) {
      for (let i = 0; i < this.updatables.length; i++) {
        this.updatables[i].update(dt, this.time);
      }

      if (this.onUpdateCallback) {
        this.onUpdateCallback(dt, this.time);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  raycastFromPointer(event, objects = this.scene.children) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }
}
