import { useEffect, useState } from "react";
import { GAS_URL } from "./config.js";

// localStorage に保存するキー(データ形式を変えたら数字を上げる)
const CACHE_KEY = "quiz-hiroba-data-v1";

// ============================================================
// クイズデータ取得フック
// - まず localStorage のキャッシュを即表示(オフラインでも遊べる)
// - 裏で GAS から最新を取得し、成功したら差し替え&キャッシュ更新
// 戻り値: { quizzes, status, error, reload }
//   status: "loading"(初回取得中) | "ready" | "error"(キャッシュも無く失敗)
// ============================================================
export function useQuizData() {
  const [quizzes, setQuizzes] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = () => {
    setStatus("loading");
    setError(null);
    setReloadCount((n) => n + 1);
  };

  useEffect(() => {
    let cancelled = false;

    // 1. キャッシュがあれば先に表示
    let hasCache = false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached.quizzes) && cached.quizzes.length > 0) {
          setQuizzes(cached.quizzes);
          setStatus("ready");
          hasCache = true;
        }
      }
    } catch {
      // 壊れたキャッシュは無視
    }

    // 2. GAS から最新を取得
    if (!GAS_URL) {
      if (!hasCache) {
        setStatus("error");
        setError("GASのURLが設定されていません(src/config.js の GAS_URL を設定してください)");
      }
      return;
    }

    (async () => {
      try {
        const res = await fetch(GAS_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // GAS は { quizzes: [...] } を返す。素の配列でも受け付ける
        const list = Array.isArray(data) ? data : data.quizzes;
        if (!Array.isArray(list)) throw new Error("データの形式が正しくありません");
        // 最低限の妥当性チェック(壊れたクイズは除外)
        const valid = list.filter(
          (q) => q && typeof q.title === "string" && Array.isArray(q.questions) && q.questions.length > 0
        );
        if (valid.length === 0) throw new Error("クイズが1つもありません");
        if (cancelled) return;
        setQuizzes(valid);
        setStatus("ready");
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), quizzes: valid }));
      } catch (e) {
        if (cancelled) return;
        if (!hasCache) {
          setStatus("error");
          setError(String(e.message || e));
        }
        // キャッシュ表示中なら黙ってキャッシュのまま続行
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  return { quizzes, status, error, reload };
}
