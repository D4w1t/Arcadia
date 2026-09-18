import * as THREE from "three";

/**
 * Arcadia Lighting - Presets and Dynamic Lights
 */

export class Lighting {
  static setup(scene, preset = "arcade", options = {}) {
    const lights = new THREE.Group();
    lights.name = "ArcadiaLightingGroup";

    switch (preset) {
      case "cyberpunk":
      case "neon": {
        const ambient = new THREE.AmbientLight(0x0f172a, 0.6);
        lights.add(ambient);

        const hemi = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.8);
        lights.add(hemi);

        const dir = new THREE.DirectionalLight(0xa855f7, 1.2);
        dir.position.set(10, 15, 8);
        dir.castShadow = true;
        lights.add(dir);

        const point = new THREE.PointLight(0xf43f5e, 3, 25, 2);
        point.position.set(-6, 4, -4);
        lights.add(point);
        break;
      }
      case "sunset": {
        const ambient = new THREE.AmbientLight(0x451a03, 0.8);
        lights.add(ambient);

        const hemi = new THREE.HemisphereLight(0xfbbf24, 0x78350f, 0.7);
        lights.add(hemi);

        const dir = new THREE.DirectionalLight(0xf97316, 2.0);
        dir.position.set(14, 8, 12);
        dir.castShadow = true;
        lights.add(dir);
        break;
      }
      case "dungeon": {
        const ambient = new THREE.AmbientLight(0x18181b, 0.4);
        lights.add(ambient);

        const torch1 = new THREE.PointLight(0xf59e0b, 2.5, 12, 2);
        torch1.position.set(4, 3, 4);
        lights.add(torch1);

        const torch2 = new THREE.PointLight(0xf59e0b, 2.5, 12, 2);
        torch2.position.set(-4, 3, -4);
        lights.add(torch2);
        break;
      }
      case "arcade":
      default: {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        lights.add(ambient);

        const hemi = new THREE.HemisphereLight(0xfff7ed, 0x09090b, 0.6);
        hemi.position.set(0, 20, 0);
        lights.add(hemi);

        const dir = new THREE.DirectionalLight(0xffedd5, 1.2);
        dir.position.set(8, 14, 8);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        dir.shadow.bias = -0.0005;
        const d = 16;
        dir.shadow.camera.left = -d;
        dir.shadow.camera.right = d;
        dir.shadow.camera.top = d;
        dir.shadow.camera.bottom = -d;
        lights.add(dir);

        // Arcadia Amber Accent Rim Light (#F59E0B)
        const accent = new THREE.PointLight(0xf59e0b, 2.5, 20, 1.5);
        accent.position.set(-6, 3, -4);
        lights.add(accent);
        break;
      }
    }

    scene.add(lights);
    return lights;
  }
}
