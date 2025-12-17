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

export default function ActivityInfo() {
  const nav = useNavigate();
  const { id } = useParams(); // activityId din URL

  const [activity, setActivity] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");

  // polling la 2 secunde
  useEffect(() => {
    let stop = false;

    async function load() {
      try {
        const a = await activityService.getActivityById(id);
        if (!stop) setActivity(a);
      } catch {
        // nu e fatal
      }
    }

    async function poll() {
      try {
        const list = await feedbackService.getFeedbacksByActivity(id);
        if (!stop) setFeedback(list);
      } catch {
        if (!stop) setError("Cannot load feedback (check backend route).");
      }
    }

    load();
    poll();

    const t = setInterval(poll, 2000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id]);

  // calcule procentaje din ultimele 15 minute
  const stats = useMemo(() => {
    const now = Date.now();
    const recent = feedback.filter((f) => {
      const ts = new Date(f.Timestamp || f.timestamp || f.createdAt).getTime();
      return now - ts <= 15 * 60 * 1000;
    });

    const total = recent.length || 1;
    const counts = { happy: 0, confused: 0, surprised: 0, sad: 0 };

    for (const f of recent) {
      const e = (f.Emotion || f.emotion || "").toLowerCase();
      if (counts[e] !== undefined) counts[e]++;
    }

    const pct = (x) => Math.round((x * 100) / total);
    return {
      total: recent.length,
      happy: pct(counts.happy),
      confused: pct(counts.confused),
      surprised: pct(counts.surprised),
      sad: pct(counts.sad)
    };
  }, [feedback]);

  // feed: ultimele 8 (desc)
  const feed = useMemo(() => {
    const sorted = [...feedback].sort((a, b) => {
      const ta = new Date(a.Timestamp || a.timestamp || a.createdAt).getTime();
      const tb = new Date(b.Timestamp || b.timestamp || b.createdAt).getTime();
      return tb - ta;
    });
    return sorted.slice(0, 8);
  }, [feedback]);

  // “timeline” simplu: împarte ultimele 15 min în 15 bucket-uri și calculează % pe fiecare emoție
  const series = useMemo(() => {
    const buckets = Array.from({ length: 15 }, () => ({
      happy: 0, confused: 0, surprised: 0, sad: 0, total: 0
    }));

    const now = Date.now();

    for (const f of feedback) {
      const ts = new Date(f.Timestamp || f.timestamp || f.createdAt).getTime();
      const diffMin = Math.floor((now - ts) / 60000);
      if (diffMin < 0 || diffMin > 14) continue;

      const idx = 14 - diffMin; // stânga=mai vechi, dreapta=acum
      const e = (f.Emotion || f.emotion || "").toLowerCase();
      if (!buckets[idx]) continue;
      if (buckets[idx][e] !== undefined) buckets[idx][e]++;
      buckets[idx].total++;
    }

    // transform în % (0..1) pt desen
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
  const liveBadge = "LIVE";

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
            <span className="aLivePill">{liveBadge}</span>
            <span className="aElapsed">· last 15 min</span>
          </div>

          <h1 className="aTitle">{title}</h1>
          <div className="aMeta">
            <span>🔑 Code: <b>{code || "—"}</b></span>
            <span className="aDotSep">•</span>
            <span>👥 {stats.total} reactions (last 15 min)</span>
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
            <div className="mutedSmall">Real-time student reactions over the last 15 minutes</div>

            <div className="aLegend">
              <span><i className="legDot blueDot" /> Happy</span>
              <span><i className="legDot yellowDot" /> Surprised</span>
              <span><i className="legDot purpleDot" /> Confused</span>
              <span><i className="legDot redDot" /> Lost</span>
            </div>

            {/* “chart” simplu: 15 coloane */}
            <div className="aChart">
              {series.map((p, idx) => {
                // înălțimi (0..100)
                const h1 = Math.round(p.happy * 100);
                const h2 = Math.round(p.surprised * 100);
                const h3 = Math.round(p.confused * 100);
                const h4 = Math.round(p.sad * 100);

                // arătăm doar o bandă dominantă (ca să fie simplu)
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
                  <div className="aFeedRow" key={i}>
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

