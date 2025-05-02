import { useEffect, useState } from "react";
import {
  initializeDatabase,
  listOrders,
  addOrder,
  Order, // Order 型もインポート
} from "./api/db"; // 作成した db.ts をインポート
import "./App.css";

export default function App() {
  // --- State 定義 ---
  const [orders, setOrders] = useState<Order[]>([]); // 注文リスト
  const [customerName, setCustomerName] = useState(""); // フォーム: 顧客名
  const [totalAmount, setTotalAmount] = useState<number | string>(""); // フォーム: 合計金額 (入力中は文字列も許容)
  const [isLoading, setIsLoading] = useState(true); // ローディング状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  // --- 初期化処理 ---
  // コンポーネントマウント時にデータベースを初期化し、最初の注文リストを取得
  useEffect(() => {
    async function loadDbAndData() {
      try {
        setIsLoading(true);
        setError(null);
        await initializeDatabase(); // データベース接続を初期化
        await refreshOrders(); // 最初の注文リストを取得
      } catch (err) {
        console.error("Failed to initialize database or load orders:", err);
        setError(
          err instanceof Error ? err.message : "データベースの初期化または注文の読み込みに失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndData();
  }, []); // 空の依存配列で初回のみ実行

  // --- データ取得関数 ---
  // 注文リストを再取得して state を更新する
  async function refreshOrders() {
    try {
      setError(null); // エラーをリセット
      const fetchedOrders = await listOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to refresh orders:", err);
      setError(err instanceof Error ? err.message : "注文リストの更新に失敗しました");
    }
  }

  // --- フォーム送信処理 ---
  async function handleAddOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // デフォルトのフォーム送信をキャンセル

    // 金額が数値か確認
    const amount = parseFloat(totalAmount as string);
    if (isNaN(amount) || amount <= 0) {
      setError("合計金額は有効な正の数値を入力してください。");
      return;
    }
    if (!customerName.trim()) {
      setError("顧客名を入力してください。");
      return;
    }

    try {
      setError(null); // エラーをリセット
      const now = new Date();
      // order_date を ISO 文字列 (例: "2024-05-03T10:30:00.000Z") で保存
      // または toLocaleString など、好みの形式でOK
      const orderDate = now.toISOString();

      await addOrder(customerName, amount, orderDate);

      // フォームをクリア
      setCustomerName("");
      setTotalAmount("");

      // リストを再読み込み
      await refreshOrders();
    } catch (err) {
      console.error("Failed to add order:", err);
      setError(err instanceof Error ? err.message : "注文の追加に失敗しました");
    }
  }

  // --- ローディング・エラー表示 ---
  if (isLoading) {
    return <div className="p-4 text-center">データベースを読み込み中...</div>;
  }

  // --- メイン UI ---
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        注文管理
      </h1>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded-md">
          エラー: {error}
        </div>
      )}

      {/* 注文追加フォーム */}
      <form
        onSubmit={handleAddOrder}
        className="mb-8 p-4 border rounded-lg shadow-sm bg-white space-y-3"
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-3">新規注文追加</h2>
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-3 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              顧客名
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="例: 山田太郎"
              required // 簡単な必須チェック
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
              合計金額 (円)
            </label>
            <input
              id="totalAmount"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="例: 5000"
              required
              min="1" // 1円以上に
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            注文追加
          </button>
        </div>
      </form>

      {/* 注文一覧テーブル */}
      <h2 className="text-xl font-semibold text-gray-700 mb-3">注文一覧</h2>
      <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文日時</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              {/* 将来的に操作ボタン用の列を追加 */}
              {/* <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">注文はありません</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* 日付を見やすい形式にフォーマット (必要に応じてライブラリ導入も検討) */}
                    {new Date(order.order_date).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ¥{order.total_amount.toLocaleString()} {/* 金額フォーマット */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.status}</td>
                  {/* <td><button>編集</button> <button>削除</button></td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
