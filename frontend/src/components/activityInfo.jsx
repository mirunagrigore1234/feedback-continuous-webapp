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

function getTs(f) {
  return new Date(f.Timestamp || f.timestamp || f.createdAt || f.created_at).getTime();
}

function getKey(f) {
  const id = f.Id || f.id;
  if (id != null) return `id:${id}`;
  return `t:${getTs(f)}|e:${(f.Emotion || f.emotion || "").toLowerCase()}`;
}

export default function ActivityInfo() {
  const nav = useNavigate();
  const { id } = useParams();
  const cacheKey = `classpulse_feedback_activity_${id}`;

  const [activity, setActivity] = useState(null);
  const [feedback, setFeedback] = useState(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;

    async function loadActivity() {
      try {
        const a = await activityService.getActivityById(id);
        if (!stop) setActivity(a);
      } catch {}
    }

    function saveCache(list) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch {}
    }

    function mergeDedup(prev, next) {
      const map = new Map();
      for (const f of prev) map.set(getKey(f), f);
      for (const f of next) map.set(getKey(f), f);
      return Array.from(map.values()).sort((a, b) => getTs(b) - getTs(a));
    }

    async function pollFeedback() {
      try {
        const list = await feedbackService.getFeedbacksByActivity(id);
        if (stop) return;
        if (Array.isArray(list) && list.length > 0) {
          setFeedback((prev) => {
            const merged = mergeDedup(prev, list);
            saveCache(merged);
            return merged;
          });
          setError("");
        } else {
          setError("");
        }
      } catch {
        if (!stop) setError("Cannot load feedback (showing last known results).");
      }
    }

    loadActivity();
    pollFeedback();
    const t = setInterval(pollFeedback, 2000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id]);

  const stats = useMemo(() => {
    const now = Date.now();
    const relevant = feedback.filter((f) => now - getTs(f) <= 15 * 60 * 1000);
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
  }, [feedback]);

  const feed = useMemo(() => {
    return [...feedback].sort((a, b) => getTs(b) - getTs(a)).slice(0, 8);
  }, [feedback]);

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
      <aside className="aSide">
        <div className="aBrand">
          <div className="aLogo">🎓</div>
          <b>ClassPulse</b>
        </div>
        <button className="aNewBtn" onClick={() => nav("/professor/dashboard")}>
          ＋ Create New Session
        </button>
      </aside>

      <main className="aMain">
        <div className="aHeader">
          <h1 className="aTitle">{title}</h1>
          <div className="aMeta">
            <span>
              🔑 Code: <b>{code || "—"}</b>
            </span>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

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

        <div className="aBottomGrid">
          <section className="aCard">
            <div className="aCardTitle">Live Sentiment Timeline</div>
            <div className="mutedSmall">Real-time student reactions over the last 15 minutes</div>
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
                      <div className="aFeedSub">Reacted <b>"{emo}"</b></div>
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
