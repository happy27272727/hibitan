# 引継ぎ資料

## リポジトリ
- URL: https://github.com/happy27272727/hibitan.git
- ブランチ: `main`
- 最新コミット: `1fada6d`（デバッグコード込み・本番反映済み）

---

## 問題1: iOS PWA で写真追加ができない

### 症状
- PC: 正常動作
- iOS PWA スタンドアロンモード: `change` イベントが一切発火しない

### 診断済み内容
- ページリロードは発生していない（確認済み）
- PC では `change` イベントが正常発火する（確認済み）
- iOS では下記すべての方法で `change` が発火しない（確認済み）

| 方法 | iOS結果 |
|------|---------|
| `display:none` input + JS `.click()` | ファイルピッカーも開かない |
| input を label 内部にラップ | ピッカーは開くが change 発火しない |
| `label[for]` + `position:fixed` 画面外 | ピッカーは開くが change 発火しない |
| button + JS `.click()` + ビューポート内 input | change 発火しない |

### 次にやること
- iOSバージョンを確認（iOS 15以下はPWAスタンドアロンでファイル選択非対応）
- Safari通常ブラウザ（非スタンドアロン）で動作するか確認
- `capture="environment"` 属性を試す

---

## 問題2: プッシュ通知が届かない

### 症状
通知ONボタンを押すと以下のエラーが出てDBに登録されない。

```
通知の登録に失敗しました: Could not choose the best candidate function between:
public.upsert_push_subscription(p_user_id => bigint, p_subscription => text),
public.upsert_push_subscription(p_user_id => integer, p_subscription => jsonb)
```

### 原因
Supabase の `upsert_push_subscription` RPC に2つのオーバーロードがあり型が曖昧になっている。

### 修正方法
`lib/Hibitan.js` の `enablePush()` と `syncPushSubscription()` 内：

```javascript
// 変更前
p_subscription: subscription.toJSON()

// 変更後
p_subscription: JSON.stringify(subscription.toJSON())
```

---

## 現在本番に残っているデバッグコード（要削除）

`lib/Hibitan.js` の2箇所：

1. `DOMContentLoaded` 先頭
```javascript
alert('PAGE LOADED'); // ← 削除
```

2. `photoInput` の `change`/`input` ハンドラ内
```javascript
const dbg = document.createElement('div');
dbg.style.cssText = '...';
dbg.textContent = 'change: ' + ...;
document.body.appendChild(dbg);
setTimeout(() => dbg.remove(), 4000);
// ↑ この4行を削除
```

削除後にコミット・push すること。

---

## セッション開始前の状態に戻す場合

```bash
git reset --hard 0ac08a0
git push --force
```
