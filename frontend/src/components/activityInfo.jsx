import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import feedbackService from "../services/feedbackService";
import activityService from "../services/activityService";

function timeAgo(ts) {
  const d = new Date(ts);
  const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

const EMOJI = {
  happy: "😄",
  surprised: "😮",
  confused: "🤔",
  sad: "😣"
};

// helper: ia timestamp sigur
function getTs(f) {
  return new Date(f.Timestamp || f.timestamp || f.createdAt || f.created_at).getTime();
}

// helper: normalizează un feedback pt dedup
function getKey(f) {
  // dacă ai ID în backend, folosește-l
  const id = f.Id || f.id;
  if (id != null) return `id:${id}`;
  // fallback: emoție + timestamp
  return `t:${getTs(f)}|e:${(f.Emotion || f.emotion || "").toLowerCase()}`;
}

export default function ActivityInfo() {
  const nav = useNavigate();
  const { id } = useParams();

  const cacheKey = `classpulse_feedback_activity_${id}`;

  const [activity, setActivity] = useState(null);

  // pornește din cache, ca să ai rapoarte și după end / refresh
  const [feedback, setFeedback] = useState(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
);

  const [error, setError] = useState("");
  const newestTs = useMemo(() => {
  if (!feedback.length) return 0;
  return Math.max(...feedback.map(getTs));
}, [feedback]);

const isEnded =
  (activity?.IsActive === false) ||
  (activity?.isActive === false) ||
  !!(activity?.EndedAt || activity?.endedAt) ||
  (newestTs > 0 && Date.now() - newestTs > 15 * 60 * 1000); // fallback frontend-only

  // polling
  useEffect(() => {
    let stop = false;

    async function loadActivity() {
      try {
        const a = await activityService.getActivityById(id);
        if (!stop) setActivity(a);
      } catch {
        // nu e fatal
      }
    }

    function saveCache(list) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {
        // ignore (storage full etc.)
      }
    }

    function mergeDedup(prev, next) {
      const map = new Map();
      // păstrează tot ce ai deja
      for (const f of prev) map.set(getKey(f), f);
      // adaugă ce vine nou
      for (const f of next) map.set(getKey(f), f);

      // sort desc după timp (pt feed)
      const merged = Array.from(map.values()).sort((a, b) => getTs(b) - getTs(a));
      return merged;
    }

    async function pollFeedback() {
      try {
        const list = await feedbackService.getFeedbacksByActivity(id);

        if (stop) return;

        // dacă backend întoarce listă goală după end, NU șterge ce aveai
        if (Array.isArray(list) && list.length > 0) {
          setFeedback((prev) => {
            const merged = mergeDedup(prev, list);
            saveCache(merged);
            return merged;
          });
          setError("");
        } else {
          // păstrează feedback-urile existente/cached
          setError("");
        }
      } catch {
        if (!stop) {
          // dacă API pică după end, tot păstrezi datele vechi
          setError("Cannot load feedback (showing last known results).");
        }
      }
    }

    loadActivity();
    pollFeedback();

    const t = setInterval(pollFeedback, 2000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id]); // cacheKey depinde de id, dar e derivat

  // calcule procentaje din ultimele 15 minute (live)
const stats = useMemo(() => {
  const now = Date.now();

  const relevant = isEnded
    ? feedback
    : feedback.filter((f) => now - getTs(f) <= 15 * 60 * 1000);

  const total = relevant.length || 1;
  const counts = { happy: 0, confused: 0, surprised: 0, sad: 0 };

  for (const f of relevant) {
    const e = (f.Emotion || f.emotion || "").toLowerCase();
    if (counts[e] !== undefined) counts[e]++;
  }

  const pct = (x) => Math.round((x * 100) / total);
  return {
    total: relevant.length,
    happy: pct(counts.happy),
    confused: pct(counts.confused),
    surprised: pct(counts.surprised),
    sad: pct(counts.sad)
  };
}, [feedback, isEnded]);

  // feed: ultimele 8 (desc)
  const feed = useMemo(() => {
    return [...feedback]
      .sort((a, b) => getTs(b) - getTs(a))
      .slice(0, 8);
  }, [feedback]);

  // timeline: ultimele 15 min în 15 bucket-uri
  const series = useMemo(() => {
    const buckets = Array.from({ length: 15 }, () => ({
      happy: 0, confused: 0, surprised: 0, sad: 0, total: 0
    }));

    const now = Date.now();

    for (const f of feedback) {
      const ts = getTs(f);
      const diffMin = Math.floor((now - ts) / 60000);
      if (diffMin < 0 || diffMin > 14) continue;

      const idx = 14 - diffMin;
      const e = (f.Emotion || f.emotion || "").toLowerCase();
      if (buckets[idx] && buckets[idx][e] !== undefined) buckets[idx][e]++;
      buckets[idx].total++;
    }

    return buckets.map((b) => {
      const t = b.total || 1;
      return {
        happy: b.happy / t,
        surprised: b.surprised / t,
        confused: b.confused / t,
        sad: b.sad / t
      };
    });
  }, [feedback]);

  const title = activity?.Title ?? activity?.title ?? "Activity";
  const code = activity?.AccessCode ?? activity?.access_code ?? "";

  return (
    <div className="aWrap">
      {/* Sidebar */}
      <aside className="aSide">
        <div className="aBrand">
          <div className="aLogo">🎓</div>
          <b>ClassPulse</b>
        </div>

        <div className="aSectionTitle">MY COURSES</div>
        <div className="aCourse">Intro to Psychology 101</div>
        <div className="aCourse">Advanced Data Structures</div>

        <div className="aSectionTitle" style={{ marginTop: 18 }}>ACTIVE SESSION</div>
        <div className="aActiveCard">
          <div className="aPlay">▶</div>
          <div>
            <div className="aActiveTitle">Week 4: CBT</div>
            <div className="aActiveSub">Live Recording</div>
          </div>
        </div>

        <button className="aNewBtn" onClick={() => nav("/professor/dashboard")}>
          ＋ Create New Session
        </button>

        <div className="aSideBottom">
          <button className="aSideLink">Settings</button>
          <button className="aSideLink">Support</button>
        </div>
      </aside>

      {/* Main */}
      <main className="aMain">
        <div className="aTop">
          <div className="aSearchWrap">
            <span className="aSearchIcon">🔎</span>
            <input className="aSearch" placeholder="Search courses..." />
          </div>

          <div className="aTopRight">
            <button className="aIconBtn">🔔</button>
            <div className="aProfile">
              <div className="aProfText">
                <div className="aProfName">Dr. Sarah Miller</div>
                <div className="aProfRole">Professor</div>
              </div>
              <div className="aAvatar">👩‍🏫</div>
            </div>
          </div>
        </div>

        <div className="aHeader">
  <div className="aLiveRow">
    <span className="aLivePill">
      {isEnded ? "ENDED" : "LIVE"}
    </span>
    <span className="aElapsed">
      · {isEnded ? "session" : "last 15 min"}
    </span>
  </div>

  <h1 className="aTitle">{title}</h1>

  <div className="aMeta">
    <span>
      🔑 Code: <b>{code || "—"}</b>
    </span>
    <span className="aDotSep">•</span>
    <span>
      👥 {stats.total} reactions ({isEnded ? "session" : "last 15 min"})
    </span>
  </div>

  <div className="aHeaderActions">
    <button className="aSmallBtn">⏸</button>
    <button className="aSmallBtn">⬇</button>
    <button className="aEndBtn">⛔ End Session</button>
  </div>
</div>
        {error && <div className="errorBox">{error}</div>}

        {/* Stat cards */}
        <div className="aStatGrid">
          <div className="aStatCard blue">
            <div className="aStatTop">
              <span className="aStatLabel">UNDERSTANDING</span>
              <span className="aMiniEmoji">😄</span>
            </div>
            <div className="aStatValue">{stats.happy}%</div>
          </div>

          <div className="aStatCard purple">
            <div className="aStatTop">
              <span className="aStatLabel">CONFUSED</span>
              <span className="aMiniEmoji">🤔</span>
            </div>
            <div className="aStatValue">{stats.confused}%</div>
          </div>

          <div className="aStatCard yellow">
            <div className="aStatTop">
              <span className="aStatLabel">SURPRISED</span>
              <span className="aMiniEmoji">😮</span>
            </div>
            <div className="aStatValue">{stats.surprised}%</div>
          </div>

          <div className="aStatCard red">
            <div className="aStatTop">
              <span className="aStatLabel">LOST</span>
              <span className="aMiniEmoji">😣</span>
            </div>
            <div className="aStatValue">{stats.sad}%</div>
          </div>
        </div>

        {/* Timeline + Feed */}
        <div className="aBottomGrid">
          <section className="aCard">
            <div className="aCardTitle">Live Sentiment Timeline</div>
            <div className="mutedSmall">
              Real-time student reactions over the last 15 minutes
            </div>

            <div className="aLegend">
              <span><i className="legDot blueDot" /> Happy</span>
              <span><i className="legDot yellowDot" /> Surprised</span>
              <span><i className="legDot purpleDot" /> Confused</span>
              <span><i className="legDot redDot" /> Lost</span>
            </div>

            <div className="aChart">
              {series.map((p, idx) => {
                const h1 = Math.round(p.happy * 100);
                const h2 = Math.round(p.surprised * 100);
                const h3 = Math.round(p.confused * 100);
                const h4 = Math.round(p.sad * 100);

                const max = Math.max(h1, h2, h3, h4);
                let cls = "blueBar";
                if (max === h2) cls = "yellowBar";
                else if (max === h3) cls = "purpleBar";
                else if (max === h4) cls = "redBar";

                return (
                  <div className="aCol" key={idx} title={`bucket ${idx + 1}`}>
                    <div className={`aBar ${cls}`} style={{ height: `${max}%` }} />
                  </div>
                );
              })}
            </div>

            <div className="aChartAxis">
              <span>14:45</span>
              <span>14:50</span>
              <span>14:55</span>
              <span>15:00 (NOW)</span>
            </div>
          </section>

          <section className="aCard">
            <div className="aFeedTop">
              <div>
                <div className="aCardTitle">Live Feed</div>
                <div className="mutedSmall">Latest reactions</div>
              </div>
              <span className="aGreenDot" />
            </div>

            <div className="aFeedList">
              {feed.map((f, i) => {
                const emo = (f.Emotion || f.emotion || "happy").toLowerCase();
                const ts = f.Timestamp || f.timestamp || f.createdAt;
                return (
                  <div className="aFeedRow" key={getKey(f) ?? i}>
                    <div className="aFeedEmoji">{EMOJI[emo] || "🙂"}</div>
                    <div className="aFeedText">
                      <div className="aFeedTitle">Anonymous Student</div>
                      <div className="aFeedSub">
                        Reacted <b>"{emo}"</b>
                      </div>
                    </div>
                    <div className="aFeedTime">{timeAgo(ts)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
