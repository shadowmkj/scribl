pub mod config;
pub mod lua_engine;
pub mod lua_generator;
pub mod watcher;

pub const APP_VERSION: &str = match option_env!("SCRIBL_VERSION") {
    Some(v) => v,
    None => env!("CARGO_PKG_VERSION"),
};

#[tauri::command]
fn get_app_version() -> &'static str {
    APP_VERSION
}

#[tauri::command]
fn get_config() -> Result<config::ScriblConfig, String> {
    let init_path = watcher::ensure_default_config_exists()?;
    lua_engine::eval_lua_config_file(&init_path)
}

#[tauri::command]
fn reload_config() -> Result<config::ScriblConfig, String> {
    let init_path = watcher::get_init_lua_path();
    lua_engine::eval_lua_config_file(&init_path)
}

#[tauri::command]
fn get_config_path() -> String {
    watcher::get_init_lua_path().to_string_lossy().to_string()
}

#[tauri::command]
fn save_config(config: config::ScriblConfig) -> Result<(), String> {
    let init_path = watcher::get_init_lua_path();
    let content = lua_generator::generate_lua_script(&config);
    if let Some(parent) = init_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::write(&init_path, content)
        .map_err(|e| format!("Failed to write {}: {}", init_path.display(), e))
}

#[tauri::command]
fn open_config_file(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let init_path = watcher::get_init_lua_path();
    let _ = watcher::ensure_default_config_exists();
    app.opener()
        .open_path(init_path.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn reveal_config_file(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let config_dir = watcher::get_config_dir();
    let _ = watcher::ensure_default_config_exists();
    app.opener()
        .reveal_item_in_dir(config_dir)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn reveal_themes_folder(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let themes_dir = watcher::get_themes_dir();
    let _ = watcher::ensure_default_config_exists();
    app.opener()
        .reveal_item_in_dir(themes_dir)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _ = watcher::ensure_default_config_exists();
            watcher::spawn_config_watcher(app.handle().clone());

            #[cfg(target_os = "macos")]
            {
                use tauri::menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
                let app_submenu = SubmenuBuilder::new(app, "Scribl")
                    .about(Some(AboutMetadata {
                        version: Some(APP_VERSION.to_string()),
                        ..Default::default()
                    }))
                    .separator()
                    .item(
                        &MenuItemBuilder::with_id("settings", "Settings...")
                            .accelerator("CmdOrCtrl+,")
                            .build(app)?,
                    )
                    .separator()
                    .services()
                    .separator()
                    .hide()
                    .hide_others()
                    .show_all()
                    .separator()
                    .quit()
                    .build()?;

                let edit_submenu = SubmenuBuilder::new(app, "Edit")
                    .undo()
                    .redo()
                    .separator()
                    .cut()
                    .copy()
                    .paste()
                    .select_all()
                    .build()?;

                let window_submenu = SubmenuBuilder::new(app, "Window")
                    .minimize()
                    .maximize()
                    .separator()
                    .close_window()
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .item(&app_submenu)
                    .item(&edit_submenu)
                    .item(&window_submenu)
                    .build()?;

                app.set_menu(menu)?;

                use tauri::Emitter;
                app.on_menu_event(move |app_handle, event| {
                    if event.id().as_ref() == "settings" {
                        let _ = app_handle.emit("open-settings", ());
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            reload_config,
            get_config_path,
            save_config,
            open_config_file,
            reveal_config_file,
            reveal_themes_folder,
            get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_format() {
        let base = env!("CARGO_PKG_VERSION");
        let unreleased_prefix = format!("{base}+");
        assert!(
            APP_VERSION == base || APP_VERSION.starts_with(&unreleased_prefix),
            "expected version '{APP_VERSION}' to be '{base}' or start with '{unreleased_prefix}'"
        );
    }
}
