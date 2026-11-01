pub mod config;
pub mod lua_engine;
pub mod watcher;

#[tauri::command]
fn get_config() -> Result<config::ScriblConfig, String> {
    let init_path = watcher::get_init_lua_path();
    if !init_path.exists() {
        let _ = watcher::ensure_default_config_exists();
    }
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _ = watcher::ensure_default_config_exists();
            watcher::spawn_config_watcher(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            reload_config,
            get_config_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
