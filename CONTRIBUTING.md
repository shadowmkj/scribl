# Contributing to Scribl

Thank you for your interest in contributing to Scribl! Whether you are fixing bugs, improving documentation, or proposing new features, your contributions are welcome.

Please take a moment to review this guide before submitting changes.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed:

- **Node.js**: `v18.0.0` or higher
- **pnpm**: `v9.0.0` or higher (`corepack enable pnpm` or `npm install -g pnpm`)
- **Rust**: Stable toolchain (`rustup update stable`)
- **Tauri Prerequisites**: See the [Tauri v2 Prerequisites Guide](https://v2.tauri.app/start/prerequisites/) for your operating system:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - **Windows**: Microsoft C++ Build Tools and WebView2

---

## 🚀 Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/scribl.git
   cd scribl
   ```

2. **Install frontend dependencies:**
   ```bash
   pnpm install
   ```

3. **Run the development environment:**
   - **Full Desktop App (Tauri + Vite):**
     ```bash
     pnpm tauri dev
     ```
   - **Web-Only Preview (Fast Canvas & UI iteration):**
     ```bash
     pnpm dev
     ```

---

## 📐 Project Structure

```
scribl/
├── src/
│   ├── core/
│   │   ├── camera/        # Camera math, zoom bounds, viewport transforms
│   │   ├── engine/        # InkingEngine, CanvasRenderer, ScratchRenderer, HitTester
│   │   ├── history/       # Command pattern undo/redo stack
│   │   ├── input/         # PointerRouter, ToolFSM, tablet event handling
│   │   └── persistence/   # Document serialization, autosave, file I/O
│   ├── stores/            # Zustand stores (useCameraStore, useDocumentStore)
│   ├── components/
│   │   ├── canvas/        # CanvasViewport, SelectionOverlay
│   │   └── ui/            # TopHeader, FloatingDock, StyleInspector, ZoomHUD
│   └── types/             # Core TypeScript type definitions
├── src-tauri/             # Tauri v2 native Rust application
├── .github/workflows/     # GitHub Actions CI workflows
└── dprint.json            # Code formatter configuration (dprint)
```

---

## 🎨 Code Style & Quality Standards

Scribl maintains strict formatting and quality standards enforced in CI.

### Frontend (TypeScript / React / Markdown)

- **Code Formatter:** We use [dprint](https://dprint.dev/) (not Prettier).
  - Format files: `pnpm format`
  - Check formatting: `pnpm format:check`
- **Type Checking:** All code must be strictly typed without unused variables (`noImplicitAny`, `noUnusedLocals`).
  - Run type checker: `pnpm tsc --noEmit`
- **Linting & Best Practices:** Follow React 19 and modern TypeScript patterns. Keep rendering performance at 60–240Hz by avoiding unnecessary re-renders in canvas animation loops.

### Backend (Rust / Tauri)

- **Code Formatter:** Standard Rust formatter (`rustfmt`):
  ```bash
  cargo fmt --all --check --manifest-path src-tauri/Cargo.toml
  ```
- **Linter:** Clippy with warnings treated as errors:
  ```bash
  cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
  ```

---

## 🧪 Testing

All new features and bug fixes should include corresponding tests.

- **Frontend Tests (Vitest):**
  ```bash
  pnpm test
  ```
- **Rust Tests:**
  ```bash
  cargo test --manifest-path src-tauri/Cargo.toml
  ```

---

## 🔄 Pull Request Workflow

1. **Create a topic branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. **Commit with Conventional Commits:**
   Use clear, conventional commit messages:
   - `feat: add rectangle and ellipse shape tools`
   - `fix: resolve pointer coalescing jitter on 240Hz displays`
   - `docs: update architecture overview in README`
   - `chore: bump dependencies`

3. **Verify locally before pushing:**
   Make sure all CI checks pass locally:
   ```bash
   pnpm format:check
   pnpm tsc --noEmit
   pnpm test
   cargo fmt --all --check --manifest-path src-tauri/Cargo.toml
   cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
   cargo test --manifest-path src-tauri/Cargo.toml
   ```

4. **Open a Pull Request:**
   - Provide a clear description of the problem solved and the implementation approach.
   - Reference any related issues (e.g., `Fixes #12`).
   - If UI changes were made, attach a screenshot or short screen recording.

---

## 💡 Reporting Issues

- **Bug Reports:** Include your OS version, hardware setup (e.g., Apple Silicon, drawing tablet model), reproduction steps, and expected vs. actual behavior.
- **Feature Requests:** Explain the use case and why this enhancement benefits the wider Scribl community.
