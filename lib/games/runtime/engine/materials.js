import * as THREE from "three";

/**
 * Arcadia Materials - Curated PBR, Toon, and Neon Emissive Materials
 */

export class Materials {
  static pbr(options = {}) {
    return new THREE.MeshStandardMaterial({
      color: options.color || 0xf8fafc,
      roughness: options.roughness !== undefined ? options.roughness : 0.4,
      metalness: options.metalness !== undefined ? options.metalness : 0.1,
      ...options,
    });
  }

  static toon(options = {}) {
    return new THREE.MeshToonMaterial({
      color: options.color || 0xf59e0b,
      ...options,
    });
  }

  static neon(color = 0xf59e0b, intensity = 2.0) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.2,
      metalness: 0.1,
    });
  }

  static amberGlow() {
    return this.neon(0xf59e0b, 1.8);
  }

  static glass(options = {}) {
    return new THREE.MeshPhysicalMaterial({
      color: options.color || 0xffffff,
      transmission: options.transmission || 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
      ...options,
    });
  }

  static createCanvasTexture(drawFn, width = 512, height = 512) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    drawFn(ctx, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
