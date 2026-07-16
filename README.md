# クイズひろば

家族で遊ぶ iPad 向けクイズ PWA。ひとりモードと、iPad をテーブル中央に置いて4人で囲む早押しモードがある。
クイズデータは Google Drive(`quizzes/ジャンル名/xxx.json`)に置き、GAS Web アプリ経由で配信する。

**セットアップと日々の運用 → [docs/運用手順書.md](docs/運用手順書.md)**

## 構成

| パス | 内容 |
|---|---|
| `src/` | Vite + React アプリ本体([App.jsx](src/App.jsx) が全UI、[useQuizData.js](src/useQuizData.js) が取得+オフラインキャッシュ) |
| `src/config.js` | GAS Web アプリの URL を設定する場所 |
| `public/sw.js` `public/manifest.webmanifest` | PWA(オフライン起動・ホーム画面追加) |
| `gas/Code.gs` | Google Apps Script(Drive を走査して JSON 配信) |
| `samples/` | クイズ JSON のサンプル(Drive に置く用) |
| `docs/運用手順書.md` | 親向けの運用手順書 |
| `.github/workflows/deploy.yml` | main への push でビルドして `gh-pages` ブランチへ自動デプロイ(Actions が使えなければ `npm run deploy` で手元からも可) |
| `quiz-app-prototype.jsx` | 元の UI プロトタイプ(参照用) |

## 開発

```bash
npm install
node scripts/generate-icons.mjs   # アイコン再生成(通常は不要。生成済み)
npm run dev                       # http://localhost:5173
npm run build && npm run preview  # 本番ビルドの確認
```

`src/config.js` の `GAS_URL` が空の場合、初回はエラー画面になる(localStorage にキャッシュがあればそれで動く)。
