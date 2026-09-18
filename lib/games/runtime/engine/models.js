import * as THREE from "three";
import { Materials } from "./materials.js";

/**
 * Arcadia Models - Procedural 3D Low-Poly Models & Game Primitives
 */

export class Models {
  /**
   * Generates the signature Arcadia 3D Cube styled directly after public/logo.svg
   */
  static createArcadiaCube(options = {}) {
    const size = options.size || 2;
    const group = new THREE.Group();

    const logoTexture = Materials.createCanvasTexture((ctx, w, h) => {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#fbbf24");
      grad.addColorStop(0.5, "#f59e0b");
      grad.addColorStop(1, "#d97706");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Border bevel
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 16;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      // Arcadia "A" emblem
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(7.5, 7.5);
      ctx.translate(-24, -24);

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      // Top bar
      ctx.beginPath();
      ctx.moveTo(27.998, 20);
      ctx.lineTo(27.998, 12);
      ctx.lineTo(11.998, 12);
      ctx.lineTo(11.998, 20);
      ctx.closePath();
      ctx.fill();

      // Lower curve & leg
      ctx.beginPath();
      ctx.moveTo(27.998, 28);
      ctx.bezierCurveTo(23.58, 28, 20, 31.58, 20, 36);
      ctx.lineTo(12, 36);
      ctx.lineTo(12, 35.8);
      ctx.bezierCurveTo(12.1, 27.08, 19.17, 20.05, 27.89, 20);
      ctx.lineTo(36, 20);
      ctx.lineTo(36, 36);
      ctx.lineTo(28, 36);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }, 512, 512);

    const geom = new THREE.BoxGeometry(size, size, size);
    const faceMaterial = new THREE.MeshStandardMaterial({
      map: logoTexture,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.15,
    });

    const cubeMesh = new THREE.Mesh(geom, faceMaterial);
    cubeMesh.castShadow = true;
    cubeMesh.receiveShadow = true;
    group.add(cubeMesh);

    // Glowing wireframe accent cage
    const wireGeom = new THREE.BoxGeometry(size * 1.01, size * 1.01, size * 1.01);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    group.add(wireMesh);

    group.cubeMesh = cubeMesh;
    return group;
  }

  static createCharacter(options = {}) {
    const group = new THREE.Group();
    const primaryColor = options.color || 0xf59e0b;

    const bodyMat = Materials.pbr({ color: primaryColor, roughness: 0.4 });
    const skinMat = Materials.pbr({ color: 0xffedd5, roughness: 0.5 });
    const darkMat = Materials.pbr({ color: 0x18181b, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.5), bodyMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMat);
    head.position.y = 1.8;
    head.castShadow = true;
    group.add(head);

    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.1), darkMat);
    visor.position.set(0, 1.85, 0.31);
    group.add(visor);

    // Limbs
    const limbGeom = new THREE.BoxGeometry(0.24, 0.7, 0.24);
    const leftArm = new THREE.Mesh(limbGeom, bodyMat);
    leftArm.position.set(-0.55, 1.0, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(limbGeom, bodyMat);
    rightArm.position.set(0.55, 1.0, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    const leftLeg = new THREE.Mesh(limbGeom, darkMat);
    leftLeg.position.set(-0.25, 0.35, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(limbGeom, darkMat);
    rightLeg.position.set(0.25, 0.35, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    group.animateWalk = (speed = 10, time = Date.now() * 0.001) => {
      const angle = Math.sin(time * speed) * 0.6;
      leftLeg.rotation.x = angle;
      rightLeg.rotation.x = -angle;
      leftArm.rotation.x = -angle;
      rightArm.rotation.x = angle;
    };

    group.resetPose = () => {
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = 0;
      rightArm.rotation.x = 0;
    };

    return group;
  }

  static createCoin(options = {}) {
    const radius = options.radius || 0.5;
    const geom = new THREE.CylinderGeometry(radius, radius, 0.12, 24);
    const mat = Materials.pbr({
      color: options.color || 0xfbbf24,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3,
    });
    const coin = new THREE.Mesh(geom, mat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;

    const group = new THREE.Group();
    group.add(coin);
    group.update = (dt, time) => {
      group.rotation.y += 2.5 * dt;
      group.position.y += Math.sin(time * 3) * 0.003;
    };
    return group;
  }

  static createSpaceship(options = {}) {
    const group = new THREE.Group();
    const hullMat = Materials.pbr({ color: options.color || 0xf8fafc, roughness: 0.3 });
    const accentMat = Materials.pbr({ color: options.accentColor || 0xf59e0b, roughness: 0.2 });

    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 4), hullMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.castShadow = true;
    group.add(fuselage);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.8), accentMat);
    wings.position.set(0, 0, 0.2);
    wings.castShadow = true;
    group.add(wings);

    const thruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 0.3, 12),
      Materials.neon(0x38bdf8, 1.5)
    );
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(0, 0, 1.2);
    group.add(thruster);

    return group;
  }

  static createEnemy(options = {}) {
    const group = new THREE.Group();
    const bodyMat = Materials.pbr({ color: options.color || 0x3f3f46, roughness: 0.3, metalness: 0.7 });
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(options.radius || 0.6, 0), bodyMat);
    body.castShadow = true;
    group.add(body);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), Materials.neon(0xef4444, 2.0));
    eye.position.set(0, 0, 0.5);
    group.add(eye);

    group.update = (dt, time) => {
      body.rotation.y += 1.2 * dt;
      group.position.y += Math.sin(time * 4) * 0.005;
    };

    return group;
  }

  static createPlatform(options = {}) {
    const width = options.width || 4;
    const height = options.height || 0.6;
    const depth = options.depth || 4;

    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      Materials.pbr({ color: options.color || 0x18181b, roughness: 0.4 })
    );
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);

    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.05, 0.08, depth + 0.05),
      Materials.neon(options.edgeColor || 0xf59e0b, 1.2)
    );
    edge.position.y = height / 2;
    group.add(edge);

    return group;
  }

  static createGroundGrid(options = {}) {
    const size = options.size || 60;
    const divisions = options.divisions || 60;

    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      Materials.pbr({ color: options.color || 0x09090b, roughness: 0.85 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    group.add(plane);

    const grid = new THREE.GridHelper(
      size,
      divisions,
      options.centerLineColor || 0xf59e0b,
      options.gridColor || 0x27272a
    );
    grid.position.y = 0;
    group.add(grid);

    return group;
  }
}
