# ヒビタン アーキテクチャ概要

毎日の練習や習慣をログし、仲間と共有するための PWA アプリ。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フロントエンド | Vanilla JavaScript（ES Modules） |
| スタイル | 手書き CSS |
| バックエンド | Supabase（PostgreSQL + REST API + Storage） |
| 認証 | 独自認証（名前 + パスワードの RPC ベース） |
| プッシュ通知 | Web Push API + Service Worker |
| キャッシュ | Service Worker（ネットワーク優先） |
| ローカル保存 | localStorage |
| ホスティング | GitHub Pages |
| 言語 | JavaScript（型なし） |

---

## ファイル構成

```
site_root/
├── index.html          # 全画面を含む単一 HTML ファイル
├── lib/
│   ├── Hibitan.js      # 全ロジック（約1,500行）
│   └── Hibitan.css     # 全スタイル（約1,200行）
├── manifest.json       # PWA マニフェスト
├── sw.js               # Service Worker（キャッシュ + プッシュ通知）
├── icon-192.png        # PWA アイコン
├── icon-512.png        # PWA アイコン（大）
├── HANDOFF.md          # 引継ぎ資料
├── ARCHITECTURE.md     # このファイル
└── DATA_FLOW.md        # データフロー解説
```

---

## 画面一覧

| 画面 ID | 役割 |
|---------|------|
| `splashScreen` | 起動スプラッシュ（1.2秒表示） |
| `syokiGamen` | ログイン画面 |
| `step1`〜`step4` | チュートリアル（4ステップ） |
| `sinkiTourokuGamen` | 新規登録画面 |
| `homeGamen` | ホーム画面（カレンダー・記録・メニュー） |
| `editProfileScreen` | プロフィール編集 |
| `nakamanoYousu` | 仲間の様子（合言葉が同じユーザー一覧） |
| `scheduleInputScreen` | スケジュール入力（円グラフ付き） |
| `commentGamen` | 開発者へのフィードバック送信 |
| `seityouKirokuScreen` | ヒビタンの成長記録 |
| `customizeScreen` | テーマカラー選択 |
| `pushSettingsScreen` | プッシュ通知 ON/OFF |
| `monstoScreen` | ミニゲーム |
| `kinouGaiyou` | 機能概要（未実装） |

画面遷移は `showScreen(screenId)` で `display` を切り替える方式。`screenHistory` 配列で戻る機能を管理。

---

## グローバル状態

`lib/Hibitan.js` の先頭で定義。

| 変数 | 型 | 用途 |
|------|----|------|
| `user` | object \| null | ログイン中のユーザー情報 |
| `screenHistory` | string[] | 画面遷移の履歴（戻る機能用） |
| `selectedPhotoFile` | File \| null | 選択中の写真ファイル |
| `currentYear` | number | カレンダーの表示年 |
| `currentMonth` | number | カレンダーの表示月 |

---

## Supabase テーブル

### `hibitan`（ユーザー情報）

| カラム | 用途 |
|--------|------|
| 登録番号 | PK（ユーザーID） |
| 名前 | ニックネーム |
| パスワード | 平文（独自認証） |
| 目標 | 表示テキスト |
| 意気込み | 表示テキスト |
| 合言葉 | チームを特定するキーワード |
| 連続日数 | 連続記録日数 |
| 最終実施日 | 最後に記録した日付 |
| 一言日記 | 最新の日記テキスト |

### `daily_records`（日々の記録）

| カラム | 用途 |
|--------|------|
| user_id | FK → hibitan.登録番号 |
| record_date | 記録日（YYYY-MM-DD） |
| achieved | 達成フラグ（boolean） |
| diary | 一言日記 |
| photo_url | 写真の公開 URL |
| schedule_data | スケジュール JSON 配列 |

`schedule_data` の形式：
```json
[
  { "name": "練習", "start": "09:00", "end": "11:00" },
  { "name": "体幹", "start": "18:00", "end": "19:00" }
]
```

### `comments`（コメント）

| カラム | 用途 |
|--------|------|
| id | PK |
| target_user_id | コメント対象ユーザー |
| sender_name | 送信者名 |
| body | コメント本文 |
| created_at | 投稿日時 |

### `seityouKiroku`（成長記録）

| カラム | 用途 |
|--------|------|
| id | PK |
| title | タイトル |
| message | 本文 |
| created_at | 日時 |
| is_visible | 表示フラグ |

### `feedback`（フィードバック）

開発者宛のメッセージ。`body` と `created_at` のみ。

### Storage: `photos` バケット

パス形式：`{user_id}/{record_date}.jpg`（1日1枚・upsert）

---

## Supabase RPC 一覧

| RPC 名 | 引数 | 用途 |
|--------|------|------|
| `get_user_by_id` | `p_id` | ID でユーザー取得（自動ログイン） |
| `login_user` | `p_name, p_pass` | ログイン認証 |
| `register_user` | `p_name, p_pass, p_mokuhyou, p_aikotoba, p_ikigomi` | 新規登録 |
| `record_today` | `p_id, p_pass, p_note, p_date, p_photo_url` | 本日の記録保存 |
| `update_daily_photo` | `p_id, p_date, p_photo_url` | 写真のみ後から更新 |
| `upsert_schedule` | `p_user_id, p_date, p_schedule` | スケジュール保存/更新 |
| `update_profile` | `p_id, p_pass, p_name, p_newpass, p_mokuhyou, p_ikigomi` | プロフィール更新 |
| `get_nakama` | `p_aikotoba` | 合言葉で仲間一覧取得 |
| `upsert_push_subscription` | `p_user_id, p_subscription` | プッシュ通知登録 |
| `delete_push_subscription` | `p_user_id` | プッシュ通知解除 |

RPC は `SECURITY DEFINER` で実行されるため、RLS をバイパスできる。クライアントからの直接テーブル更新（UPDATE）は RLS に阻まれるため、写真更新等も RPC 経由で行う。

---

## localStorage キー一覧

| キー | 用途 |
|------|------|
| `hibitan_user_id` | ログイン状態の永続化（自動ログイン） |
| `hibitan_theme` | 選択中のテーマカラー |
| `hibitan_schedule_template` | スケジュールのテンプレ保存 |
| `latest_growth_date_tmp` | 最新の成長記録日時（一時保存） |
| `last_growth_checked_{userId}` | ユーザーごとの成長記録確認日時 |

---

## PWA 設定

### manifest.json

```json
{
  "name": "ヒビタン",
  "short_name": "ヒビタン",
  "start_url": "index.html",
  "display": "standalone",
  "theme_color": "#4CAF50"
}
```

### sw.js（Service Worker）

- キャッシュバージョン：`hibitan-cache-v26`
- **JS / CSS / HTML** → ネットワーク優先（更新を即反映）
- **その他（画像等）** → キャッシュ優先
- push イベント受信 → `showNotification()` で通知表示

---

## テーマ一覧

| キー | メインカラー | 用途 |
|------|------------|------|
| `green` | `#50c850` | デフォルト |
| `blue` | `#4fa3d1` | |
| `pink` | `#e67aa0` | |
| `orange` | `#f2a65a` | |
| `purple` | `#9b8cd9` | |
| `beige` | `#c8b89a` | |

`applyTheme(key)` で CSS 変数（`--main`, `--soft`, `--accent`）を書き換えて全体に反映。`localStorage` に保存して次回起動時も維持。

---

## 既知の問題

### iOS PWA で写真追加ができない
- iOS スタンドアロンモードで `change` イベントが発火しない
- 複数の方式（display:none, label wrap, position:fixed 等）で試したが未解決
- Safari 通常ブラウザ（非スタンドアロン）では動作する可能性あり

### プッシュ通知が届かない
- `upsert_push_subscription` RPC に型の曖昧さがあり登録に失敗する
- 修正方法：`p_subscription` の値を `JSON.stringify()` で文字列化して渡す
