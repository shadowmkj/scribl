## [v0.1.0](https://github.com/shadowmkj/scribl/releases/tag/v0.1.0) - 2026-11-07

### 🚀 Features

- _(core)_ Implement canvas types and camera coordinate math - ([0c868b7](https://github.com/shadowmkj/scribl/commit/0c868b7c7fb5c74c42c724ed8ddaf91f387d2e61)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(engine)_ Add perfect-freehand inking engine and stroke geometry - ([9e07f8f](https://github.com/shadowmkj/scribl/commit/9e07f8ffd095a10cc5b9630074ada9118bd4bf64)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(history)_ Implement command-based undo/redo history and document store - ([3ed2d40](https://github.com/shadowmkj/scribl/commit/3ed2d401a34cf7e30f82eb08a3446ba585f2dc57)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(rendering)_ Add dual-canvas renderers with 240Hz scratch canvas and viewport culling - ([1eb43fb](https://github.com/shadowmkj/scribl/commit/1eb43fbe7bfbdbcba185a0a0f6d4028b9e070b24)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(input)_ Add coalesced pointer routing, palm rejection, and hit testing - ([90acb9d](https://github.com/shadowmkj/scribl/commit/90acb9d76f5499cfe1a46a4bb50193d621178103)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(ui)_ Add CanvasViewport, infinite grid, and selection overlay - ([9c7164d](https://github.com/shadowmkj/scribl/commit/9c7164d051f10799a54e5880cc2058b3a938997e)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(ui)_ Add floating island dock, style inspector, zoom HUD, and top header - ([68a3228](https://github.com/shadowmkj/scribl/commit/68a3228928122cd5eacd2fd80384eb64233c888c)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(persistence)_ Add autosave, .scribl file serializer, and PNG export - ([d126931](https://github.com/shadowmkj/scribl/commit/d126931f9a591a6393482e80aaff53dc93ba62db)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(app)_ Integrate keyboard shortcuts, global layout, and event handlers - ([810f334](https://github.com/shadowmkj/scribl/commit/810f334051746ce37fe1de0b38e9621454e878f1)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(branding)_ Use logo.png across app UI, favicon, and macOS app bundle icons - ([fd0f9f2](https://github.com/shadowmkj/scribl/commit/fd0f9f24239347ab63d8f3b90e70bfb84a35ee68)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(eraser)_ Refine eraser with subtle grayish trailing and minimalist circular cursor - ([eaa0a55](https://github.com/shadowmkj/scribl/commit/eaa0a555f4e79b72003ec565a4e1dbfbaccb4b33)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(camera)_ Add spacebar-to-pan functionality and grab cursors - ([d870854](https://github.com/shadowmkj/scribl/commit/d8708546f021b9a17400cde276dad558e2dd064c)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(ui)_ Overhaul top bar and canvas HUD with glassmorphic aesthetics and vector icons - ([62876ba](https://github.com/shadowmkj/scribl/commit/62876ba3e84aa5570a5ce0f07942d5b427d0d7d8)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Add CI workflows for Scribl - ([9e8b34c](https://github.com/shadowmkj/scribl/commit/9e8b34c4f8530ce231f3668db6c6b1861e5a886b)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(tool)_ Add dedicated Zoom tool with scrubby and selection zoom modes - ([d264221](https://github.com/shadowmkj/scribl/commit/d264221bf385025fac04370eed38e857824b666a)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(config)_ Add Neovim-style Lua configuration engine and hot-reload ([#1](https://github.com/shadowmkj/scribl/pull/1)) - ([34387cc](https://github.com/shadowmkj/scribl/commit/34387cc09535807d32a7e7b85afa4e4b012654f0)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(config)_ Add Neovim-style Lua configuration engine and hot-reload - ([38e07f9](https://github.com/shadowmkj/scribl/commit/38e07f90568a637e6922fb5bc694eecefbde31db)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(settings)_ Add comprehensive settings modal and Lua config synchronization - ([2aed248](https://github.com/shadowmkj/scribl/commit/2aed24841cf10d74b84b0956d02bd8f184ca5189)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Improve selection and add transformations - ([54ee3e6](https://github.com/shadowmkj/scribl/commit/54ee3e63aeb7c6ac813249c495fb46ac5eedb53a)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(clipboard)_ Add copy, cut, paste, and duplicate support with atomic undo ([#2](https://github.com/shadowmkj/scribl/pull/2)) - ([53fbb7c](https://github.com/shadowmkj/scribl/commit/53fbb7cf20b354b8c821549db6a78f8e1441047b)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(theme)_ Add theme customization, presets, and default pen color support ([#3](https://github.com/shadowmkj/scribl/pull/3)) - ([9a7a796](https://github.com/shadowmkj/scribl/commit/9a7a7966efb10215d631fedf87a677a467d4b10e)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(tauri)_ Embed git commit hash in app version for unreleased builds - ([490a288](https://github.com/shadowmkj/scribl/commit/490a2887db7589d3daa47a5315e0c7a8f68635d8)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(text)_ Add full text editing, rendering, and font styling support ([#22](https://github.com/shadowmkj/scribl/pull/22)) - ([27740b6](https://github.com/shadowmkj/scribl/commit/27740b6cb46339eee452be193354d766e6dd4db4)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(types)_ Add ShapeElement and shape tool types - ([3c293e0](https://github.com/shadowmkj/scribl/commit/3c293e06d46179160cd77c24a36fbdb592fd2cc1)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(renderer)_ Implement shape path geometry and canvas rendering - ([e89f407](https://github.com/shadowmkj/scribl/commit/e89f407d262862879fb4bd3329d1004852520b12)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(hit-test)_ Add point and marquee hit-testing for geometric shapes - ([4f90130](https://github.com/shadowmkj/scribl/commit/4f901305403429f0dada761c321633c2c9a516b1)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(transform)_ Implement shape scaling, rotation, and translation - ([cfe162e](https://github.com/shadowmkj/scribl/commit/cfe162ea0f9e153cee500ac2099381030f6d1c6f)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(tools)_ Add shape tools, fill color, and stroke style state - ([d6a20ad](https://github.com/shadowmkj/scribl/commit/d6a20ad7631219ed9269172360e4d7097db1fc9f)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(input)_ Implement shape drawing FSM with Shift and Alt modifiers - ([a38a0c9](https://github.com/shadowmkj/scribl/commit/a38a0c924fbce0cba9b9588de14ae29fd97c19a9)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(ui)_ Add shape tools to dock and stroke/fill selectors to style inspector - ([10373ed](https://github.com/shadowmkj/scribl/commit/10373edebb2e2ad6efab79e1935efff20d2541c2)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(shapes)_ Auto-select shape and transition to select tool upon drawing - ([f361449](https://github.com/shadowmkj/scribl/commit/f3614493b50be742f93097d156e5f230ccebffbf)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(toolbar)_ Implement declarative tool groups with shapes flyout - ([2e87542](https://github.com/shadowmkj/scribl/commit/2e875421c7768b05d6dadf272470c97578dbb4a3)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(keybindings)_ Support shape tools and double-press shapes flyout shortcuts - ([e0880c9](https://github.com/shadowmkj/scribl/commit/e0880c94ca87e4cec385b7d20042e2cf08d891e4)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(theme)_ Add explicit theme mode and adaptive monochrome ink resolution ([#23](https://github.com/shadowmkj/scribl/pull/23)) - ([a66a052](https://github.com/shadowmkj/scribl/commit/a66a05255516c7ef42771891a76e23c7401b94d4)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(theme)_ Add custom theme loading from lua files and settings UI support - ([91be8ba](https://github.com/shadowmkj/scribl/commit/91be8ba1c7909c75e5ba4cc2583ffdcb6a732a32)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(persistence)_ Add multi-format drawing file importer and UI integration - ([928f42e](https://github.com/shadowmkj/scribl/commit/928f42ef5320c50dcfb75994390bda7f2f844a06)) (from [`@shadowmkj`](https://github.com/shadowmkj))

### 🐛 Bug Fixes

- _(canvas)_ Make clear canvas button work with non-blocking inline confirmation - ([9733888](https://github.com/shadowmkj/scribl/commit/97338886ad2d45c86c8ec97aae1820d1507c7032)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(input)_ Reset zoom keybind is fixed - ([bafc47d](https://github.com/shadowmkj/scribl/commit/bafc47d836dbd350e190c4b0bc76aae48f824a2f)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(config)_ Support visual mode keybindings synchronization and preferences UI - ([b07c57b](https://github.com/shadowmkj/scribl/commit/b07c57bb2be490acea16564fe121f9e1cac5fff3)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(hit-test)_ Clamp rounded rectangle corner arcs to their quadrants - ([ce24c95](https://github.com/shadowmkj/scribl/commit/ce24c95b8a2296a302b2ff536c5059a8683fbdf6)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(history)_ Narrow element type exhaustively in applyElementDelta - ([b91ddff](https://github.com/shadowmkj/scribl/commit/b91ddff14f022db2702f32f10fbb79797ff55093)) (from [`@shadowmkj`](https://github.com/shadowmkj))

### 👷 CI

- Upgrade node version to 22 in CI workflow - ([0456b8c](https://github.com/shadowmkj/scribl/commit/0456b8c0f3c610fda5221f4be787fe22598ba0dc)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Add GitHub Actions release workflow and update project metadata - ([e253439](https://github.com/shadowmkj/scribl/commit/e25343909ca8d3d3ec505c8f556d02c125380602)) (from [`@shadowmkj`](https://github.com/shadowmkj))

### ⚙️ Misc

- Initialize Tauri v2 and Vite React project scaffold - ([0e056f4](https://github.com/shadowmkj/scribl/commit/0e056f4c2f00d181483e6a44a36dfb1918753a40)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Add contribution guidelines and link in readme - ([9596eff](https://github.com/shadowmkj/scribl/commit/9596eff9ab45445c35be06da6153afe8f9109977)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(input)_ Remove leader key support from keybinding engine - ([fced92a](https://github.com/shadowmkj/scribl/commit/fced92a9c91871233bf6aee0a787962bde359dff)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(keymaps)_ Enhance Lua configuration and keybinding display formatting - ([bc9188b](https://github.com/shadowmkj/scribl/commit/bc9188bdc76c684448b2611a9aaa7c80818ea7a6)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(history)_ Optimize element dragging with atomic undo steps - ([45df839](https://github.com/shadowmkj/scribl/commit/45df839492d1a40df7fdcaefff037b525251859a)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Update repository URL in README - ([63dc026](https://github.com/shadowmkj/scribl/commit/63dc0264b69dc5894960f729377e7ab56315db5e)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Update repository name in git-cliff configuration - ([9ba22d1](https://github.com/shadowmkj/scribl/commit/9ba22d10c4fba1fdcf3d63cc57a65e9bceb366c8)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Update documentation and terminology for stroke dynamics - ([4f49216](https://github.com/shadowmkj/scribl/commit/4f492161d9d963e26dbdc727c7caba92bd8bcc19)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Update roadmap section in README - ([744bc88](https://github.com/shadowmkj/scribl/commit/744bc88a128239d96056bfe53aa6401afd5b9367)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- _(persistence)_ Verify shape elements serialization and export - ([1da8482](https://github.com/shadowmkj/scribl/commit/1da8482c21f08e4a026a702b19a094bdfddb9d1f)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Update toolbar layout documentation to show shapes group flyout - ([a3c654f](https://github.com/shadowmkj/scribl/commit/a3c654f489343533b2e74bc7cbb6424aed564372)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Apply code formatting via dprint - ([5dcb477](https://github.com/shadowmkj/scribl/commit/5dcb4773e9fd3d4bc6e27d160d4e978dbff6b511)) (from [`@shadowmkj`](https://github.com/shadowmkj))
- Update readme with latest features for v0.1.0 release - ([9ee8286](https://github.com/shadowmkj/scribl/commit/9ee82863377f3af11a9b342c380966bd3bcf84fd)) (from [`@shadowmkj`](https://github.com/shadowmkj))

### 👥 New Contributors

- [`@shadowmkj`](https://github.com/shadowmkj) made their first contribution
