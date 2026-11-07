use std::process::Command;

fn main() {
    let pkg_version = env!("CARGO_PKG_VERSION");

    println!("cargo:rerun-if-env-changed=SCRIBL_RELEASE");
    println!("cargo:rerun-if-env-changed=SCRIBL_VERSION");

    rerun_if_git_changes();

    let version = if let Ok(custom_version) = std::env::var("SCRIBL_VERSION") {
        custom_version
    } else {
        match get_unreleased_git_info() {
            Some(commit_hash) => format!("{pkg_version}+{commit_hash}"),
            None => pkg_version.to_string(),
        }
    };

    println!("cargo:rustc-env=SCRIBL_VERSION={version}");
    println!("cargo:rustc-env=APP_VERSION={version}");
    if is_release_build() {
        println!("cargo:rustc-env=SCRIBL_IS_RELEASE=1");
    }

    tauri_build::build();
}

/// Returns Git commit hash if this is an unreleased build (HEAD is not tagged).
/// Returns None if HEAD points to a tag or if git is unavailable.
fn get_unreleased_git_info() -> Option<String> {
    // If explicitly marked as a release build via environment variable, never include commit hash
    if is_release_build() {
        return None;
    }

    // Check if HEAD has any tag pointing directly to it
    let has_tag = Command::new("git")
        .args(["tag", "--points-at", "HEAD"])
        .output()
        .map(|out| {
            out.status.success()
                && String::from_utf8_lossy(&out.stdout)
                    .lines()
                    .any(|line| !line.trim().is_empty())
        })
        .unwrap_or(false);

    // If HEAD is tagged, this is a released version (do not embed commit hash)
    if has_tag {
        return None;
    }

    // Otherwise, this is an unreleased build: retrieve the short commit hash
    Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok()
        .filter(|out| out.status.success())
        .map(|out| String::from_utf8_lossy(&out.stdout).trim().to_string())
}

/// Determines whether the current build should be treated as an official release build.
/// Returns true if SCRIBL_RELEASE is set, or if running in a GitHub Actions release/tag workflow.
fn is_release_build() -> bool {
    // 1. Explicit release flag: SCRIBL_RELEASE=true, 1, yes, on
    if let Ok(val) = std::env::var("SCRIBL_RELEASE") {
        let val = val.trim().to_lowercase();
        if val == "1" || val == "true" || val == "yes" || val == "on" {
            return true;
        }
    }

    // 2. GitHub Actions automated release detection
    // GITHUB_ACTIONS is always "true" in GitHub Actions.
    // GITHUB_WORKFLOW is set to the name of the workflow (e.g. "Release").
    // GITHUB_REF_TYPE is "tag" when a tag is pushed.
    if std::env::var("GITHUB_ACTIONS").is_ok() {
        if let Ok(workflow) = std::env::var("GITHUB_WORKFLOW")
            && workflow.eq_ignore_ascii_case("release")
        {
            return true;
        }
        if let Ok(ref_type) = std::env::var("GITHUB_REF_TYPE")
            && ref_type.eq_ignore_ascii_case("tag")
        {
            return true;
        }
    }

    false
}

/// Watches git reference files so Cargo rebuilds when branches, commits, or tags change.
fn rerun_if_git_changes() {
    let git_dir = get_git_dir();
    let Some(git_dir) = git_dir else {
        return;
    };

    println!("cargo:rerun-if-changed={}", git_dir.join("index").display());
    println!("cargo:rerun-if-changed={}", git_dir.join("HEAD").display());
    println!(
        "cargo:rerun-if-changed={}",
        git_dir.join("refs/tags").display()
    );
    println!(
        "cargo:rerun-if-changed={}",
        git_dir.join("packed-refs").display()
    );

    if let Ok(head) = std::fs::read_to_string(git_dir.join("HEAD"))
        && let Some(ref_path) = head.strip_prefix("ref:")
    {
        let ref_file = git_dir.join(ref_path.trim());
        println!("cargo:rerun-if-changed={}", ref_file.display());
    }
}

/// Resolves the git directory, supporting both repository root and subdirectories / worktrees.
fn get_git_dir() -> Option<std::path::PathBuf> {
    if let Ok(out) = Command::new("git")
        .args(["rev-parse", "--git-dir"])
        .output()
        && out.status.success()
    {
        let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
        let p = std::path::PathBuf::from(path);
        if p.exists() {
            return Some(p);
        }
    }

    for candidate in [".git", "../.git"] {
        let p = std::path::Path::new(candidate);
        if p.is_file() {
            if let Ok(content) = std::fs::read_to_string(p)
                && let Some(gitdir) = content.strip_prefix("gitdir:")
            {
                let resolved = p
                    .parent()
                    .unwrap_or(std::path::Path::new("."))
                    .join(gitdir.trim());
                if resolved.exists() {
                    return Some(resolved);
                }
            }
        } else if p.is_dir() {
            return Some(p.to_path_buf());
        }
    }

    None
}
