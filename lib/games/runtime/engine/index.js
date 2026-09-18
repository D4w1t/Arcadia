/**
 * Arcadia 3D Game Engine - Unified Entry Point
 * All-in-one primitives for browser 3D game generation.
 */

export * from "./math.js";
export * from "./input.js";
export * from "./controls.js";
export * from "./physics.js";
export * from "./lighting.js";
export * from "./materials.js";
export * from "./animation.js";
export * from "./particles.js";
export * from "./models.js";
export * from "./sound.js";
export * from "./hud.js";
export * from "./state.js";
export * from "./postfx.js";
export * from "./debug.js";
export * from "./engine.js";

import * as MathUtils from "./math.js";
import { Input } from "./input.js";
import { CharacterController, ThirdPersonCamera, FirstPersonCamera, VirtualJoystick } from "./controls.js";
import { Collider, PhysicsWorld } from "./physics.js";
import { Lighting } from "./lighting.js";
import { Materials } from "./materials.js";
import { AnimationManager, Easing } from "./animation.js";
import { ParticleSystem } from "./particles.js";
import { Models } from "./models.js";
import { Sound } from "./sound.js";
import { HUD } from "./hud.js";
import { GameState, GameStates } from "./state.js";
import { PostFX } from "./postfx.js";
import { Debug } from "./debug.js";
import { Engine } from "./engine.js";

export const Arcadia = {
  Math: MathUtils,
  Input,
  CharacterController,
  ThirdPersonCamera,
  FirstPersonCamera,
  VirtualJoystick,
  Collider,
  PhysicsWorld,
  Lighting,
  Materials,
  Animation: AnimationManager,
  Easing,
  ParticleSystem,
  Models,
  Sound,
  HUD,
  GameState,
  GameStates,
  PostFX,
  Debug,
  Engine,
};

export default Arcadia;
