import Database from "@tauri-apps/plugin-sql";

// 注文データの型定義
export interface Order {
  id: number;
  customer_name: string;
  order_date: string; // 日付は文字列として扱う
  total_amount: number;
  status: string;
}

let db: Database | null = null;

// データベース接続を初期化し、インスタンスを返す非同期関数
export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db; // すでに初期化済みなら既存のインスタンスを返す
  }
  // "orders.db" ファイルを指定してロード
  db = await Database.load("sqlite:orders.db");

  // ロック時のタイムアウト設定 (念のため)
  try {
    await db.execute("PRAGMA busy_timeout = 5000;");
  } catch (e) {
    console.error("Failed to set PRAGMA busy_timeout:", e);
  }

  // main.rs でマイグレーション (テーブル作成) を行っているので、
  // ここで CREATE TABLE を実行する必要はありません。
  // 必要であれば、ここで追加の初期化処理を実行できます。

  return db;
}

// 初期化済みのデータベースインスタンスを取得するヘルパー関数
function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return db;
}

// --- データベース操作関数 ---

/**
 * すべての注文を注文日の降順で取得します。
 */
export async function listOrders(): Promise<Order[]> {
  const dbInstance = getDb();
  // select 文を実行し、結果を Order[] 型として受け取る
  return dbInstance.select<Order[]>(
    "SELECT * FROM orders ORDER BY order_date DESC"
  );
}

/**
 * 新しい注文を追加します。
 * @param customerName 顧客名
 * @param totalAmount 合計金額
 * @param orderDate 注文日 (YYYY-MM-DD HH:MM:SS 形式の文字列など)
 */
export async function addOrder(
  customerName: string,
  totalAmount: number,
  orderDate: string // 日付はフロントエンドで生成して渡す想定
): Promise<void> {
  const dbInstance = getDb();
  // INSERT 文を実行 (status は DB の DEFAULT 'Pending' が使われる)
  await dbInstance.execute(
    "INSERT INTO orders (customer_name, order_date, total_amount) VALUES (?, ?, ?)",
    [customerName, orderDate, totalAmount]
  );
}

// --- 必要に応じて他の関数を追加 ---
// 例: 特定の注文を取得する関数, 注文を更新する関数, 注文を削除する関数など
