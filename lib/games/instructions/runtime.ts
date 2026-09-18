export const runtime = `
# Runtime & Sandbox Environment

The game is executed and previewed inside a dedicated Daytona cloud sandbox environment.

## Environment Details:
- **Sandbox Root**: Linux environment with standard tools and runtimes.
- **Game Directory**: \`/home/daytona/game\` is the root directory for all game assets and code.
- **Entrypoint**: \`/home/daytona/game/index.html\` is served by an internal HTTP server on port 3000 and embedded into the live preview iframe.
- **Preview Server**: A local static web server serves the \`/home/daytona/game\` directory. Any updates to \`index.html\` or related files are reflected immediately upon preview reload.

## Technical Architecture & Constraints:
- **Self-Contained Browser Apps**: Prefer standard HTML5, modern vanilla JavaScript/TypeScript, CSS, HTML5 Canvas API, SVG, and Web Audio API for maximum reliability and instant execution.
- **No External Bundler Required**: All scripts and styles should either be directly inlined into \`index.html\` or referenced via relative paths (e.g. \`./game.js\`, \`./style.css\`) within the \`/home/daytona/game\` folder.
- **Responsive & Embed-Friendly**:
  - The game runs inside an iframe with dynamic dimensions. Design the canvas or container to scale smoothly with CSS (\`max-width: 100%; max-height: 100%; display: block;\` or responsive aspect ratio).
  - Ensure the iframe captures keyboard focus appropriately (\`tabindex="0"\` on canvas or auto-focus).
  - Prevent default scrolling when arrow keys or spacebar are pressed inside the game canvas (\`e.preventDefault()\`).
- **Audio & Media**:
  - Use synthesized sound effects via Web Audio API (\`AudioContext\`) or standard royalty-free data URLs so sound works without external network dependencies.
  - Resume \`AudioContext\` upon the first user interaction (click or keypress) to comply with browser autoplay policies.
`.trim()

export const runtimeInstructions = runtime

