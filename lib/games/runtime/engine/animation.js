import * as THREE from "three";

/**
 * Arcadia Animation - Tweens, Easings, and Procedural Motion
 */

export const Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export class AnimationManager {
  constructor() {
    this.tweens = [];
  }

  tween(object, property, endValue, duration = 0.5, easing = Easing.easeOutQuad, onComplete = null) {
    const startValue = object[property];
    const tweenItem = {
      object,
      property,
      startValue,
      endValue,
      duration,
      easing,
      elapsed: 0,
      onComplete,
    };
    this.tweens.push(tweenItem);
    return tweenItem;
  }

  update(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.elapsed += dt;
      const progress = Math.min(1, tw.elapsed / tw.duration);
      const eased = tw.easing(progress);

      tw.object[tw.property] = tw.startValue + (tw.endValue - tw.startValue) * eased;

      if (progress >= 1) {
        if (typeof tw.onComplete === "function") {
          tw.onComplete();
        }
        this.tweens.splice(i, 1);
      }
    }
  }

  static bob(mesh, time, baseY = 0, amplitude = 0.3, speed = 2) {
    mesh.position.y = baseY + Math.sin(time * speed) * amplitude;
  }

  static spin(mesh, dt, speed = 1.5, axis = "y") {
    mesh.rotation[axis] += speed * dt;
  }

  static shakeCamera(camera, intensity = 0.3, duration = 0.3) {
    const originalPos = camera.position.clone();
    let elapsed = 0;
    const interval = 1 / 60;

    const shakeId = setInterval(() => {
      elapsed += interval;
      if (elapsed >= duration) {
        clearInterval(shakeId);
        camera.position.copy(originalPos);
        return;
      }
      const decay = 1 - elapsed / duration;
      camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity * decay;
      camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity * decay;
    }, interval * 1000);
  }
}
