export const runtime = `
# Runtime & Sandbox Environment

The game is executed and previewed inside a dedicated Daytona cloud sandbox environment.

## Environment Details:
- **Sandbox Root**: Linux environment with standard tools and runtimes.
- **Game Directory**: \`/home/daytona/game\` is the root directory for all game assets and code.
- **Entrypoint**: \`/home/daytona/game/index.html\` is served by an internal HTTP server on port 3000 and embedded into the live preview iframe.
- **Preview Server**: A local static web server serves the \`/home/daytona/game\` directory. Any updates to \`index.html\` or related files are reflected immediately upon preview reload.

## Built-In Arcadia 3D Engine Primitives (Pre-Seeded in /home/daytona/game/engine/):
Every new sandbox is pre-seeded with modular, production-ready 3D game engine primitives inside \`/home/daytona/game/engine/\`:
- Master bundle: \`./engine/index.js\` (or \`./arcadia.js\`)
- Granular modules:
  - \`./engine/engine.js\`: Core scene, camera, renderer, and game loop
  - \`./engine/input.js\`: Raw keyboard, mouse, pointer lock, and touch tracking
  - \`./engine/controls.js\`: CharacterController, ThirdPersonCamera, FirstPersonCamera, VirtualJoystick
  - \`./engine/physics.js\`: Collider, PhysicsWorld (AABB, sphere, raycast elevation)
  - \`./engine/lighting.js\`: Lighting presets (arcade, cyberpunk, sunset, dungeon)
  - \`./engine/materials.js\`: PBR, Toon, Neon, Glass, Canvas textures
  - \`./engine/animation.js\`: AnimationManager, Easing, procedural bob, spin, camera shake
  - \`./engine/particles.js\`: ParticleSystem (bursts, sparks, smoke)
  - \`./engine/models.js\`: Models (createArcadiaCube, createCharacter, createCoin, createSpaceship, createEnemy, createPlatform, createGroundGrid)
  - \`./engine/sound.js\`: Sound (Web Audio synthesized SFX and BGM generator)
  - \`./engine/hud.js\`: HUD (glassmorphic score, health bar, timer, toast, dialog modals)
  - \`./engine/state.js\`: GameState, GameStates, event bus
  - \`./engine/postfx.js\`: PostFX (vignette, scanlines, screen flash)
  - \`./engine/debug.js\`: Debug (FPS counter, bounding box visualizers, axes helper)
  - \`./engine/math.js\`: clamp, lerp, damp, smoothstep, randFloat, randInt

- Three.js is loaded via importmap in \`index.html\`:
  \`\`\`html
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  \`\`\`

### Example Usage:
\`\`\`javascript
import * as THREE from "three";
import { Engine, Models, Controls, CharacterController, HUD, Sound, ParticleSystem } from "./engine/index.js";

const engine = new Engine();
const hud = new HUD();
const sound = new Sound();
const particles = new ParticleSystem(engine.scene);

const player = Models.createCharacter();
engine.add(player);

const controller = new CharacterController(player, engine.input);

engine.start((dt, time) => {
  controller.update(dt);
  particles.update(dt);
});
\`\`\`

## Technical Architecture & Constraints:
- **Use Pre-Seeded Primitives**: Always leverage \`./engine/\` primitives first to build games rapidly with rich 3D graphics, responsive controls, sounds, and UI.
- **No External Bundler Required**: Import Three.js via the importmap and load local modules via relative paths (\`import { Engine, Models, ... } from "./engine/index.js"\`).
- **Responsive & Embed-Friendly**:
  - The game runs inside an iframe with dynamic dimensions. Design the canvas or container to scale smoothly with CSS.
  - Prevent default scrolling when arrow keys or spacebar are pressed (\`e.preventDefault()\`), handled automatically by \`Input\` / \`Controls\`.
- **Audio Autoplay**: Autoplay policies require user interaction before playing audio, handled automatically by \`Sound\`.
`.trim()

export const runtimeInstructions = runtime


