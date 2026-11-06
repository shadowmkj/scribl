use crate::config::ScriblConfig;

pub fn generate_lua_script(config: &ScriblConfig) -> String {
    let mut out = String::new();

    out.push_str("-- ~/.config/scribl/init.lua\n");
    out.push_str("-- Scribl Lua Configuration File\n\n");
    out.push_str("local scribl = require(\"scribl\")\n\n");

    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str("-- 1. General Options\n");
    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str(&format!(
        "scribl.opt.dot_grid = {}\n",
        config.options.dot_grid
    ));
    out.push_str(&format!(
        "scribl.opt.default_tool = \"{}\"\n",
        config.options.default_tool
    ));
    out.push_str(&format!(
        "scribl.opt.default_pen_color = \"{}\"\n",
        config.options.default_pen_color
    ));
    out.push_str(&format!(
        "scribl.opt.zoom_mode = \"{}\"\n",
        config.options.zoom_mode
    ));
    out.push_str(&format!(
        "scribl.opt.stroke_smoothing = {:.2}\n",
        config.options.stroke_smoothing
    ));
    out.push_str(&format!(
        "scribl.opt.stroke_thinning = {:.2}\n",
        config.options.stroke_thinning
    ));
    out.push_str(&format!(
        "scribl.opt.auto_save = {}\n\n",
        config.options.auto_save
    ));

    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str("-- 2. Keybindings\n");
    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    for km in &config.keymaps {
        let desc_part = match &km.desc {
            Some(d) => format!(", {{ desc = \"{}\" }}", d),
            None => String::new(),
        };
        out.push_str(&format!(
            "scribl.keymap.set(\"{}\", \"{}\", \"{}\"{})\n",
            km.mode, km.lhs, km.rhs, desc_part
        ));
    }
    out.push('\n');

    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str("-- 3. Floating Toolbar Layout\n");
    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str("scribl.ui.toolbar = {\n");
    out.push_str(&format!("  position = \"{}\",\n", config.toolbar.position));
    if !config.toolbar.groups.is_empty() {
        out.push_str("  groups = {\n");
        let mut sorted_group_keys: Vec<_> = config.toolbar.groups.keys().collect();
        sorted_group_keys.sort();
        for g_name in sorted_group_keys {
            let g = &config.toolbar.groups[g_name];
            out.push_str(&format!("    {} = {{\n", g_name));
            out.push_str(&format!("      label = \"{}\",\n", g.label));
            out.push_str(&format!("      default = \"{}\",\n", g.default));
            out.push_str("      items = {\n");
            for item in &g.items {
                out.push_str(&format!("        \"{}\",\n", item));
            }
            out.push_str("      },\n");
            out.push_str("    },\n");
        }
        out.push_str("  },\n");
    }
    out.push_str("  items = {\n");
    for item in &config.toolbar.items {
        out.push_str(&format!("    \"{}\",\n", item));
    }
    out.push_str("  },\n");
    out.push_str("}\n\n");

    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str("-- 4. Theme Configuration\n");
    out.push_str(
        "--------------------------------------------------------------------------------\n",
    );
    out.push_str(&format!("scribl.theme.name = \"{}\"\n", config.theme.name));
    if !config.theme.overrides.is_empty() {
        out.push_str("scribl.theme.overrides = {\n");
        let mut sorted_keys: Vec<_> = config.theme.overrides.keys().collect();
        sorted_keys.sort();
        for k in sorted_keys {
            out.push_str(&format!("  {} = \"{}\",\n", k, config.theme.overrides[k]));
        }
        out.push_str("}\n");
    } else {
        out.push_str("-- scribl.theme.overrides = {}\n");
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lua_engine::eval_lua_config_string;

    #[test]
    fn test_generate_lua_round_trip() {
        let mut config = ScriblConfig::default();
        config.options.dot_grid = false;
        config.options.default_tool = "eraser".to_string();
        config.options.default_pen_color = "#ff0077".to_string();
        config.options.zoom_mode = "selection".to_string();
        config.options.stroke_smoothing = 0.8;
        config.options.stroke_thinning = 0.4;
        config.options.auto_save = false;

        let script = generate_lua_script(&config);
        assert!(script.contains("scribl.opt.dot_grid = false"));
        assert!(script.contains("scribl.opt.default_tool = \"eraser\""));
        assert!(script.contains("scribl.opt.default_pen_color = \"#ff0077\""));
        assert!(script.contains("scribl.opt.zoom_mode = \"selection\""));

        // Round-trip verification: evaluating generated script must yield exact same config
        let parsed = eval_lua_config_string(&script, None).expect("generated script should parse");
        assert_eq!(parsed.options, config.options);
        assert_eq!(parsed.toolbar, config.toolbar);
        assert_eq!(parsed.keymaps, config.keymaps);
    }

    #[test]
    fn test_generate_lua_round_trip_theme() {
        let mut config = ScriblConfig::default();
        config.theme.name = "tokyo-night".to_string();
        config
            .theme
            .overrides
            .insert("accent".to_string(), "#ffaa00".to_string());
        config.theme.active = Some(crate::config::resolve_theme(&config.theme));

        let script = generate_lua_script(&config);
        let evaluated = eval_lua_config_string(&script, None).expect("should evaluate");
        assert_eq!(evaluated.theme.name, "tokyo-night");
        assert_eq!(evaluated.theme.overrides.get("accent").unwrap(), "#ffaa00");
    }
}
