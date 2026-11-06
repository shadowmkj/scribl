use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::PathBuf;
use std::sync::mpsc::channel;
use tauri::{AppHandle, Emitter};

pub fn get_config_dir() -> PathBuf {
    if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
        PathBuf::from(xdg).join("scribl")
    } else if let Some(home) = dirs::home_dir() {
        home.join(".config").join("scribl")
    } else if let Some(config) = dirs::config_dir() {
        config.join("scribl")
    } else {
        PathBuf::from(".config").join("scribl")
    }
}

pub fn get_init_lua_path() -> PathBuf {
    get_config_dir().join("init.lua")
}

pub const DEFAULT_INIT_LUA_TEMPLATE: &str = r##"-- ~/.config/scribl/init.lua
-- Scribl Neovim-style Lua Configuration File

local scribl = require("scribl")

--------------------------------------------------------------------------------
-- 1. General Options
--------------------------------------------------------------------------------
scribl.opt.dot_grid = true             -- Show dot-grid canvas background
scribl.opt.default_tool = "pen"        -- Active tool on startup: "pen", "select", "eraser", "zoom"
scribl.opt.default_pen_color = "#0284c7" -- Initial pen drawing color
scribl.opt.zoom_mode = "scrubby"       -- "scrubby" or "selection"
scribl.opt.stroke_smoothing = 0.5      -- Perfect-freehand smoothing
scribl.opt.stroke_thinning = 0.6       -- Velocity thinning & taper effect
scribl.opt.auto_save = true            -- Automatically save drawings to local storage

--------------------------------------------------------------------------------
-- 2. Keybindings
-- Format: scribl.keymap.set(mode, lhs, rhs, opts)
-- Supports key notation: <C-x>, <D-x> (Cmd/Meta), <M-x> (Alt), <S-x>, <Space>
--------------------------------------------------------------------------------

-- Tool Selection
scribl.keymap.set("n", "p", "tool.pen", { desc = "Activate Pen" })
scribl.keymap.set("n", "2", "tool.pen", { desc = "Activate Pen" })
scribl.keymap.set("n", "e", "tool.eraser", { desc = "Activate Eraser" })
scribl.keymap.set("n", "3", "tool.eraser", { desc = "Activate Eraser" })
scribl.keymap.set("n", "v", "tool.select", { desc = "Activate Select" })
scribl.keymap.set("n", "1", "tool.select", { desc = "Activate Select" })
scribl.keymap.set("n", "s", "tool.shapes", { desc = "Shapes Tool (Browse on double-press)" })
scribl.keymap.set("n", "5", "tool.shapes", { desc = "Shapes Tool" })
scribl.keymap.set("n", "r", "tool.shape.rectangle", { desc = "Rectangle Shape" })
scribl.keymap.set("n", "z", "tool.zoom", { desc = "Activate Zoom" })
scribl.keymap.set("n", "4", "tool.zoom", { desc = "Activate Zoom" })

-- Zoom & Viewport Navigation
scribl.keymap.set("n", "<S-0>", "zoom.reset", { desc = "Reset Zoom (100%)" })
scribl.keymap.set("n", "<D-0>", "zoom.reset", { desc = "Reset Zoom (100%)" })
scribl.keymap.set("n", "=", "zoom.in", { desc = "Zoom In" })
scribl.keymap.set("n", "+", "zoom.in", { desc = "Zoom In" })
scribl.keymap.set("n", "-", "zoom.out", { desc = "Zoom Out" })
scribl.keymap.set("n", "<Space>", "canvas.pan", { desc = "Pan Canvas" })

-- Undo / Redo / History
scribl.keymap.set("n", "<D-z>", "history.undo", { desc = "Undo" })
scribl.keymap.set("n", "<D-S-z>", "history.redo", { desc = "Redo" })
scribl.keymap.set("n", "<D-y>", "history.redo", { desc = "Redo" })

-- Selection & Deletion
scribl.keymap.set("n", "<BS>", "selection.delete", { desc = "Delete Selected" })
scribl.keymap.set("n", "<Del>", "selection.delete", { desc = "Delete Selected" })

-- File Actions & Quick Commands
scribl.keymap.set("n", "<D-s>", "file.save", { desc = "Save Drawing" })
scribl.keymap.set("n", "<D-o>", "file.open", { desc = "Open Drawing" })
scribl.keymap.set("n", "c", "canvas.clear", { desc = "Clear Canvas" })
scribl.keymap.set("n", "f", "zoom.fit_all", { desc = "Fit Drawing" })
scribl.keymap.set("n", "<D-,>", "app.settings", { desc = "Open Settings" })

-- Edit & Clipboard
scribl.keymap.set("n", "<D-c>", "edit.copy", { desc = "Copy" })
scribl.keymap.set("n", "<D-v>", "edit.paste", { desc = "Paste" })
scribl.keymap.set("n", "<D-x>", "edit.cut", { desc = "Cut" })
scribl.keymap.set("n", "<D-d>", "edit.duplicate", { desc = "Duplicate" })

-- Visual Mode (When selection is active)
scribl.keymap.set("v", "r", "selection.rotate", { desc = "Rotate Selection" })
scribl.keymap.set("v", "<Esc>", "selection.deselect", { desc = "Deselect" })
scribl.keymap.set("v", "d", "selection.delete", { desc = "Delete Selected" })
scribl.keymap.set("v", "y", "edit.copy", { desc = "Yank (Copy)" })
scribl.keymap.set("v", "p", "edit.paste", { desc = "Put (Paste)" })
scribl.keymap.set("v", "<D-c>", "edit.copy", { desc = "Copy" })
scribl.keymap.set("v", "<D-v>", "edit.paste", { desc = "Paste" })
scribl.keymap.set("v", "<D-x>", "edit.cut", { desc = "Cut" })
scribl.keymap.set("v", "<D-d>", "edit.duplicate", { desc = "Duplicate" })

--------------------------------------------------------------------------------
-- 3. Floating Toolbar Layout
-- Position: "bottom", "top", "left", "right"
-- Groups: Custom tool flyouts/drawers (e.g. shapes)
-- Items: Tools ("select", "pen", "eraser", "zoom"), groups ("shapes"), or actions ("undo", "redo", "clear")
--------------------------------------------------------------------------------
scribl.ui.toolbar = {
  position = "bottom",
  groups = {
    shapes = {
      label = "Shapes",
      default = "rectangle",
      items = {
        "rectangle",
        "circle",
        "diamond",
        "line",
        "arrow",
      },
    },
  },
  items = {
    "select",
    "pen",
    "eraser",
    "shapes",
    "zoom",
    "|",
    "undo",
    "redo",
    "|",
    "clear",
  },
}

--------------------------------------------------------------------------------
-- 4. Theme Configuration
-- Presets: "default-dark", "light", "tokyo-night", "catppuccin"
--------------------------------------------------------------------------------
scribl.theme.name = "default-dark"

-- Optional custom token overrides:
-- scribl.theme.overrides = {
--   canvas_bg = "#090d16",
--   accent = "#0284c7",
-- }
"##;

pub fn ensure_default_config_exists() -> Result<PathBuf, String> {
    let dir = get_config_dir();
    if !dir.exists() {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create config directory {}: {}", dir.display(), e))?;
    }
    let init_path = dir.join("init.lua");
    if init_path.exists() {
        let mut content = std::fs::read_to_string(&init_path).unwrap_or_default();
        let mut modified = false;

        if !content.is_empty() && !content.contains("scribl.keymap.set(\"v\"") {
            let visual_block = "\n-- Visual Mode (When selection is active)\nscribl.keymap.set(\"v\", \"r\", \"selection.rotate\", { desc = \"Rotate Selection\" })\nscribl.keymap.set(\"v\", \"<Esc>\", \"selection.deselect\", { desc = \"Deselect\" })\nscribl.keymap.set(\"v\", \"d\", \"selection.delete\", { desc = \"Delete Selected\" })\n";
            content.push_str(visual_block);
            modified = true;
        }

        if !content.is_empty() && !content.contains("edit.copy") {
            let clipboard_block = "\n-- Edit & Clipboard\nscribl.keymap.set(\"n\", \"<D-c>\", \"edit.copy\", { desc = \"Copy\" })\nscribl.keymap.set(\"n\", \"<D-v>\", \"edit.paste\", { desc = \"Paste\" })\nscribl.keymap.set(\"n\", \"<D-x>\", \"edit.cut\", { desc = \"Cut\" })\nscribl.keymap.set(\"n\", \"<D-d>\", \"edit.duplicate\", { desc = \"Duplicate\" })\nscribl.keymap.set(\"v\", \"y\", \"edit.copy\", { desc = \"Yank (Copy)\" })\nscribl.keymap.set(\"v\", \"p\", \"edit.paste\", { desc = \"Put (Paste)\" })\nscribl.keymap.set(\"v\", \"<D-c>\", \"edit.copy\", { desc = \"Copy\" })\nscribl.keymap.set(\"v\", \"<D-v>\", \"edit.paste\", { desc = \"Paste\" })\nscribl.keymap.set(\"v\", \"<D-x>\", \"edit.cut\", { desc = \"Cut\" })\nscribl.keymap.set(\"v\", \"<D-d>\", \"edit.duplicate\", { desc = \"Duplicate\" })\n";
            content.push_str(clipboard_block);
            modified = true;
        }

        if !content.is_empty() && !content.contains("scribl.theme") {
            let theme_block = "\n--------------------------------------------------------------------------------\n-- 4. Theme Configuration\n-- Presets: \"default-dark\", \"light\", \"tokyo-night\", \"catppuccin\"\n--------------------------------------------------------------------------------\nscribl.theme.name = \"default-dark\"\n";
            content.push_str(theme_block);
            modified = true;
        }

        if modified {
            let _ = std::fs::write(&init_path, content);
        }
    } else {
        std::fs::write(&init_path, DEFAULT_INIT_LUA_TEMPLATE)
            .map_err(|e| format!("Failed to write default init.lua template: {}", e))?;
    }
    Ok(init_path)
}

pub fn spawn_config_watcher(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let config_dir = get_config_dir();
        if !config_dir.exists() {
            let _ = std::fs::create_dir_all(&config_dir);
        }

        let (tx, rx) = channel();
        let mut watcher = match RecommendedWatcher::new(tx, Config::default()) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("[Scribl] Failed to initialize watcher: {}", e);
                return;
            }
        };

        if let Err(e) = watcher.watch(&config_dir, RecursiveMode::Recursive) {
            eprintln!("[Scribl] Failed to watch {}: {}", config_dir.display(), e);
            return;
        }

        let mut last_event_time = std::time::Instant::now();
        for res in rx {
            match res {
                Ok(event) => {
                    let has_lua = event
                        .paths
                        .iter()
                        .any(|p| p.extension().is_some_and(|ext| ext == "lua"));
                    if has_lua && last_event_time.elapsed().as_millis() > 150 {
                        last_event_time = std::time::Instant::now();
                        let init_path = get_init_lua_path();
                        match crate::lua_engine::eval_lua_config_file(&init_path) {
                            Ok(config) => {
                                let _ = app_handle.emit("scribl:config-reloaded", config);
                            }
                            Err(err) => {
                                let _ = app_handle.emit("scribl:config-error", err);
                            }
                        }
                    }
                }
                Err(e) => eprintln!("[Scribl] Watch error: {:?}", e),
            }
        }
    });
}
