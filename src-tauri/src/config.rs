use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppOptions {
    pub dot_grid: bool,
    pub default_tool: String,
    pub zoom_mode: String,
    pub stroke_smoothing: f64,
    pub stroke_thinning: f64,
    pub auto_save: bool,
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
pub struct ToolbarConfig {
    pub position: String, // "bottom", "top", "left", "right"
    pub items: Vec<String>,
}

impl Default for ToolbarConfig {
    fn default() -> Self {
        Self {
            position: "bottom".to_string(),
            items: vec![
                "select".to_string(),
                "pen".to_string(),
                "eraser".to_string(),
                "zoom".to_string(),
                "|".to_string(),
                "undo".to_string(),
                "redo".to_string(),
                "|".to_string(),
                "clear".to_string(),
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ScriblConfig {
    pub options: AppOptions,
    pub keymaps: Vec<KeymapEntry>,
    pub toolbar: ToolbarConfig,
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
        }
    }
}
