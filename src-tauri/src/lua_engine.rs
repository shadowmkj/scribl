use mlua::{Lua, Table};
use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::sync::{Arc, Mutex};

use crate::config::{
    AppOptions, KeymapEntry, ScriblConfig, ThemeColors, ThemeConfig, ToolbarConfig,
    calculate_luminance_mode, darken_hex,
};

pub fn parse_theme_table(tbl: &Table) -> Option<ThemeColors> {
    let canvas_bg = tbl.get::<String>("canvas_bg").ok()?;
    let mode = tbl
        .get::<String>("mode")
        .ok()
        .unwrap_or_else(|| calculate_luminance_mode(&canvas_bg).to_string());

    let is_dark = mode == "dark";
    let default_grid = if is_dark { "#334155" } else { "#cbd5e1" };
    let default_panel_bg = if is_dark {
        "rgba(15, 23, 42, 0.78)"
    } else {
        "rgba(255, 255, 255, 0.88)"
    };
    let default_panel_border = if is_dark {
        "rgba(255, 255, 255, 0.08)"
    } else {
        "rgba(0, 0, 0, 0.08)"
    };
    let default_panel_shadow = if is_dark {
        "0 12px 36px rgba(0, 0, 0, 0.45)"
    } else {
        "0 12px 36px rgba(0, 0, 0, 0.08)"
    };
    let default_text_primary = if is_dark { "#f8fafc" } else { "#0f172a" };
    let default_text_secondary = if is_dark { "#94a3b8" } else { "#64748b" };
    let default_text_disabled = if is_dark { "#64748b" } else { "#94a3b8" };
    let default_danger = if is_dark { "#ef4444" } else { "#dc2626" };

    let accent = tbl
        .get::<String>("accent")
        .unwrap_or_else(|_| "#0284c7".to_string());
    let accent_hover = tbl
        .get::<String>("accent_hover")
        .unwrap_or_else(|_| darken_hex(&accent, 0.82));
    let accent_light = tbl
        .get::<String>("accent_light")
        .unwrap_or_else(|_| accent.clone());
    let selection_stroke = tbl
        .get::<String>("selection_stroke")
        .unwrap_or_else(|_| accent.clone());
    let selection_fill = tbl
        .get::<String>("selection_fill")
        .unwrap_or_else(|_| "rgba(2, 132, 199, 0.12)".to_string());

    Some(ThemeColors {
        mode,
        canvas_bg,
        grid_dot: tbl
            .get::<String>("grid_dot")
            .unwrap_or_else(|_| default_grid.into()),
        panel_bg: tbl
            .get::<String>("panel_bg")
            .unwrap_or_else(|_| default_panel_bg.into()),
        panel_border: tbl
            .get::<String>("panel_border")
            .unwrap_or_else(|_| default_panel_border.into()),
        panel_shadow: tbl
            .get::<String>("panel_shadow")
            .unwrap_or_else(|_| default_panel_shadow.into()),
        text_primary: tbl
            .get::<String>("text_primary")
            .unwrap_or_else(|_| default_text_primary.into()),
        text_secondary: tbl
            .get::<String>("text_secondary")
            .unwrap_or_else(|_| default_text_secondary.into()),
        text_disabled: tbl
            .get::<String>("text_disabled")
            .unwrap_or_else(|_| default_text_disabled.into()),
        accent,
        accent_hover,
        accent_light,
        selection_stroke,
        selection_fill,
        danger: tbl
            .get::<String>("danger")
            .unwrap_or_else(|_| default_danger.into()),
    })
}

pub fn scan_themes_dir(dir: &Path) -> HashMap<String, ThemeColors> {
    let mut map = HashMap::new();
    if !dir.exists() || !dir.is_dir() {
        return map;
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return map,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() && path.extension().is_some_and(|ext| ext == "lua") {
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unnamed")
                .to_string();

            if let Ok(script) = std::fs::read_to_string(&path) {
                let lua = Lua::new();
                match lua.load(&script).eval::<Table>() {
                    Ok(tbl) => {
                        let name = tbl.get::<String>("name").unwrap_or(stem);
                        if let Some(colors) = parse_theme_table(&tbl) {
                            map.insert(name, colors);
                        }
                    }
                    Err(e) => {
                        eprintln!(
                            "[Scribl] Failed to parse theme file {}: {}",
                            path.display(),
                            e
                        );
                    }
                }
            }
        }
    }
    map
}

pub fn eval_lua_config_string(
    script: &str,
    config_dir: Option<&Path>,
) -> Result<ScriblConfig, String> {
    let lua = Lua::new();

    // Extend package.path if config_dir is provided
    if let Some(dir) = config_dir {
        let dir_str = dir.to_string_lossy();
        let lua_code = format!(
            "package.path = package.path .. ';{0}/?.lua;{0}/?/init.lua;{0}/lua/?.lua;{0}/lua/?/init.lua'",
            dir_str
        );
        let _ = lua.load(&lua_code).exec();
    }

    let default = ScriblConfig::default();

    let initial_custom_themes = if let Some(dir) = config_dir {
        scan_themes_dir(&dir.join("themes"))
    } else {
        HashMap::new()
    };
    let custom_themes_shared = Arc::new(Mutex::new(initial_custom_themes));

    // Create the scribl module table
    let scribl_table = lua.create_table().map_err(|e| e.to_string())?;

    // scribl.g (custom user globals)
    let g_table = lua.create_table().map_err(|e| e.to_string())?;
    scribl_table.set("g", g_table).map_err(|e| e.to_string())?;

    // scribl.opt
    let opt_table = lua.create_table().map_err(|e| e.to_string())?;
    opt_table
        .set("dot_grid", default.options.dot_grid)
        .map_err(|e| e.to_string())?;
    opt_table
        .set("default_tool", default.options.default_tool.clone())
        .map_err(|e| e.to_string())?;
    opt_table
        .set("zoom_mode", default.options.zoom_mode.clone())
        .map_err(|e| e.to_string())?;
    opt_table
        .set("stroke_smoothing", default.options.stroke_smoothing)
        .map_err(|e| e.to_string())?;
    opt_table
        .set("stroke_thinning", default.options.stroke_thinning)
        .map_err(|e| e.to_string())?;
    opt_table
        .set("auto_save", default.options.auto_save)
        .map_err(|e| e.to_string())?;
    opt_table
        .set(
            "default_pen_color",
            default.options.default_pen_color.clone(),
        )
        .map_err(|e| e.to_string())?;
    scribl_table
        .set("opt", opt_table)
        .map_err(|e| e.to_string())?;

    // User-registered keymaps and explicitly deleted keymaps
    let user_keymaps: Arc<Mutex<Vec<KeymapEntry>>> = Arc::new(Mutex::new(Vec::new()));
    let deleted_keymaps: Arc<Mutex<HashSet<(String, String)>>> =
        Arc::new(Mutex::new(HashSet::new()));

    // scribl.keymap.set(mode, lhs, rhs, opts)
    let keymap_table = lua.create_table().map_err(|e| e.to_string())?;
    let km_ref = Arc::clone(&user_keymaps);
    let del_ref = Arc::clone(&deleted_keymaps);
    let set_fn = lua
        .create_function(
            move |_lua, (mode, lhs, rhs, opts): (String, String, String, Option<Table>)| {
                let desc = opts.and_then(|o| o.get::<String>("desc").ok());
                let mut km = km_ref.lock().unwrap();
                let mut del = del_ref.lock().unwrap();

                del.remove(&(mode.clone(), lhs.clone()));

                if let Some(pos) = km.iter().position(|k| k.mode == mode && k.lhs == lhs) {
                    km[pos] = KeymapEntry {
                        mode,
                        lhs,
                        rhs,
                        desc,
                    };
                } else {
                    km.push(KeymapEntry {
                        mode,
                        lhs,
                        rhs,
                        desc,
                    });
                }
                Ok(())
            },
        )
        .map_err(|e| e.to_string())?;
    keymap_table.set("set", set_fn).map_err(|e| e.to_string())?;

    // scribl.keymap.del(mode, lhs)
    let km_ref2 = Arc::clone(&user_keymaps);
    let del_ref2 = Arc::clone(&deleted_keymaps);
    let del_fn = lua
        .create_function(move |_lua, (mode, lhs): (String, String)| {
            let mut km = km_ref2.lock().unwrap();
            let mut del = del_ref2.lock().unwrap();

            km.retain(|k| !(k.mode == mode && k.lhs == lhs));
            del.insert((mode, lhs));
            Ok(())
        })
        .map_err(|e| e.to_string())?;
    keymap_table.set("del", del_fn).map_err(|e| e.to_string())?;

    scribl_table
        .set("keymap", keymap_table)
        .map_err(|e| e.to_string())?;

    // scribl.ui.toolbar
    let ui_table = lua.create_table().map_err(|e| e.to_string())?;
    let toolbar_table = lua.create_table().map_err(|e| e.to_string())?;
    toolbar_table
        .set("position", default.toolbar.position.clone())
        .map_err(|e| e.to_string())?;
    let items_table = lua.create_table().map_err(|e| e.to_string())?;
    for (i, item) in default.toolbar.items.iter().enumerate() {
        items_table
            .set(i + 1, item.clone())
            .map_err(|e| e.to_string())?;
    }
    toolbar_table
        .set("items", items_table)
        .map_err(|e| e.to_string())?;

    let groups_table = lua.create_table().map_err(|e| e.to_string())?;
    for (g_id, g_cfg) in &default.toolbar.groups {
        let group_tbl = lua.create_table().map_err(|e| e.to_string())?;
        group_tbl
            .set("label", g_cfg.label.clone())
            .map_err(|e| e.to_string())?;
        group_tbl
            .set("default", g_cfg.default.clone())
            .map_err(|e| e.to_string())?;
        let group_items = lua.create_table().map_err(|e| e.to_string())?;
        for (i, item) in g_cfg.items.iter().enumerate() {
            group_items
                .set(i + 1, item.clone())
                .map_err(|e| e.to_string())?;
        }
        group_tbl
            .set("items", group_items)
            .map_err(|e| e.to_string())?;
        groups_table
            .set(g_id.clone(), group_tbl)
            .map_err(|e| e.to_string())?;
    }
    toolbar_table
        .set("groups", groups_table)
        .map_err(|e| e.to_string())?;

    ui_table
        .set("toolbar", toolbar_table)
        .map_err(|e| e.to_string())?;
    scribl_table
        .set("ui", ui_table)
        .map_err(|e| e.to_string())?;

    // scribl.theme
    let theme_table = lua.create_table().map_err(|e| e.to_string())?;
    theme_table
        .set("name", default.theme.name.clone())
        .map_err(|e| e.to_string())?;
    let overrides_table = lua.create_table().map_err(|e| e.to_string())?;
    theme_table
        .set("overrides", overrides_table)
        .map_err(|e| e.to_string())?;

    // scribl.theme.define(name, table)
    let ct_ref = Arc::clone(&custom_themes_shared);
    let define_fn = lua
        .create_function(move |_lua, (name, tbl): (String, Table)| {
            if let Some(colors) = parse_theme_table(&tbl) {
                let mut map = ct_ref.lock().unwrap();
                map.insert(name, colors);
            }
            Ok(())
        })
        .map_err(|e| e.to_string())?;
    theme_table
        .set("define", define_fn)
        .map_err(|e| e.to_string())?;

    scribl_table
        .set("theme", theme_table)
        .map_err(|e| e.to_string())?;

    // Register globally as `scribl` and as preloaded module `require('scribl')`
    lua.globals()
        .set("scribl", scribl_table.clone())
        .map_err(|e| e.to_string())?;
    let scribl_clone = scribl_table.clone();
    let package: Table = lua.globals().get("package").map_err(|e| e.to_string())?;
    let loaded: Table = package.get("loaded").map_err(|e| e.to_string())?;
    loaded
        .set("scribl", scribl_clone)
        .map_err(|e| e.to_string())?;

    // Execute user's Lua script
    lua.load(script).exec().map_err(|e| e.to_string())?;

    // Extract updated config
    let opt: Table = scribl_table.get("opt").map_err(|e| e.to_string())?;
    let options = AppOptions {
        dot_grid: opt.get("dot_grid").unwrap_or(default.options.dot_grid),
        default_tool: opt
            .get("default_tool")
            .unwrap_or(default.options.default_tool),
        zoom_mode: opt.get("zoom_mode").unwrap_or(default.options.zoom_mode),
        stroke_smoothing: opt
            .get("stroke_smoothing")
            .unwrap_or(default.options.stroke_smoothing),
        stroke_thinning: opt
            .get("stroke_thinning")
            .unwrap_or(default.options.stroke_thinning),
        auto_save: opt.get("auto_save").unwrap_or(default.options.auto_save),
        default_pen_color: opt
            .get("default_pen_color")
            .unwrap_or(default.options.default_pen_color),
    };

    // Extract keymaps and merge with defaults
    let mut keymaps = Arc::try_unwrap(user_keymaps)
        .map(|m| m.into_inner().unwrap())
        .unwrap_or_else(|arc| arc.lock().unwrap().clone());
    let deleted_keys = Arc::try_unwrap(deleted_keymaps)
        .map(|m| m.into_inner().unwrap())
        .unwrap_or_else(|arc| arc.lock().unwrap().clone());

    let configured_actions: HashSet<(String, String)> = keymaps
        .iter()
        .map(|k| (k.mode.clone(), k.rhs.clone()))
        .collect();
    let configured_keys: HashSet<(String, String)> = keymaps
        .iter()
        .map(|k| (k.mode.clone(), k.lhs.clone()))
        .collect();

    for default_km in default.keymaps {
        let key_pair = (default_km.mode.clone(), default_km.lhs.clone());
        if deleted_keys.contains(&key_pair) {
            continue;
        }
        if configured_keys.contains(&key_pair) {
            continue;
        }
        let action_pair = (default_km.mode.clone(), default_km.rhs.clone());
        if configured_actions.contains(&action_pair) {
            continue;
        }
        keymaps.push(default_km);
    }

    // Extract toolbar
    let ui: Table = scribl_table.get("ui").map_err(|e| e.to_string())?;
    let toolbar_tbl: Table = ui.get("toolbar").map_err(|e| e.to_string())?;
    let position: String = toolbar_tbl
        .get("position")
        .unwrap_or_else(|_| "bottom".to_string());

    let mut items = Vec::new();
    if let Ok(items_tbl) = toolbar_tbl.get::<Table>("items") {
        for s in items_tbl.sequence_values::<String>().flatten() {
            items.push(s);
        }
    }
    if items.is_empty() {
        items = default.toolbar.items;
    }

    let mut groups = default.toolbar.groups;
    if let Ok(groups_tbl) = toolbar_tbl.get::<Table>("groups") {
        for (g_name, g_val) in groups_tbl.pairs::<String, Table>().flatten() {
            let label = g_val
                .get::<String>("label")
                .unwrap_or_else(|_| g_name.clone());
            let default_tool = g_val.get::<String>("default").unwrap_or_default();
            let mut group_items = Vec::new();
            if let Ok(gitms) = g_val.get::<Table>("items") {
                for item in gitms.sequence_values::<String>().flatten() {
                    group_items.push(item);
                }
            }
            groups.insert(
                g_name,
                crate::config::ToolGroupConfig {
                    label,
                    default: default_tool,
                    items: group_items,
                },
            );
        }
    }

    // Extract theme
    let mut theme_config = ThemeConfig::default();
    if let Ok(theme_name) = scribl_table.get::<String>("theme") {
        theme_config.name = theme_name;
    } else if let Ok(theme_tbl) = scribl_table.get::<Table>("theme") {
        if let Ok(name) = theme_tbl.get::<String>("name") {
            theme_config.name = name;
        }
        if let Ok(ov_tbl) = theme_tbl.get::<Table>("overrides") {
            for pair in ov_tbl.pairs::<String, String>().flatten() {
                theme_config.overrides.insert(pair.0, pair.1);
            }
        }
        // Also support direct token keys on theme_tbl (e.g. scribl.theme.canvas_bg = "#...")
        for (k, v) in theme_tbl.pairs::<String, mlua::Value>().flatten() {
            if k == "name" || k == "overrides" {
                continue;
            }
            let str_val = match v {
                mlua::Value::String(s) => s.to_str().ok().map(|s| s.to_string()),
                _ => None,
            };
            if let Some(val) = str_val {
                theme_config.overrides.insert(k, val);
            }
        }
    }
    let custom_themes = Arc::try_unwrap(custom_themes_shared)
        .map(|m| m.into_inner().unwrap())
        .unwrap_or_else(|arc| arc.lock().unwrap().clone());
    theme_config.active = Some(crate::config::resolve_theme(&theme_config, &custom_themes));

    Ok(ScriblConfig {
        options,
        keymaps,
        toolbar: ToolbarConfig {
            position,
            items,
            groups,
        },
        theme: theme_config,
        custom_themes,
    })
}

pub fn eval_lua_config_file(path: &Path) -> Result<ScriblConfig, String> {
    if !path.exists() {
        return Ok(ScriblConfig::default());
    }
    let script = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
    let parent = path.parent();
    eval_lua_config_string(&script, parent)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eval_empty_script_returns_defaults() {
        let config = eval_lua_config_string("", None).expect("should evaluate");
        assert!(config.options.dot_grid);
        assert_eq!(config.options.default_tool, "pen");
        assert_eq!(config.toolbar.position, "bottom");
        assert!(
            config
                .keymaps
                .iter()
                .any(|k| k.lhs == "p" && k.rhs == "tool.pen")
        );
    }

    #[test]
    fn test_eval_custom_options_and_keymaps() {
        let script = r#"
            local scribl = require("scribl")
            scribl.opt.dot_grid = false
            scribl.opt.default_tool = "eraser"

            scribl.keymap.set("n", "x", "tool.zoom", { desc = "Custom Zoom" })
            scribl.keymap.set("n", "p", "custom.override", { desc = "Overridden Pen" })

            scribl.ui.toolbar = {
                position = "top",
                items = { "zoom", "pen" }
            }
        "#;

        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert!(!config.options.dot_grid);
        assert_eq!(config.options.default_tool, "eraser");
        assert_eq!(config.toolbar.position, "top");
        assert_eq!(config.toolbar.items, vec!["zoom", "pen"]);

        // Check custom keymap added
        let custom_x = config
            .keymaps
            .iter()
            .find(|k| k.lhs == "x")
            .expect("x should exist");
        assert_eq!(custom_x.rhs, "tool.zoom");

        // Check override
        let override_p = config
            .keymaps
            .iter()
            .find(|k| k.lhs == "p")
            .expect("p should exist");
        assert_eq!(override_p.rhs, "custom.override");
    }

    #[test]
    fn test_change_pen_keybind_from_p_to_d() {
        let script = r#"
            local scribl = require("scribl")
            scribl.keymap.set("n", "d", "tool.pen", { desc = "Activate Pen" })
            scribl.keymap.set("n", "2", "tool.pen", { desc = "Activate Pen" })
        "#;
        let config = eval_lua_config_string(script, None).expect("should evaluate");

        // The first keymap matching tool.pen must be "d"
        let pen_km = config
            .keymaps
            .iter()
            .find(|k| k.rhs == "tool.pen")
            .expect("tool.pen should exist");
        assert_eq!(pen_km.lhs, "d");

        // All mappings for tool.pen should only be "d" and "2"
        let pen_mappings: Vec<&str> = config
            .keymaps
            .iter()
            .filter(|k| k.rhs == "tool.pen")
            .map(|k| k.lhs.as_str())
            .collect();
        assert_eq!(pen_mappings, vec!["d", "2"]);

        // Default "p" should not be retained for tool.pen when user configured "d"
        assert!(
            !config
                .keymaps
                .iter()
                .any(|k| k.lhs == "p" && k.rhs == "tool.pen"),
            "Default 'p' should not remain mapped to tool.pen"
        );
    }

    #[test]
    fn test_keymap_del() {
        let script = r#"
            local scribl = require("scribl")
            scribl.keymap.del("n", "p")
        "#;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert!(
            !config.keymaps.iter().any(|k| k.mode == "n" && k.lhs == "p"),
            "Deleted 'n' mode 'p' keymap should not be present"
        );
        // Default "2" for tool.pen should still exist
        assert!(
            config
                .keymaps
                .iter()
                .any(|k| k.lhs == "2" && k.rhs == "tool.pen")
        );
    }

    #[test]
    fn test_eval_user_init_lua_if_exists() {
        let user_path = crate::watcher::get_init_lua_path();
        if user_path.exists() {
            let config = eval_lua_config_file(&user_path).expect("user config should evaluate");
            let pen_km = config
                .keymaps
                .iter()
                .find(|k| k.rhs == "tool.pen")
                .expect("tool.pen should exist");
            assert!(!pen_km.lhs.is_empty());
        }
    }

    #[test]
    fn test_eval_syntax_error_returns_err() {
        let bad_script = "local scribl = require('scribl' -- syntax error";
        let res = eval_lua_config_string(bad_script, None);
        assert!(res.is_err());
    }

    #[test]
    fn test_eval_merges_visual_mode_keymaps_when_normal_mode_action_configured() {
        let script = r#"
local scribl = require("scribl")
scribl.keymap.set("n", "<BS>", "selection.delete")
"#;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        let rotate = config
            .keymaps
            .iter()
            .find(|k| k.mode == "v" && k.rhs == "selection.rotate");
        assert!(rotate.is_some(), "Visual mode rotate should be merged");
        assert_eq!(rotate.unwrap().lhs, "r");

        let deselect = config
            .keymaps
            .iter()
            .find(|k| k.mode == "v" && k.rhs == "selection.deselect");
        assert!(deselect.is_some(), "Visual mode deselect should be merged");
        assert_eq!(deselect.unwrap().lhs, "<Esc>");

        let delete_v = config
            .keymaps
            .iter()
            .find(|k| k.mode == "v" && k.rhs == "selection.delete");
        assert!(
            delete_v.is_some(),
            "Visual mode delete ('d') should not be blocked by normal mode delete ('<BS>')"
        );
        assert_eq!(delete_v.unwrap().lhs, "d");
    }

    #[test]
    fn test_eval_theme_preset_selection() {
        let script = r#"
            local scribl = require("scribl")
            scribl.theme.name = "tokyo-night"
        "#;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert_eq!(config.theme.name, "tokyo-night");
        assert_eq!(config.theme.active.as_ref().unwrap().canvas_bg, "#1a1b26");
        assert_eq!(config.theme.active.as_ref().unwrap().mode, "dark");
    }

    #[test]
    fn test_eval_theme_mode() {
        let script = r#"
            local scribl = require("scribl")
            scribl.theme.name = "default-dark"
            scribl.theme.mode = "light"
        "#;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert_eq!(config.theme.active.as_ref().unwrap().mode, "light");
    }

    #[test]
    fn test_eval_theme_overrides() {
        let script = r##"
            local scribl = require("scribl")
            scribl.theme.name = "default-dark"
            scribl.theme.overrides = {
                canvas_bg = "#112233",
                accent = "#ff007f",
            }
        "##;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert_eq!(config.theme.active.as_ref().unwrap().canvas_bg, "#112233");
        assert_eq!(config.theme.active.as_ref().unwrap().accent, "#ff007f");
        assert_eq!(config.theme.active.as_ref().unwrap().grid_dot, "#334155");
    }

    #[test]
    fn test_eval_theme_table_syntax() {
        let script = r##"
            local scribl = require("scribl")
            scribl.theme = {
                name = "catppuccin",
                overrides = {
                    accent = "#ffffff",
                }
            }
        "##;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert_eq!(config.theme.name, "catppuccin");
        assert_eq!(config.theme.active.as_ref().unwrap().accent, "#ffffff");
    }

    #[test]
    fn test_eval_toolbar_groups_and_items() {
        let script = r#"
            local scribl = require("scribl")
            scribl.ui.toolbar = {
                position = "top",
                groups = {
                    shapes = {
                        label = "Shapes",
                        default = "circle",
                        items = { "circle", "rectangle" },
                    },
                },
                items = { "select", "shapes", "zoom" },
            }
        "#;
        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert_eq!(config.toolbar.position, "top");
        assert_eq!(config.toolbar.items, vec!["select", "shapes", "zoom"]);
        let shapes_group = config
            .toolbar
            .groups
            .get("shapes")
            .expect("shapes group exists");
        assert_eq!(shapes_group.label, "Shapes");
        assert_eq!(shapes_group.default, "circle");
        assert_eq!(shapes_group.items, vec!["circle", "rectangle"]);
    }

    #[test]
    fn test_scan_themes_dir_discovers_valid_theme() {
        let temp_dir = std::env::temp_dir().join("scribl_test_scan_valid");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).unwrap();

        let theme_file = temp_dir.join("dracula.lua");
        let content = r##"
            return {
                name = "dracula",
                mode = "dark",
                canvas_bg = "#282a36",
                grid_dot = "#44475a",
                panel_bg = "rgba(40, 42, 54, 0.85)",
                panel_border = "rgba(248, 248, 242, 0.1)",
                panel_shadow = "0 12px 36px rgba(0, 0, 0, 0.5)",
                text_primary = "#f8f8f2",
                text_secondary = "#6272a4",
                text_disabled = "#44475a",
                accent = "#bd93f9",
                selection_stroke = "#bd93f9",
                selection_fill = "rgba(189, 147, 249, 0.15)",
                danger = "#ff5555"
            }
        "##;
        std::fs::write(&theme_file, content).unwrap();

        let themes = scan_themes_dir(&temp_dir);
        assert!(themes.contains_key("dracula"));
        let dracula = themes.get("dracula").unwrap();
        assert_eq!(dracula.canvas_bg, "#282a36");
        assert_eq!(dracula.accent, "#bd93f9");
        assert_eq!(dracula.mode, "dark");
        assert!(!dracula.accent_hover.is_empty());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_scan_themes_dir_handles_syntax_error_gracefully() {
        let temp_dir = std::env::temp_dir().join("scribl_test_scan_broken");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).unwrap();

        let bad_file = temp_dir.join("broken.lua");
        std::fs::write(&bad_file, "this is not valid lua code !@#$").unwrap();

        let themes = scan_themes_dir(&temp_dir);
        assert!(!themes.contains_key("broken"));

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_eval_theme_define_inline() {
        let script = r##"
            local scribl = require("scribl")
            scribl.theme.define("monokai", {
                mode = "dark",
                canvas_bg = "#272822",
                grid_dot = "#3e3d32",
                panel_bg = "rgba(39, 40, 34, 0.85)",
                panel_border = "rgba(248, 248, 242, 0.1)",
                panel_shadow = "0 12px 36px rgba(0, 0, 0, 0.45)",
                text_primary = "#f8f8f2",
                text_secondary = "#75715e",
                text_disabled = "#49483e",
                accent = "#a6e22e",
                danger = "#f92672"
            })
            scribl.theme.name = "monokai"
        "##;

        let config = eval_lua_config_string(script, None).expect("should evaluate");
        assert_eq!(config.theme.name, "monokai");
        assert!(config.custom_themes.contains_key("monokai"));
        let active = config.theme.active.expect("active theme resolved");
        assert_eq!(active.canvas_bg, "#272822");
        assert_eq!(active.accent, "#a6e22e");
        assert_eq!(active.mode, "dark");
    }

    #[test]
    fn test_eval_lua_config_with_themes_dir() {
        let temp_dir = std::env::temp_dir().join("scribl_test_themes_dir_eval");
        let _ = std::fs::remove_dir_all(&temp_dir);
        let themes_dir = temp_dir.join("themes");
        std::fs::create_dir_all(&themes_dir).unwrap();

        let nord_file = themes_dir.join("nord.lua");
        let content = r##"
            return {
                name = "nord",
                mode = "dark",
                canvas_bg = "#2e3440",
                grid_dot = "#434c5e",
                panel_bg = "rgba(46, 52, 64, 0.85)",
                panel_border = "rgba(236, 239, 244, 0.08)",
                panel_shadow = "0 12px 36px rgba(0, 0, 0, 0.45)",
                text_primary = "#eceff4",
                text_secondary = "#d8dee9",
                text_disabled = "#4c566a",
                accent = "#88c0d0",
                accent_hover = "#81a1c1",
                accent_light = "#8fbcbb",
                selection_stroke = "#88c0d0",
                selection_fill = "rgba(136, 192, 208, 0.12)",
                danger = "#bf616a",
            }
        "##;
        std::fs::write(&nord_file, content).unwrap();

        let script = r#"
            local scribl = require("scribl")
            scribl.theme.name = "nord"
        "#;

        let config = eval_lua_config_string(script, Some(&temp_dir)).expect("should evaluate");
        assert_eq!(config.theme.name, "nord");
        assert!(config.custom_themes.contains_key("nord"));
        let active = config.theme.active.expect("active theme resolved");
        assert_eq!(active.canvas_bg, "#2e3440");
        assert_eq!(active.accent, "#88c0d0");

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
