/**
 * ============================================================
 * クイズひろば — クイズ配信 GAS(Google Apps Script)
 * ============================================================
 *
 * Google Drive の以下の構成で置いた JSON ファイルを、
 * 1本の JSON にまとめて Web アプリとして配信する。
 *
 *   マイドライブ/
 *     quizzes/               ← ROOT_FOLDER_NAME
 *       いきもの/            ← サブフォルダ名がそのまま「ジャンル」になる
 *         doubutsu.json
 *         mushi.json
 *       うちゅう/
 *         wakusei.json
 *       さんすう/
 *         keisan1.json
 *
 * 各 JSON ファイルの中身(1ファイル = 1クイズ。配列で複数入れてもOK):
 * {
 *   "title": "どうぶつクイズ",
 *   "emoji": "🦒",
 *   "difficulty": 2,               ← 1〜3(★の数)。省略時は 1
 *   "createdAt": "2026-07-01",     ← 省略時はファイルの作成日を自動で使う
 *   "questions": [
 *     {
 *       "q": "問題文",
 *       "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
 *       "answer": 0,               ← 正解の番号(0はじまり。0=①, 1=②, …)
 *       "explanation": "解説文"
 *     }
 *   ]
 * }
 * ※ "category" はフォルダ名から自動で付くので書かなくてよい。
 *
 * デプロイ方法は docs/運用手順書.md を参照。
 */

// クイズを入れるフォルダの名前(マイドライブ直下に置く)
const ROOT_FOLDER_NAME = "quizzes";

// 結果を何秒キャッシュするか(この間はDriveを読み直さない)
// 新しいクイズを追加して「すぐ」反映させたいときは URL に ?refresh=1 を付ける
const CACHE_SECONDS = 300; // 5分

/**
 * Web アプリのエントリポイント。
 * GET https://script.google.com/macros/s/…/exec でクイズ一覧の JSON を返す。
 */
function doGet(e) {
  const forceRefresh = e && e.parameter && e.parameter.refresh === "1";
  const cache = CacheService.getScriptCache();

  let json = forceRefresh ? null : cache.get("quizzes");
  if (!json) {
    const result = buildQuizData_();
    json = JSON.stringify(result);
    // エラー時(クイズ0件)はキャッシュしない(修正がすぐ反映されるように)。
    // また CacheService の上限(約100KB)を超える場合もキャッシュしない
    if (result.quizzes.length > 0 && json.length < 90000) {
      cache.put("quizzes", json, CACHE_SECONDS);
    }
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Drive を走査してクイズ一覧を組み立てる。
 */
function buildQuizData_() {
  const quizzes = [];
  const errors = [];

  const root = findRootFolder_();
  if (!root) {
    return {
      generatedAt: new Date().toISOString(),
      quizzes: [],
      errors: ["フォルダ「" + ROOT_FOLDER_NAME + "」が見つかりません。マイドライブに作成してください。"],
    };
  }

  // サブフォルダ = ジャンル
  const genreFolders = root.getFolders();
  while (genreFolders.hasNext()) {
    const genreFolder = genreFolders.next();
    const category = genreFolder.getName();

    const files = genreFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      if (!name.toLowerCase().endsWith(".json")) continue; // JSON 以外は無視

      try {
        const parsed = JSON.parse(file.getBlob().getDataAsString("UTF-8"));
        // 1ファイルに配列で複数クイズ入れてもOK
        const items = Array.isArray(parsed) ? parsed : [parsed];

        items.forEach(function (item, i) {
          const check = validateQuiz_(item);
          if (check !== true) {
            errors.push(category + "/" + name + (items.length > 1 ? "(" + (i + 1) + "件目)" : "") + ": " + check);
            return;
          }
          quizzes.push({
            title: item.title,
            category: category, // フォルダ名で上書き(ファイル内の category は無視)
            emoji: item.emoji || "❓",
            difficulty: clampDifficulty_(item.difficulty),
            createdAt: item.createdAt || formatDate_(file.getDateCreated()),
            questions: item.questions,
          });
        });
      } catch (err) {
        errors.push(category + "/" + name + ": JSONとして読めません(" + err.message + ")");
      }
    }
  }

  // 新着順
  quizzes.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return {
    generatedAt: new Date().toISOString(),
    quizzes: quizzes,
    errors: errors, // 壊れたファイルの一覧(アプリ側は無視する。checkQuizzes で確認用)
  };
}

/**
 * ルートフォルダ(quizzes)を探す。
 * 完全一致で見つからない場合、名前の前後に空白が紛れ込んだフォルダ
 * (例:「quizzes 」)も救済して返す。
 */
function findRootFolder_() {
  const exact = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (exact.hasNext()) return exact.next();

  const fuzzy = DriveApp.searchFolders("title contains '" + ROOT_FOLDER_NAME + "'");
  while (fuzzy.hasNext()) {
    const f = fuzzy.next();
    if (f.getName().trim() === ROOT_FOLDER_NAME) return f;
  }
  return null;
}

/**
 * クイズ1件の形式チェック。OKなら true、NGなら理由の文字列を返す。
 */
function validateQuiz_(item) {
  if (!item || typeof item !== "object") return "オブジェクトではありません";
  if (typeof item.title !== "string" || !item.title) return "title がありません";
  if (!Array.isArray(item.questions) || item.questions.length === 0) return "questions が空です";
  for (let i = 0; i < item.questions.length; i++) {
    const q = item.questions[i];
    const label = "questions[" + (i + 1) + "問目]";
    if (!q || typeof q.q !== "string" || !q.q) return label + " の q(問題文)がありません";
    if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4)
      return label + " の choices は2〜4個にしてください";
    if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.choices.length)
      return label + " の answer が choices の範囲外です(0はじまりに注意)";
  }
  return true;
}

function clampDifficulty_(d) {
  const n = Number(d);
  if (!n || n < 1) return 1;
  if (n > 3) return 3;
  return Math.round(n);
}

function formatDate_(date) {
  return Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd");
}

/**
 * ============================================================
 * 動作確認用(GASエディタから実行する)
 * ============================================================
 * 実行 → ログ(表示 > ログ / Ctrl+Enter)に結果が出る。
 * 新しいクイズJSONを置いたあと、形式ミスがないかここで確認できる。
 */
function checkQuizzes() {
  const result = buildQuizData_();
  Logger.log("クイズ数: " + result.quizzes.length);
  result.quizzes.forEach(function (q) {
    Logger.log("  [" + q.category + "] " + q.title + " (" + q.questions.length + "問, ★" + q.difficulty + ", " + q.createdAt + ")");
  });
  if (result.errors.length > 0) {
    Logger.log("⚠ エラーのあるファイル:");
    result.errors.forEach(function (e) {
      Logger.log("  " + e);
    });
  } else {
    Logger.log("エラーなし ✓");
  }
}

/**
 * キャッシュを即クリアしたいとき(通常は5分待てばOK)
 */
function clearCache() {
  CacheService.getScriptCache().remove("quizzes");
  Logger.log("キャッシュをクリアしました");
}
