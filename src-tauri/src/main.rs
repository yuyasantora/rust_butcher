// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// tauri_plugin_sql を use
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

fn main() {
    // --- 注文用データベースのマイグレーション定義 ---
    let migrations = vec![
        // マイグレーション バージョン 1: orders テーブルを作成
        Migration {
            version: 1,
            description: "create_orders_table",
            sql: r#"
                CREATE TABLE orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 注文ID (自動採番)
                    customer_name TEXT NOT NULL,         -- 顧客名
                    order_date TEXT NOT NULL,            -- 注文日時 (ISO8601形式の文字列など)
                    total_amount REAL NOT NULL,          -- 合計金額
                    status TEXT NOT NULL DEFAULT 'Pending' -- 注文ステータス (例: Pending, Completed)
                    -- 必要に応じて他のカラムを追加 (例: notes TEXT)
                );
            "#,
            kind: MigrationKind::Up,
        },
        // --- 将来的に order_items テーブルなどを追加する場合 ---
        // Migration {
        //     version: 2,
        //     description: "create_order_items_table",
        //     sql: r#" CREATE TABLE order_items ... "#,
        //     kind: MigrationKind::Up,
        // },
    ];

    tauri::Builder::default()
        // --- updater プラグインの行を削除 ---
        // .plugin(
        //     tauri_plugin_updater::Builder::new().build(),
        // )
        // --- ここまで削除 ---
        .plugin(
            // SQLプラグインの設定
            Builder::default()
                // "sqlite:orders.db" という名前でデータベースファイルを指定
                .add_migrations("sqlite:orders.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
