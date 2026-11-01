use mlua::{Lua, Table};
use std::path::Path;

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

    // scribl.g
    let g_table = lua.create_table().map_err(|e| e.to_string())?;
    g_table
        .set("mapleader", default.mapleader.clone())
        .map_err(|e| e.to_string())?;
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

    // Pre-populate keymaps registry in lua
    let keymaps_list = lua.create_table().map_err(|e| e.to_string())?;
    for (i, km) in default.keymaps.iter().enumerate() {
        let entry = lua.create_table().map_err(|e| e.to_string())?;
        entry
            .set("mode", km.mode.clone())
            .map_err(|e| e.to_string())?;
        entry
            .set("lhs", km.lhs.clone())
            .map_err(|e| e.to_string())?;
        entry
            .set("rhs", km.rhs.clone())
            .map_err(|e| e.to_string())?;
        if let Some(desc) = &km.desc {
            entry.set("desc", desc.clone()).map_err(|e| e.to_string())?;
        }
        keymaps_list.set(i + 1, entry).map_err(|e| e.to_string())?;
    }

    // scribl.keymap.set(mode, lhs, rhs, opts)
    let keymap_table = lua.create_table().map_err(|e| e.to_string())?;
    let keymaps_ref = keymaps_list.clone();
    let set_fn = lua
        .create_function(
            move |lua, (mode, lhs, rhs, opts): (String, String, String, Option<Table>)| {
                let entry = lua.create_table()?;
                entry.set("mode", mode)?;
                entry.set("lhs", lhs)?;
                entry.set("rhs", rhs)?;
                if let Some(desc) = opts.and_then(|o| o.get::<String>("desc").ok()) {
                    entry.set("desc", desc)?;
                }
                let len = keymaps_ref.raw_len();
                keymaps_ref.set(len + 1, entry)?;
                Ok(())
            },
        )
        .map_err(|e| e.to_string())?;
    keymap_table.set("set", set_fn).map_err(|e| e.to_string())?;
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
    let g: Table = scribl_table.get("g").map_err(|e| e.to_string())?;
    let mapleader: String = g.get("mapleader").unwrap_or_else(|_| " ".to_string());

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

    // Extract keymaps
    let mut keymaps = Vec::new();
    let raw_len = keymaps_list.raw_len();
    for i in 1..=raw_len {
        if let Ok(entry) = keymaps_list.get::<Table>(i) {
            let mode: String = entry.get("mode").unwrap_or_else(|_| "n".into());
            let lhs: String = entry.get("lhs").unwrap_or_default();
            let rhs: String = entry.get("rhs").unwrap_or_default();
            let desc: Option<String> = entry.get("desc").ok();

            if !lhs.is_empty() && !rhs.is_empty() {
                // If user registered an existing lhs, override it
                if let Some(pos) = keymaps
                    .iter()
                    .position(|k: &KeymapEntry| k.mode == mode && k.lhs == lhs)
                {
                    keymaps[pos] = KeymapEntry {
                        mode,
                        lhs,
                        rhs,
                        desc,
                    };
                } else {
                    keymaps.push(KeymapEntry {
                        mode,
                        lhs,
                        rhs,
                        desc,
                    });
                }
            }
        }
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
        mapleader,
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
        assert_eq!(config.mapleader, " ");
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
            scribl.g.mapleader = ","
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
        assert_eq!(config.mapleader, ",");
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
    fn test_eval_syntax_error_returns_err() {
        let bad_script = "local scribl = require('scribl' -- syntax error";
        let res = eval_lua_config_string(bad_script, None);
        assert!(res.is_err());
    }
}
