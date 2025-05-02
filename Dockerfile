# Rust の公式イメージをベースにする (バージョンは適宜調整)
FROM rust:1.78 AS builder

# 必要な環境変数を設定
ENV DEBIAN_FRONTEND=noninteractive

# Node.js (LTS) と必要な OS パッケージをインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    # Tauri の Linux ビルドに必要な依存関係
    apt-get install -y --no-install-recommends \
        libgtk-3-dev \
        libwebkit2gtk-4.1-dev \
        # Ubuntu 22.04 以降では libappindicator3-dev の代わりにこちら
        libayatana-appindicator3-dev \
        librsvg2-dev \
        patchelf \
        pkg-config \
        build-essential && \
    # クリーンアップ
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Tauri CLI をインストール
RUN cargo install tauri-cli --locked

# アプリケーションディレクトリを作成
WORKDIR /app

# 依存関係ファイルを先にコピーしてキャッシュを活用
COPY package.json package-lock.json* ./
COPY src-tauri/Cargo.toml src-tauri/Cargo.lock* ./src-tauri/

# Node.js の依存関係をインストール (npm ci を推奨)
RUN npm ci

# Rust の依存関係をキャッシュ (任意ですがビルド時間短縮に貢献)
# WORKDIR /app/src-tauri
# RUN cargo fetch
# WORKDIR /app

# プロジェクトの残りのファイルをコピー
COPY . .

# フロントエンドのビルド (Tauri build が内部で行うが、明示しても良い)
# RUN npm run build

# Tauri アプリケーションのビルド (Linux 向け)
# --verbose オプションで詳細ログ表示
RUN cargo tauri build --verbose

# --- 実行用ステージ (任意) ---
# 上記でビルドした成果物だけを含む軽量なイメージを作成する場合
# FROM debian:bullseye-slim
# COPY --from=builder /app/src-tauri/target/release/bundle/ /app/
# WORKDIR /app
# # ここで AppImage や deb を指定するなど
# ENTRYPOINT ["./your-app-name.AppImage"] 