import React, { useState, useCallback } from "react";

// ============================================================
// クイズデータ(サンプル)
// 本番では GAS の URL から fetch して同じ形式の JSON を読み込む
// ============================================================
const QUIZ_DATA = [
  {
    title: "どうぶつクイズ",
    category: "いきもの",
    emoji: "🦒",
    difficulty: 2,
    createdAt: "2026-07-01",
    questions: [
      {
        q: "キリンの首の骨の数は、人間と比べてどう?",
        choices: ["同じ7個", "2倍の14個", "10倍の70個", "骨はない"],
        answer: 0,
        explanation: "キリンも人間も首の骨は7個。1個ずつがとても長い。",
      },
      {
        q: "タコの心臓はいくつある?",
        choices: ["1個", "2個", "3個", "8個"],
        answer: 2,
        explanation: "タコの心臓は3個。全身用1個とエラ用2個。",
      },
      {
        q: "ペンギンがいちばん多く住んでいる場所は?",
        choices: ["北極", "南半球", "赤道", "日本"],
        answer: 1,
        explanation: "ペンギンは南半球の生き物。北極にはいない。",
      },
      {
        q: "カタツムリの歯の数はどれくらい?",
        choices: ["0本", "32本", "約100本", "1万本以上"],
        answer: 3,
        explanation: "カタツムリには「歯舌」という歯が1万本以上ある。",
      },
    ],
  },
  {
    title: "うちゅうクイズ",
    category: "うちゅう",
    emoji: "🚀",
    difficulty: 3,
    createdAt: "2026-07-14",
    questions: [
      {
        q: "太陽系でいちばん大きい惑星は?",
        choices: ["地球", "土星", "木星", "海王星"],
        answer: 2,
        explanation: "木星は地球の約11倍の直径がある。",
      },
      {
        q: "月まで歩いて行くと、およそ何年かかる?(時速4km・休みなし)",
        choices: ["約1年", "約11年", "約110年", "約1100年"],
        answer: 1,
        explanation: "月まで約38万km。時速4kmだと約11年かかる計算。",
      },
      {
        q: "宇宙で音はどうなる?",
        choices: ["よく聞こえる", "小さく聞こえる", "聞こえない", "高く聞こえる"],
        answer: 2,
        explanation: "宇宙はほぼ真空なので、音を伝える空気がなく聞こえない。",
      },
      {
        q: "国際宇宙ステーション(ISS)は地球を1周するのに何分かかる?",
        choices: ["約9分", "約90分", "約9時間", "約9日"],
        answer: 1,
        explanation: "ISSは秒速約7.7kmで飛んでいて、約90分で地球を1周する。",
      },
    ],
  },
  {
    title: "けいさんチャレンジ",
    category: "さんすう",
    emoji: "➗",
    difficulty: 1,
    createdAt: "2026-07-16",
    questions: [
      {
        q: "48 ÷ 6 は?",
        choices: ["6", "7", "8", "9"],
        answer: 2,
        explanation: "6 × 8 = 48 だから、48 ÷ 6 = 8。",
      },
      {
        q: "1000円持って、350円のジュースを2本買った。おつりは?",
        choices: ["650円", "300円", "350円", "400円"],
        answer: 1,
        explanation: "350 × 2 = 700円。1000 − 700 = 300円。",
      },
      {
        q: "正方形の1辺が7cmのとき、まわりの長さは?",
        choices: ["14cm", "21cm", "28cm", "49cm"],
        answer: 2,
        explanation: "正方形の辺は4本。7 × 4 = 28cm。",
      },
    ],
  },
];

// 「NEW!」バッジを付ける日数
const NEW_DAYS = 7;
const isNew = (createdAt) => {
  if (!createdAt) return false;
  const diff = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  return diff >= 0 && diff <= NEW_DAYS;
};

// ============================================================
// プレイヤー設定
// ============================================================
const PLAYERS = [
  { id: 0, name: "プレイヤー1", color: "#FF5D6C", dark: "#8f2130", corner: "tl", flip: true },
  { id: 1, name: "プレイヤー2", color: "#4DA3FF", dark: "#1c4d8f", corner: "tr", flip: true },
  { id: 2, name: "プレイヤー3", color: "#FFC24D", dark: "#8a6410", corner: "bl", flip: false },
  { id: 3, name: "プレイヤー4", color: "#4DE08A", dark: "#1a7a48", corner: "br", flip: false },
];

const FONT = `"Hiragino Maru Gothic ProN", "BIZ UDGothic", "Yu Gothic", sans-serif`;
const CIRCLED = ["①", "②", "③", "④"];

// ============================================================
// 共通スタイル
// ============================================================
const S = {
  root: {
    fontFamily: FONT,
    background: "#191A33",
    color: "#F4F5FF",
    minHeight: "100vh",
    width: "100%",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    overflow: "hidden",
    position: "relative",
  },
  bigBtn: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 700,
    padding: "18px 36px",
    borderRadius: 18,
    border: "none",
    cursor: "pointer",
    color: "#191A33",
    background: "#F4F5FF",
  },
};

// ============================================================
// ホーム画面
// ============================================================
function Home({ onSelect }) {
  return (
    <div style={{ ...S.root, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
      <div style={{ fontSize: 15, letterSpacing: 6, color: "#8B8DBB" }}>QUIZ ARENA</div>
      <h1 style={{ fontSize: 44, margin: 0, fontWeight: 800 }}>クイズひろば</h1>
      <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          style={{ ...S.bigBtn, background: "#4DA3FF", color: "#fff", minWidth: 220 }}
          onClick={() => onSelect("solo")}
        >
          ひとりで挑戦
        </button>
        <button
          style={{ ...S.bigBtn, background: "#FF5D6C", color: "#fff", minWidth: 220 }}
          onClick={() => onSelect("buzzer")}
        >
          みんなで早押し
        </button>
      </div>
      <div style={{ color: "#8B8DBB", fontSize: 14, marginTop: 8 }}>
        早押しは iPad をテーブルの真ん中に置いて、4人で囲んで遊ぼう
      </div>
    </div>
  );
}

// ============================================================
// クイズ選択画面
// ============================================================
function QuizSelect({ mode, onPick, onBack }) {
  // ジャンル一覧はデータから自動生成(=Driveのフォルダがそのまま増える)
  const categories = Array.from(new Set(QUIZ_DATA.map((q) => q.category)));

  // ジャンルごとに「出すレベル」を個別にON/OFF(初期値: すべてON)
  const [filters, setFilters] = useState(() => {
    const f = {};
    categories.forEach((c) => (f[c] = { 1: true, 2: true, 3: true }));
    return f;
  });

  const toggleLevel = (cat, lv) =>
    setFilters((prev) => ({ ...prev, [cat]: { ...prev[cat], [lv]: !prev[cat][lv] } }));

  // フィルタパネルの開閉(普段は閉じて一覧を主役に)
  const [filterOpen, setFilterOpen] = useState(false);

  // 一括ON/OFF
  const setAll = (v) =>
    setFilters(() => {
      const f = {};
      categories.forEach((c) => (f[c] = { 1: v, 2: v, 3: v }));
      return f;
    });

  // 要約テキスト(閉じている時に現在の状態がわかるように)
  const totalCells = categories.length * 3;
  const onCells = categories.reduce((n, c) => n + [1, 2, 3].filter((lv) => filters[c]?.[lv]).length, 0);
  const filterSummary =
    onCells === totalCells ? "すべて表示中" : onCells === 0 ? "すべてOFF(なにも表示されないよ)" : `しぼりこみ中(${categories.filter((c) => filters[c][1] || filters[c][2] || filters[c][3]).length}/${categories.length}ジャンル)`;

  const bulkBtnStyle = {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 700,
    padding: "8px 18px",
    borderRadius: 999,
    border: "2px solid #34366B",
    background: "transparent",
    color: "#B9BBE0",
    cursor: "pointer",
  };

  // ジャンル名タップで、そのジャンルを一括ON/OFF
  const toggleGenre = (cat) =>
    setFilters((prev) => {
      const anyOn = prev[cat][1] || prev[cat][2] || prev[cat][3];
      const v = !anyOn;
      return { ...prev, [cat]: { 1: v, 2: v, 3: v } };
    });

  // 新着順に並べ、(ジャンル, レベル) の組がONのものだけ表示(元の index を保持)
  const list = QUIZ_DATA.map((quiz, index) => ({ quiz, index }))
    .filter(({ quiz }) => filters[quiz.category]?.[quiz.difficulty || 1])
    .sort((a, b) => new Date(b.quiz.createdAt || 0) - new Date(a.quiz.createdAt || 0));

  const modeLabel = mode === "solo" ? "ひとりで挑戦" : "みんなで早押し";
  const modeColor = mode === "solo" ? "#4DA3FF" : "#FF5D6C";

  return (
    <div style={{ ...S.root, padding: "28px 36px", boxSizing: "border-box", overflowY: "auto", height: "100vh" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h2 style={{ fontSize: 30, margin: 0, fontWeight: 800 }}>クイズをえらぶ</h2>
          <span style={{ fontSize: 15, fontWeight: 700, color: modeColor, border: `2px solid ${modeColor}`, borderRadius: 999, padding: "3px 14px" }}>
            {modeLabel}
          </span>
        </div>
        <button
          style={{ background: "none", border: "none", color: "#8B8DBB", fontSize: 16, cursor: "pointer", fontFamily: FONT }}
          onClick={onBack}
        >
          ← もどる
        </button>
      </div>

      {/* ジャンル × レベル フィルタ(折りたたみ式) */}
      <div style={{ background: "#1F2040", border: "2px solid #2B2C58", borderRadius: 18, marginBottom: 24, overflow: "hidden" }}>
        {/* 要約バー(常時表示) */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          style={{
            fontFamily: FONT,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            border: "none",
            color: "#F4F5FF",
            padding: "14px 18px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <span>
            🔍 しぼりこみ
            <span style={{ color: "#8B8DBB", fontWeight: 400, marginLeft: 10, fontSize: 14 }}>{filterSummary}</span>
          </span>
          <span style={{ color: "#8B8DBB" }}>{filterOpen ? "▲ とじる" : "▼ ひらく"}</span>
        </button>

        {filterOpen && (
          <div style={{ padding: "0 18px 14px" }}>
            {/* 一括操作 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button style={bulkBtnStyle} onClick={() => setAll(true)}>ぜんぶON</button>
              <button style={bulkBtnStyle} onClick={() => setAll(false)}>ぜんぶOFF</button>
              <span style={{ fontSize: 13, color: "#565880", alignSelf: "center" }}>
                ジャンル名タップで行ごとON/OFF
              </span>
            </div>
            {/* ジャンル行(多くなったらスクロール) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 8,
                maxHeight: 260,
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
          {categories.map((cat) => {
            const f = filters[cat];
            const anyOn = f[1] || f[2] || f[3];
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => toggleGenre(cat)}
                  style={{
                    fontFamily: FONT,
                    fontSize: 17,
                    fontWeight: 700,
                    minWidth: 130,
                    textAlign: "left",
                    padding: "8px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: "transparent",
                    color: anyOn ? "#F4F5FF" : "#565880",
                    cursor: "pointer",
                    textDecoration: anyOn ? "none" : "line-through",
                  }}
                >
                  {cat}
                </button>
                {[1, 2, 3].map((lv) => {
                  const on = f[lv];
                  return (
                    <button
                      key={lv}
                      onClick={() => toggleLevel(cat, lv)}
                      style={{
                        fontFamily: FONT,
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: 1,
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: on ? "2px solid #FFC24D" : "2px solid #34366B",
                        background: on ? "rgba(255,194,77,0.15)" : "transparent",
                        color: on ? "#FFC24D" : "#565880",
                        cursor: "pointer",
                      }}
                    >
                      {"★".repeat(lv)}
                    </button>
                  );
                })}
              </div>
            );
          })}
            </div>
          </div>
        )}
      </div>

      {/* クイズカード */}
      {list.length === 0 ? (
        <div style={{ color: "#8B8DBB", fontSize: 18, textAlign: "center", marginTop: 60 }}>
          この条件のクイズはまだないよ。おうちの人にリクエストしよう!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
          {list.map(({ quiz, index }) => (
            <button
              key={index}
              onClick={() => onPick(index)}
              style={{
                fontFamily: FONT,
                textAlign: "left",
                background: "#23244A",
                border: "2px solid #34366B",
                borderRadius: 20,
                padding: 20,
                cursor: "pointer",
                color: "#F4F5FF",
                position: "relative",
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {isNew(quiz.createdAt) && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 12,
                    background: "#FF5D6C",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "3px 12px",
                  }}
                >
                  NEW!
                </span>
              )}
              <div style={{ fontSize: 40, lineHeight: 1 }}>{quiz.emoji || "❓"}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>{quiz.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 14, color: "#B9BBE0" }}>
                  <span>{quiz.questions.length}問</span>
                  <span style={{ color: "#FFC24D", letterSpacing: 2 }}>
                    {"★".repeat(quiz.difficulty || 1)}
                    <span style={{ color: "#34366B" }}>{"★".repeat(Math.max(0, 3 - (quiz.difficulty || 1)))}</span>
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#565880", marginTop: 4 }}>{quiz.category}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ひとりモード
// ============================================================
function SoloMode({ quiz, onExit }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = quiz.questions[idx];

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= quiz.questions.length) setDone(true);
    else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  if (done) {
    return (
      <div style={{ ...S.root, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ fontSize: 22, color: "#8B8DBB" }}>けっか</div>
        <div style={{ fontSize: 56, fontWeight: 800 }}>
          {score} / {quiz.questions.length} 問正解
        </div>
        <div style={{ fontSize: 26 }}>
          {score === quiz.questions.length ? "パーフェクト!すごい!" : score >= quiz.questions.length / 2 ? "いいちょうし!" : "つぎはリベンジだ!"}
        </div>
        <button style={S.bigBtn} onClick={onExit}>ホームにもどる</button>
      </div>
    );
  }

  return (
    <div style={{ ...S.root, display: "flex", flexDirection: "column", padding: 28, boxSizing: "border-box", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#8B8DBB", fontSize: 15 }}>
        <span>{quiz.title} — 第{idx + 1}問 / {quiz.questions.length}問</span>
        <span>正解 {score}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.5, flexShrink: 0 }}>{q.q}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 6 }}>
        {q.choices.map((c, i) => {
          let bg = "#23244A";
          if (picked !== null) {
            if (i === q.answer) bg = "#1a7a48";
            else if (i === picked) bg = "#8f2130";
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              style={{
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 700,
                color: "#F4F5FF",
                background: bg,
                border: "2px solid #34366B",
                borderRadius: 16,
                padding: "22px 18px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {CIRCLED[i]} {c}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div style={{ background: "#23244A", borderRadius: 16, padding: 18, fontSize: 18, lineHeight: 1.6 }}>
          <b>{picked === q.answer ? "正解!" : `ざんねん… 答えは ${CIRCLED[q.answer]}`}</b>
          <div style={{ color: "#B9BBE0", marginTop: 6 }}>{q.explanation}</div>
          <button style={{ ...S.bigBtn, marginTop: 12, fontSize: 18, padding: "12px 28px" }} onClick={next}>
            {idx + 1 >= quiz.questions.length ? "けっかを見る" : "つぎの問題 →"}
          </button>
        </div>
      )}
      <button
        style={{ position: "absolute", top: 10, right: 14, background: "none", border: "none", color: "#8B8DBB", fontSize: 14, cursor: "pointer", fontFamily: FONT }}
        onClick={onExit}
      >
        やめる ✕
      </button>
    </div>
  );
}

// ============================================================
// 早押しモード
// ============================================================
function BuzzerMode({ quiz, onExit }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("open"); // open | answering | reveal | flash
  const [buzzed, setBuzzed] = useState(null); // player id
  const [lockedOut, setLockedOut] = useState([]); // player ids wrong this question
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [lastResult, setLastResult] = useState(null); // {pid, correct}
  const [done, setDone] = useState(false);

  const q = quiz.questions[idx];

  const buzz = useCallback(
    (pid) => {
      if (phase !== "open" || lockedOut.includes(pid)) return;
      setBuzzed(pid);
      setPhase("flash");
      setTimeout(() => setPhase("answering"), 700);
    },
    [phase, lockedOut]
  );

  const answer = (choiceIdx) => {
    if (phase !== "answering") return;
    const correct = choiceIdx === q.answer;
    setLastResult({ pid: buzzed, correct });
    if (correct) {
      setScores((s) => s.map((v, i) => (i === buzzed ? v + 10 : v)));
      setPhase("reveal");
    } else {
      const newLocked = [...lockedOut, buzzed];
      setLockedOut(newLocked);
      setBuzzed(null);
      if (newLocked.length >= PLAYERS.length) {
        setPhase("reveal"); // 全員ミス → 答えを公開
      } else {
        setPhase("open"); // バズ権が残りの人に戻る
      }
    }
  };

  const next = () => {
    if (idx + 1 >= quiz.questions.length) {
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setPhase("open");
    setBuzzed(null);
    setLockedOut([]);
    setLastResult(null);
  };

  // ---------- 結果画面 ----------
  if (done) {
    const ranked = PLAYERS.map((p) => ({ ...p, score: scores[p.id] })).sort((a, b) => b.score - a.score);
    return (
      <div style={{ ...S.root, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 22, color: "#8B8DBB" }}>けっか発表</div>
        {ranked.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: i === 0 ? 34 : 24, fontWeight: i === 0 ? 800 : 600 }}>
            <span>{i === 0 ? "👑" : `${i + 1}位`}</span>
            <span style={{ color: p.color }}>{p.name}</span>
            <span>{p.score}点</span>
          </div>
        ))}
        <button style={{ ...S.bigBtn, marginTop: 16 }} onClick={onExit}>ホームにもどる</button>
      </div>
    );
  }

  const buzzedPlayer = buzzed !== null ? PLAYERS[buzzed] : null;

  // ---------- バズ直後のフラッシュ ----------
  if (phase === "flash" && buzzedPlayer) {
    return (
      <div style={{ ...S.root, background: buzzedPlayer.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#fff", transform: buzzedPlayer.flip ? "rotate(180deg)" : "none" }}>
          {buzzedPlayer.name}!
        </div>
      </div>
    );
  }

  // ---------- 回答パッド(押した人の側に表示) ----------
  const answerPad = buzzedPlayer && phase === "answering" && (
    <div
      style={{
        position: "absolute",
        left: "50%",
        [buzzedPlayer.flip ? "top" : "bottom"]: 90,
        transform: `translateX(-50%) ${buzzedPlayer.flip ? "rotate(180deg)" : ""}`,
        display: "flex",
        gap: 14,
        background: "rgba(0,0,0,0.35)",
        padding: 14,
        borderRadius: 20,
        border: `3px solid ${buzzedPlayer.color}`,
        zIndex: 5,
      }}
    >
      {q.choices.map((_, i) => (
        <button
          key={i}
          onTouchStart={(e) => { e.preventDefault(); answer(i); }}
          onClick={() => answer(i)}
          style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            border: "none",
            background: buzzedPlayer.color,
            color: "#fff",
            fontSize: 34,
            fontWeight: 800,
            fontFamily: FONT,
            cursor: "pointer",
          }}
        >
          {CIRCLED[i]}
        </button>
      ))}
    </div>
  );

  // ---------- コーナーの早押しボタン ----------
  const cornerPos = { tl: { top: 14, left: 14 }, tr: { top: 14, right: 14 }, bl: { bottom: 14, left: 14 }, br: { bottom: 14, right: 14 } };
  const buzzButtons = PLAYERS.map((p) => {
    const isLocked = lockedOut.includes(p.id) || phase !== "open";
    return (
      <div key={p.id} style={{ position: "absolute", ...cornerPos[p.corner], transform: p.flip ? "rotate(180deg)" : "none", zIndex: 4, textAlign: "center" }}>
        <button
          onTouchStart={(e) => { e.preventDefault(); buzz(p.id); }}
          onClick={() => buzz(p.id)}
          disabled={isLocked}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: `5px solid ${isLocked ? "#34366B" : "#fff"}`,
            background: lockedOut.includes(p.id) ? "#34366B" : p.color,
            opacity: phase === "open" && !lockedOut.includes(p.id) ? 1 : 0.45,
            color: "#fff",
            fontSize: 20,
            fontWeight: 800,
            fontFamily: FONT,
            cursor: "pointer",
            boxShadow: phase === "open" && !lockedOut.includes(p.id) ? `0 0 24px ${p.color}` : "none",
          }}
        >
          {lockedOut.includes(p.id) ? "✕" : "PUSH"}
        </button>
        <div style={{ marginTop: 6, fontSize: 14, color: p.color, fontWeight: 700 }}>
          {p.name} <span style={{ color: "#F4F5FF" }}>{scores[p.id]}点</span>
        </div>
      </div>
    );
  });

  // ---------- 中央: 問題表示 ----------
  const centerContent =
    phase === "reveal" ? (
      <div style={{ textAlign: "center", maxWidth: 640 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: lastResult?.correct ? "#4DE08A" : "#FF5D6C" }}>
          {lastResult?.correct ? `${PLAYERS[lastResult.pid].name} 正解! +10点` : "全員ミス…"}
        </div>
        <div style={{ fontSize: 22, marginTop: 10 }}>
          答え: {CIRCLED[q.answer]} {q.choices[q.answer]}
        </div>
        <div style={{ fontSize: 17, color: "#B9BBE0", marginTop: 8, lineHeight: 1.6 }}>{q.explanation}</div>
        <button style={{ ...S.bigBtn, marginTop: 14, fontSize: 18, padding: "12px 28px" }} onClick={next}>
          {idx + 1 >= quiz.questions.length ? "けっか発表 →" : "つぎの問題 →"}
        </button>
      </div>
    ) : (
      <div style={{ textAlign: "center", maxWidth: 660 }}>
        <div style={{ fontSize: 15, color: "#8B8DBB" }}>
          第{idx + 1}問 / {quiz.questions.length}問
          {phase === "answering" && buzzedPlayer && (
            <span style={{ color: buzzedPlayer.color, fontWeight: 700 }}> — {buzzedPlayer.name} が回答中</span>
          )}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.5, margin: "12px 0" }}>{q.q}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left" }}>
          {q.choices.map((c, i) => (
            <div key={i} style={{ background: "#23244A", borderRadius: 12, padding: "12px 16px", fontSize: 19, fontWeight: 600 }}>
              {CIRCLED[i]} {c}
            </div>
          ))}
        </div>
        {phase === "open" && <div style={{ marginTop: 12, color: "#8B8DBB", fontSize: 15 }}>わかったら自分のボタンを押せ!</div>}
      </div>
    );

  return (
    <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", padding: "150px 160px", boxSizing: "border-box", minHeight: "100vh" }}>
      {centerContent}
      {buzzButtons}
      {answerPad}
      <button
        style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", background: "none", border: "none", color: "#565880", fontSize: 13, cursor: "pointer", fontFamily: FONT, writingMode: "vertical-rl" }}
        onClick={onExit}
      >
        やめる ✕
      </button>
    </div>
  );
}

// ============================================================
// アプリ本体
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("home"); // home | select | play
  const [mode, setMode] = useState(null); // solo | buzzer
  const [quizIdx, setQuizIdx] = useState(0);

  if (screen === "home") {
    return (
      <Home
        onSelect={(m) => {
          setMode(m);
          setScreen("select");
        }}
      />
    );
  }

  if (screen === "select") {
    return (
      <QuizSelect
        mode={mode}
        onPick={(i) => {
          setQuizIdx(i);
          setScreen("play");
        }}
        onBack={() => setScreen("home")}
      />
    );
  }

  const quiz = QUIZ_DATA[quizIdx];
  const exit = () => setScreen("home");

  return mode === "solo" ? <SoloMode quiz={quiz} onExit={exit} /> : <BuzzerMode quiz={quiz} onExit={exit} />;
}
