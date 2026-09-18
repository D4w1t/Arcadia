import * as THREE from "three";

/**
 * Arcadia Physics - 3D Collision Detection and Physics World
 */

export class Collider {
  constructor(mesh, type = "box", options = {}) {
    this.mesh = mesh;
    this.type = type; // "box" | "sphere"
    this.radius = options.radius || 1;
    this.size = options.size || new THREE.Vector3(1, 1, 1);
    this.offset = options.offset || new THREE.Vector3(0, 0, 0);

    this.box = new THREE.Box3();
    this.sphere = new THREE.Sphere();
    this.update();
  }

  update() {
    if (this.type === "box") {
      this.box.setFromObject(this.mesh);
    } else if (this.type === "sphere") {
      const center = new THREE.Vector3().copy(this.mesh.position).add(this.offset);
      this.sphere.set(center, this.radius);
    }
  }

  intersects(other) {
    this.update();
    other.update();

    if (this.type === "box" && other.type === "box") {
      return this.box.intersectsBox(other.box);
    }
    if (this.type === "sphere" && other.type === "sphere") {
      return this.sphere.intersectsSphere(other.sphere);
    }
    if (this.type === "box" && other.type === "sphere") {
      return this.box.intersectsSphere(other.sphere);
    }
    if (this.type === "sphere" && other.type === "box") {
      return other.box.intersectsSphere(this.sphere);
    }
    return false;
  }
}

export class PhysicsWorld {
  constructor(options = {}) {
    this.gravity = options.gravity !== undefined ? options.gravity : -9.8;
    this.colliders = new Set();
    this.raycaster = new THREE.Raycaster();
  }

  add(mesh, type = "box", options = {}) {
    const collider = new Collider(mesh, type, options);
    mesh.collider = collider;
    this.colliders.add(collider);
    return collider;
  }

  remove(mesh) {
    if (mesh.collider) {
      this.colliders.delete(mesh.collider);
      delete mesh.collider;
    }
  }

  /**
   * Test if a given mesh intersects any other registered collider
   */
  checkCollisions(mesh) {
    if (!mesh.collider) {
      this.add(mesh);
    }
    const myCollider = mesh.collider;
    const hits = [];

    for (const other of this.colliders) {
      if (other !== myCollider && myCollider.intersects(other)) {
        hits.push(other.mesh);
      }
    }
    return hits;
  }

  /**
   * Raycast down to find ground elevation
   */
  getGroundHeight(x, z, groundObjects, startY = 50) {
    const origin = new THREE.Vector3(x, startY, z);
    const dir = new THREE.Vector3(0, -1, 0);
    this.raycaster.set(origin, dir);
    const intersects = this.raycaster.intersectObjects(groundObjects, true);
    return intersects.length > 0 ? intersects[0].point.y : 0;
  }
}
