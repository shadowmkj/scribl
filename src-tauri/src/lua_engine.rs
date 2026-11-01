use mlua::{Lua, Table};
use std::collections::HashSet;
use std::path::Path;
use std::sync::{Arc, Mutex};

use crate::config::{AppOptions, KeymapEntry, ScriblConfig, ToolbarConfig};

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
    ui_table
        .set("toolbar", toolbar_table)
        .map_err(|e| e.to_string())?;
    scribl_table
        .set("ui", ui_table)
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
    };

    // Extract keymaps and merge with defaults
    let mut keymaps = Arc::try_unwrap(user_keymaps)
        .map(|m| m.into_inner().unwrap())
        .unwrap_or_else(|arc| arc.lock().unwrap().clone());
    let deleted_keys = Arc::try_unwrap(deleted_keymaps)
        .map(|m| m.into_inner().unwrap())
        .unwrap_or_else(|arc| arc.lock().unwrap().clone());

    let configured_actions: HashSet<String> = keymaps.iter().map(|k| k.rhs.clone()).collect();
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
        if configured_actions.contains(&default_km.rhs) {
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

    Ok(ScriblConfig {
        options,
        keymaps,
        toolbar: ToolbarConfig { position, items },
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
        assert_eq!(config.options.dot_grid, true);
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
        assert_eq!(config.options.dot_grid, false);
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
            !config.keymaps.iter().any(|k| k.lhs == "p"),
            "Deleted 'p' keymap should not be present"
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
            assert_eq!(pen_km.lhs, "d");
            assert!(
                !config
                    .keymaps
                    .iter()
                    .any(|k| k.lhs == "p" && k.rhs == "tool.pen"),
                "User replaced 'p' with 'd', so 'p' must not remain"
            );
        }
    }

    #[test]
    fn test_eval_syntax_error_returns_err() {
        let bad_script = "local scribl = require('scribl' -- syntax error";
        let res = eval_lua_config_string(bad_script, None);
        assert!(res.is_err());
    }
}
