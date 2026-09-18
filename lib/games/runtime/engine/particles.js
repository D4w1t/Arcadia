import * as THREE from "three";

/**
 * Arcadia Particles - 3D Particle Emitter and Effects
 */

export class ParticleSystem {
  constructor(scene, maxParticles = 300) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.particles = [];

    const geom = new THREE.BufferGeometry();
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    geom.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    geom.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geom, this.material);
    this.scene.add(this.points);

    // Hide inactive particles
    for (let i = 0; i < maxParticles; i++) {
      this.positions[i * 3 + 1] = -9999;
    }
  }

  burst(x, y, z, count = 25, colorHex = 0xf59e0b) {
    const col = new THREE.Color(colorHex);
    const toSpawn = Math.min(count, this.maxParticles - this.particles.length);

    for (let i = 0; i < toSpawn; i++) {
      const speed = 2 + Math.random() * 6;
      const angleTheta = Math.random() * Math.PI * 2;
      const anglePhi = (Math.random() - 0.5) * Math.PI;

      this.particles.push({
        x,
        y,
        z,
        vx: Math.cos(angleTheta) * Math.cos(anglePhi) * speed,
        vy: Math.sin(anglePhi) * speed + 2,
        vz: Math.sin(angleTheta) * Math.cos(anglePhi) * speed,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 1.0,
        decay: 1.5 + Math.random() * 1.5,
        size: 0.3 + Math.random() * 0.4,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      p.vy -= 9.8 * dt; // Gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Refresh buffer attributes
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;

        this.colors[i * 3] = p.r * p.life;
        this.colors[i * 3 + 1] = p.g * p.life;
        this.colors[i * 3 + 2] = p.b * p.life;

        this.sizes[i] = p.size * p.life;
      } else {
        this.positions[i * 3 + 1] = -9999;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    this.points.geometry.attributes.size.needsUpdate = true;
  }
}
