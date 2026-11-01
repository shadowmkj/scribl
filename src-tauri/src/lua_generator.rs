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
    out.push_str("  items = {\n");
    for item in &config.toolbar.items {
        out.push_str(&format!("    \"{}\",\n", item));
    }
    out.push_str("  },\n");
    out.push_str("}\n");

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
        config.options.zoom_mode = "selection".to_string();
        config.options.stroke_smoothing = 0.8;
        config.options.stroke_thinning = 0.4;
        config.options.auto_save = false;

        let script = generate_lua_script(&config);
        assert!(script.contains("scribl.opt.dot_grid = false"));
        assert!(script.contains("scribl.opt.default_tool = \"eraser\""));
        assert!(script.contains("scribl.opt.zoom_mode = \"selection\""));

        // Round-trip verification: evaluating generated script must yield exact same config
        let parsed = eval_lua_config_string(&script, None).expect("generated script should parse");
        assert_eq!(parsed.options, config.options);
        assert_eq!(parsed.toolbar, config.toolbar);
        assert_eq!(parsed.keymaps, config.keymaps);
    }
}
