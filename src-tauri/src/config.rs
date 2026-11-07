use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppOptions {
    pub dot_grid: bool,
    pub default_tool: String,
    pub zoom_mode: String,
    pub stroke_smoothing: f64,
    pub stroke_thinning: f64,
    pub auto_save: bool,
    #[serde(default = "default_pen_color_val")]
    pub default_pen_color: String,
}

fn default_pen_color_val() -> String {
    "#0284c7".to_string()
}

impl Default for AppOptions {
    fn default() -> Self {
        Self {
            dot_grid: true,
            default_tool: "pen".to_string(),
            zoom_mode: "scrubby".to_string(),
            stroke_smoothing: 0.5,
            stroke_thinning: 0.6,
            auto_save: true,
            default_pen_color: "#0284c7".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct KeymapEntry {
    pub mode: String,
    pub lhs: String,
    pub rhs: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub desc: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolGroupConfig {
    pub label: String,
    pub default: String,
    pub items: Vec<String>,
}

pub fn default_groups() -> HashMap<String, ToolGroupConfig> {
    let mut groups = HashMap::new();
    groups.insert(
        "shapes".to_string(),
        ToolGroupConfig {
            label: "Shapes".to_string(),
            default: "rectangle".to_string(),
            items: vec![
                "rectangle".to_string(),
                "circle".to_string(),
                "diamond".to_string(),
                "line".to_string(),
                "arrow".to_string(),
            ],
        },
    );
    groups
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolbarConfig {
    pub position: String, // "bottom", "top", "left", "right"
    pub items: Vec<String>,
    #[serde(default = "default_groups")]
    pub groups: HashMap<String, ToolGroupConfig>,
}

impl Default for ToolbarConfig {
    fn default() -> Self {
        Self {
            position: "bottom".to_string(),
            items: vec![
                "select".to_string(),
                "pen".to_string(),
                "eraser".to_string(),
                "shapes".to_string(),
                "text".to_string(),
                "zoom".to_string(),
                "|".to_string(),
                "undo".to_string(),
                "redo".to_string(),
                "|".to_string(),
                "clear".to_string(),
            ],
            groups: default_groups(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeColors {
    pub canvas_bg: String,
    pub grid_dot: String,
    pub panel_bg: String,
    pub panel_border: String,
    pub panel_shadow: String,
    pub text_primary: String,
    pub text_secondary: String,
    pub text_disabled: String,
    pub accent: String,
    pub accent_hover: String,
    pub accent_light: String,
    pub selection_stroke: String,
    pub selection_fill: String,
    pub danger: String,
}

impl Default for ThemeColors {
    fn default() -> Self {
        get_preset_theme("default-dark")
    }
}

pub fn get_preset_theme(name: &str) -> ThemeColors {
    match name {
        "light" => ThemeColors {
            canvas_bg: "#f8fafc".into(),
            grid_dot: "#cbd5e1".into(),
            panel_bg: "rgba(255, 255, 255, 0.88)".into(),
            panel_border: "rgba(15, 23, 42, 0.08)".into(),
            panel_shadow: "0 12px 36px rgba(0, 0, 0, 0.08)".into(),
            text_primary: "#0f172a".into(),
            text_secondary: "#64748b".into(),
            text_disabled: "#94a3b8".into(),
            accent: "#0284c7".into(),
            accent_hover: "#0369a1".into(),
            accent_light: "#0284c7".into(),
            selection_stroke: "#0284c7".into(),
            selection_fill: "rgba(2, 132, 199, 0.08)".into(),
            danger: "#dc2626".into(),
        },
        "tokyo-night" => ThemeColors {
            canvas_bg: "#1a1b26".into(),
            grid_dot: "#2f3549".into(),
            panel_bg: "rgba(26, 27, 38, 0.85)".into(),
            panel_border: "rgba(255, 255, 255, 0.08)".into(),
            panel_shadow: "0 12px 36px rgba(0, 0, 0, 0.45)".into(),
            text_primary: "#c0caf5".into(),
            text_secondary: "#7aa2f7".into(),
            text_disabled: "#414868".into(),
            accent: "#7aa2f7".into(),
            accent_hover: "#565f89".into(),
            accent_light: "#7dcfff".into(),
            selection_stroke: "#7aa2f7".into(),
            selection_fill: "rgba(122, 162, 247, 0.12)".into(),
            danger: "#f7768e".into(),
        },
        "catppuccin" => ThemeColors {
            canvas_bg: "#1e1e2e".into(),
            grid_dot: "#45475a".into(),
            panel_bg: "rgba(30, 30, 46, 0.85)".into(),
            panel_border: "rgba(255, 255, 255, 0.08)".into(),
            panel_shadow: "0 12px 36px rgba(0, 0, 0, 0.45)".into(),
            text_primary: "#cdd6f4".into(),
            text_secondary: "#a6adc8".into(),
            text_disabled: "#585b70".into(),
            accent: "#cba6f7".into(),
            accent_hover: "#b4befe".into(),
            accent_light: "#89dceb".into(),
            selection_stroke: "#cba6f7".into(),
            selection_fill: "rgba(203, 166, 247, 0.12)".into(),
            danger: "#f38ba8".into(),
        },
        _ => ThemeColors {
            // default-dark
            canvas_bg: "#090d16".into(),
            grid_dot: "#334155".into(),
            panel_bg: "rgba(15, 23, 42, 0.78)".into(),
            panel_border: "rgba(255, 255, 255, 0.08)".into(),
            panel_shadow: "0 12px 36px rgba(0, 0, 0, 0.45)".into(),
            text_primary: "#f8fafc".into(),
            text_secondary: "#94a3b8".into(),
            text_disabled: "#475569".into(),
            accent: "#0284c7".into(),
            accent_hover: "#0369a1".into(),
            accent_light: "#38bdf8".into(),
            selection_stroke: "#38bdf8".into(),
            selection_fill: "rgba(56, 189, 248, 0.08)".into(),
            danger: "#ef4444".into(),
        },
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ThemeConfig {
    pub name: String,
    #[serde(default)]
    pub overrides: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active: Option<ThemeColors>,
}

impl Default for ThemeConfig {
    fn default() -> Self {
        let mut cfg = Self {
            name: "default-dark".to_string(),
            overrides: HashMap::new(),
            active: None,
        };
        cfg.active = Some(resolve_theme(&cfg));
        cfg
    }
}

pub fn darken_hex(hex: &str, factor: f64) -> String {
    let clean = hex.trim().trim_start_matches('#');
    if clean.len() == 6 {
        if let (Ok(r), Ok(g), Ok(b)) = (
            u8::from_str_radix(&clean[0..2], 16),
            u8::from_str_radix(&clean[2..4], 16),
            u8::from_str_radix(&clean[4..6], 16),
        ) {
            let dr = (r as f64 * factor).clamp(0.0, 255.0).round() as u8;
            let dg = (g as f64 * factor).clamp(0.0, 255.0).round() as u8;
            let db = (b as f64 * factor).clamp(0.0, 255.0).round() as u8;
            return format!("#{:02x}{:02x}{:02x}", dr, dg, db);
        }
    } else if clean.len() == 3 {
        let r_res = u8::from_str_radix(&clean[0..1], 16);
        let g_res = u8::from_str_radix(&clean[1..2], 16);
        let b_res = u8::from_str_radix(&clean[2..3], 16);
        if let (Ok(r), Ok(g), Ok(b)) = (r_res, g_res, b_res) {
            let dr = (r as f64 * 17.0 * factor).clamp(0.0, 255.0).round() as u8;
            let dg = (g as f64 * 17.0 * factor).clamp(0.0, 255.0).round() as u8;
            let db = (b as f64 * 17.0 * factor).clamp(0.0, 255.0).round() as u8;
            return format!("#{:02x}{:02x}{:02x}", dr, dg, db);
        }
    }
    hex.to_string()
}

pub fn resolve_theme(config: &ThemeConfig) -> ThemeColors {
    let mut base = get_preset_theme(&config.name);
    for (k, v) in &config.overrides {
        match k.as_str() {
            "canvas_bg" => base.canvas_bg = v.clone(),
            "grid_dot" => base.grid_dot = v.clone(),
            "panel_bg" => base.panel_bg = v.clone(),
            "panel_border" => base.panel_border = v.clone(),
            "panel_shadow" => base.panel_shadow = v.clone(),
            "text_primary" => base.text_primary = v.clone(),
            "text_secondary" => base.text_secondary = v.clone(),
            "text_disabled" => base.text_disabled = v.clone(),
            "accent" => base.accent = v.clone(),
            "accent_hover" => base.accent_hover = v.clone(),
            "accent_light" => base.accent_light = v.clone(),
            "selection_stroke" => base.selection_stroke = v.clone(),
            "selection_fill" => base.selection_fill = v.clone(),
            "danger" => base.danger = v.clone(),
            _ => {}
        }
    }
    // If accent is overridden but accent_hover is not, derive accent_hover from accent
    if config.overrides.contains_key("accent") && !config.overrides.contains_key("accent_hover") {
        base.accent_hover = darken_hex(&base.accent, 0.82);
    }
    base
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ScriblConfig {
    pub options: AppOptions,
    pub keymaps: Vec<KeymapEntry>,
    pub toolbar: ToolbarConfig,
    pub theme: ThemeConfig,
}

impl Default for ScriblConfig {
    fn default() -> Self {
        Self {
            options: AppOptions::default(),
            keymaps: vec![
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "p".into(),
                    rhs: "tool.pen".into(),
                    desc: Some("Pen Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "2".into(),
                    rhs: "tool.pen".into(),
                    desc: Some("Pen Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "e".into(),
                    rhs: "tool.eraser".into(),
                    desc: Some("Eraser Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "3".into(),
                    rhs: "tool.eraser".into(),
                    desc: Some("Eraser Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "v".into(),
                    rhs: "tool.select".into(),
                    desc: Some("Select Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "1".into(),
                    rhs: "tool.select".into(),
                    desc: Some("Select Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "s".into(),
                    rhs: "tool.shapes".into(),
                    desc: Some("Shapes Tool (Browse on double-press)".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "6".into(),
                    rhs: "tool.shapes".into(),
                    desc: Some("Shapes Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "r".into(),
                    rhs: "tool.shape.rectangle".into(),
                    desc: Some("Rectangle Shape".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "z".into(),
                    rhs: "tool.zoom".into(),
                    desc: Some("Zoom Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "4".into(),
                    rhs: "tool.zoom".into(),
                    desc: Some("Zoom Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "t".into(),
                    rhs: "tool.text".into(),
                    desc: Some("Text Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "5".into(),
                    rhs: "tool.text".into(),
                    desc: Some("Text Tool".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<S-0>".into(),
                    rhs: "zoom.reset".into(),
                    desc: Some("Reset Zoom (100%)".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-0>".into(),
                    rhs: "zoom.reset".into(),
                    desc: Some("Reset Zoom (100%)".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "=".into(),
                    rhs: "zoom.in".into(),
                    desc: Some("Zoom In".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "+".into(),
                    rhs: "zoom.in".into(),
                    desc: Some("Zoom In".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "-".into(),
                    rhs: "zoom.out".into(),
                    desc: Some("Zoom Out".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<Space>".into(),
                    rhs: "canvas.pan".into(),
                    desc: Some("Pan Canvas".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-z>".into(),
                    rhs: "history.undo".into(),
                    desc: Some("Undo".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-S-z>".into(),
                    rhs: "history.redo".into(),
                    desc: Some("Redo".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-y>".into(),
                    rhs: "history.redo".into(),
                    desc: Some("Redo".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<BS>".into(),
                    rhs: "selection.delete".into(),
                    desc: Some("Delete Selected".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<Del>".into(),
                    rhs: "selection.delete".into(),
                    desc: Some("Delete Selected".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-s>".into(),
                    rhs: "file.save".into(),
                    desc: Some("Save Drawing".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-o>".into(),
                    rhs: "file.open".into(),
                    desc: Some("Open Drawing".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "c".into(),
                    rhs: "canvas.clear".into(),
                    desc: Some("Clear Canvas".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "f".into(),
                    rhs: "zoom.fit_all".into(),
                    desc: Some("Fit Drawing".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-,>".into(),
                    rhs: "app.settings".into(),
                    desc: Some("Open Settings".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-c>".into(),
                    rhs: "edit.copy".into(),
                    desc: Some("Copy".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-v>".into(),
                    rhs: "edit.paste".into(),
                    desc: Some("Paste".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-x>".into(),
                    rhs: "edit.cut".into(),
                    desc: Some("Cut".into()),
                },
                KeymapEntry {
                    mode: "n".into(),
                    lhs: "<D-d>".into(),
                    rhs: "edit.duplicate".into(),
                    desc: Some("Duplicate".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "r".into(),
                    rhs: "selection.rotate".into(),
                    desc: Some("Rotate Selection".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "<Esc>".into(),
                    rhs: "selection.deselect".into(),
                    desc: Some("Deselect".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "d".into(),
                    rhs: "selection.delete".into(),
                    desc: Some("Delete Selected".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "y".into(),
                    rhs: "edit.copy".into(),
                    desc: Some("Yank (Copy)".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "p".into(),
                    rhs: "edit.paste".into(),
                    desc: Some("Put (Paste)".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "<D-c>".into(),
                    rhs: "edit.copy".into(),
                    desc: Some("Copy".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "<D-v>".into(),
                    rhs: "edit.paste".into(),
                    desc: Some("Paste".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "<D-x>".into(),
                    rhs: "edit.cut".into(),
                    desc: Some("Cut".into()),
                },
                KeymapEntry {
                    mode: "v".into(),
                    lhs: "<D-d>".into(),
                    rhs: "edit.duplicate".into(),
                    desc: Some("Duplicate".into()),
                },
            ],
            toolbar: ToolbarConfig::default(),
            theme: ThemeConfig::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_theme_is_default_dark() {
        let config = ScriblConfig::default();
        assert_eq!(config.theme.name, "default-dark");
        let active = resolve_theme(&config.theme);
        assert_eq!(active.canvas_bg, "#090d16");
        assert_eq!(active.grid_dot, "#334155");
        assert_eq!(active.accent, "#0284c7");
    }

    #[test]
    fn test_presets_exist_and_resolve() {
        let presets = ["default-dark", "light", "tokyo-night", "catppuccin"];
        for name in presets {
            let colors = get_preset_theme(name);
            assert!(!colors.canvas_bg.is_empty());
            assert!(!colors.accent.is_empty());
        }
    }

    #[test]
    fn test_theme_overrides_overlay_preset() {
        let mut theme = ThemeConfig::default();
        theme.name = "default-dark".to_string();
        theme
            .overrides
            .insert("canvas_bg".to_string(), "#000000".to_string());
        theme
            .overrides
            .insert("accent".to_string(), "#ff0000".to_string());

        let resolved = resolve_theme(&theme);
        assert_eq!(resolved.canvas_bg, "#000000");
        assert_eq!(resolved.accent, "#ff0000");
        assert_eq!(resolved.accent_hover, "#d10000"); // Auto-derived gradient stop
        assert_eq!(resolved.grid_dot, "#334155"); // Preserved from preset

        // Explicit accent_hover takes precedence over auto-derivation
        theme
            .overrides
            .insert("accent_hover".to_string(), "#123456".to_string());
        let resolved2 = resolve_theme(&theme);
        assert_eq!(resolved2.accent_hover, "#123456");
    }

    #[test]
    fn test_default_toolbar_and_keymaps_include_text_tool() {
        let toolbar = ToolbarConfig::default();
        assert!(toolbar.items.contains(&"text".to_string()));

        let config = ScriblConfig::default();
        assert!(
            config
                .keymaps
                .iter()
                .any(|k| k.rhs == "tool.text" && k.lhs == "t")
        );
        assert!(
            config
                .keymaps
                .iter()
                .any(|k| k.rhs == "tool.text" && k.lhs == "5")
        );
    }
}
