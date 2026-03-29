# ヒビタン データフロー解説

各機能の処理がどのように流れるかを順番に説明する。

---

## 1. 起動〜自動ログインの流れ

1. `DOMContentLoaded` が発火
2. `localStorage` から `hibitan_user_id` を取得
3. スプラッシュ表示（最低 1.2 秒）と `get_user_by_id` RPC を**並列実行**
4. 両方完了後、スプラッシュをフェードアウト
5. `initUI()` で全イベントをバインド
6. RPC の結果にユーザーデータがあれば → `homeGamen` へ
7. なければ → `syokiGamen`（ログイン画面）へ

---

## 2. 新規登録の流れ

1. 名前・パスワード・目標・合言葉・意気込みを入力
2. 「登録」ボタン → `registerUser()`
3. `register_user` RPC を呼び出し
4. 成功 → `user` にセット、`localStorage` に ID 保存
5. `updateHome()` でホームの表示内容を更新
6. `renderCalendar()` でカレンダーを描画
7. `homeGamen` へ遷移

---

## 3. 今日の記録（recordToday）の流れ

```
「記録」ボタン押下
    ↓
今日の日付 = ISO文字列の先頭10文字（UTC）
    ↓
user.最終実施日 === today？
    ├─ YES かつ写真あり → フロー4（写真後付け）へ
    ├─ YES かつ写真なし → 「今日は記録済みです」で終了
    └─ NO → 以下へ続く
    ↓
写真があれば compressImage() → uploadPhoto() → Storage に保存 → URL 取得
    ↓
record_today RPC（p_id, p_pass, p_note, p_date, p_photo_url）
    ↓
成功 → user.連続日数++ / user.最終実施日 = today
    ↓
updateHome() → renderCalendar() → 入力フォームをリセット
```

**ポイント：** 記録は1日1回のみ。2回目以降は写真の後付け専用フローになる。

---

## 4. 写真投稿（記録後）の流れ

記録済みの日に写真を選んで「記録」ボタンを押したときの処理。

```
写真を選択 → handleFileSelect()
    ↓
FileReader で previewImg にプレビュー表示
    ↓
「記録」ボタン押下（user.最終実施日 === today）
    ↓
daily_records から photo_url を SELECT（当日分）
    ↓
photo_url が存在する？
    ├─ YES → 「今日の写真はすでに投稿済みです」で終了
    └─ NO → 以下へ続く
    ↓
compressImage()（最大 1920px、JPEG 82%）
    ↓
Storage に upload（パス: {userId}/{date}.jpg、upsert: true）
    ↓
update_daily_photo RPC（p_id, p_date, p_photo_url）
    ↓
成功 → フォームリセット → 「写真を投稿しました」
```

**ポイント：** Storage へのアップロードは成功するが、テーブルへの直接 UPDATE は RLS でブロックされるため RPC 経由で更新する。

---

## 5. スケジュール保存の流れ

```
「📅 今日の予定を記録」ボタン → initScheduleScreen()
    ↓
daily_records から schedule_data を SELECT（当日分）
    ↓
データがあれば addScheduleBlockRow() で各行を復元
なければ空行を1行追加
    ↓
ブロックを編集（時間選択すると隣のブロックと連動）
    ↓
「保存」ボタン → saveSchedule()
    ↓
getScheduleBlocks() でフォームの値を配列に変換
    ↓
バリデーション（終了 > 開始、重複チェック）
    ↓
upsert_schedule RPC（p_user_id, p_date, p_schedule）
    ↓
成功 → 前の画面に戻る
```

**テンプレ機能：**
- 「💾 テンプレ保存」→ `getScheduleBlocks()` の結果を `localStorage` に JSON 保存
- 「📋 テンプレ読み込み」→ localStorage から読み込み、`addScheduleBlockRow()` で復元

---

## 6. 仲間画面表示の流れ

```
「仲間」ボタン → showNakama(user.合言葉)
    ↓
get_nakama RPC（合言葉が一致するユーザーを取得）
    ↓
ログイン中のユーザーを先頭に並び替え
    ↓
以下の3クエリを Promise.all で並列実行：
    ├─ comments テーブル → 各ユーザーのコメント件数
    ├─ daily_records → 今日の photo_url
    └─ daily_records → 今日の schedule_data
    ↓
各ユーザーのカードを生成：
    ├─ 写真があれば「📷 今日の写真を見る」ボタン
    └─ スケジュールがあれば「📅」ボタン（クリック時に円グラフ描画）
    ↓
nakamanoYousu 画面を表示
```

**ポイント：** 3つのクエリを並列実行することで表示速度を確保している。

---

## 7. プッシュ通知 ON/OFF の流れ

### ON（enablePush）

```
「通知をONにする」ボタン
    ↓
Notification.requestPermission() で許可を求める
    ↓
navigator.serviceWorker.ready でSWを取得
    ↓
pushManager.subscribe()（VAPID 公開鍵を使用）
    ↓
subscription を JSON.stringify() して文字列化
    ↓
upsert_push_subscription RPC（p_user_id, p_subscription）
    ↓
成功 → 「通知を登録しました」
```

### OFF（disablePush）

```
「通知をOFFにする」ボタン
    ↓
pushManager.getSubscription() → subscription.unsubscribe()
    ↓
delete_push_subscription RPC（p_user_id）
    ↓
成功 → 「通知を解除しました」
```

**既知の問題：** `upsert_push_subscription` RPC に同名オーバーロードがあり型が曖昧になってエラーになる。`JSON.stringify()` で文字列化して渡すことで解決できる（未修正）。

---

## 8. テーマ変更の流れ

```
カラーボタン（.color-btn[data-theme]）をクリック
    ↓
applyTheme(key)
    ↓
THEMES[key] からカラーを取得
    ↓
document.documentElement.style.setProperty() で CSS 変数を書き換え：
    --main    メインカラー
    --soft    薄い背景色
    --accent  アクセントカラー
    ↓
localStorage.setItem('hibitan_theme', key) で保存
    ↓
画面全体が即時にテーマカラーへ変更
```

ログイン直後に `loadTheme()` が呼ばれ、`localStorage` のテーマを復元する。

---

## 操作とデータの書き込み先

| 操作 | 書き込み先 |
|------|-----------|
| 新規登録 | `hibitan` テーブル（RPC） |
| ログイン | なし（読み取りのみ） |
| 今日の記録 | `daily_records` テーブル（RPC） |
| 写真アップロード | Storage `photos` バケット + `daily_records.photo_url`（RPC） |
| スケジュール保存 | `daily_records.schedule_data`（RPC） |
| プロフィール更新 | `hibitan` テーブル（RPC） |
| コメント送信 | `comments` テーブル（直接 INSERT） |
| フィードバック送信 | `feedback` テーブル（直接 INSERT） |
| プッシュ通知登録 | `push_subscriptions` テーブル（RPC） |
| テーマ変更 | localStorage のみ |
| スケジュールテンプレ保存 | localStorage のみ |
