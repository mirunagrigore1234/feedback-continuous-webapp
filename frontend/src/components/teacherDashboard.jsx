import { useEffect, useMemo, useState } from "react";
import activityService from "../services/activityService";
import { useNavigate } from "react-router-dom";


function fmtDate(dtStr) {
  if (!dtStr) return "-";
  const d = new Date(dtStr);
  if (Number.isNaN(d.getTime())) return dtStr;
  return d.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function isLive(a) {
  const start = new Date(a.StartTime || a.start_time || a.startTime);
  const end = new Date(a.EndTime || a.end_time || a.endTime);
  const now = new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return now >= start && now <= end;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMins, setDurationMins] = useState(45);
  const [accessCode, setAccessCode] = useState(activityService.generateAccessCode());

  const activeCount = useMemo(() => activities.filter(isLive).length, [activities]);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await activityService.getActivities();
      setActivities(data);
    } catch (e) {
      setError("Nu pot încărca activitățile. Verifică dacă ești logat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function regenerateCode() {
    setAccessCode(activityService.generateAccessCode());
  }

  async function onCreate() {
    setError("");

    // validări simple
    if (!title.trim()) return setError("Completează titlul activității.");
    if (!description.trim()) return setError("Completează descrierea.");
    if (!startTime) return setError("Alege data și ora de start.");
    if (!/^[A-Z0-9]{6}$/.test(accessCode)) return setError("Access code trebuie să aibă exact 6 caractere (A-Z, 0-9).");

    const start = new Date(startTime);
    const end = new Date(start.getTime() + Number(durationMins) * 60000);

    try {
      await activityService.createActivity({
        Title: title.trim(),
        Description: description.trim(),
        AccessCode: accessCode,
        StartTime: start.toISOString(),
        EndTime: end.toISOString()
      });

      // reset parțial
      setTitle("");
      setDescription("");
      setStartTime("");
      setDurationMins(45);
      setAccessCode(activityService.generateAccessCode());

      await load();
    } catch (e) {
      setError("Nu am putut crea activitatea (posibil cod duplicat).");
    }
  }

  return (
    <div className="dash">
      {/* SIDEBAR */}
      <aside className="side">
        <div className="sideProfile">
          <div className="avatar">👨‍🏫</div>
          <div>
            <div className="sideName">Prof.</div>
            <div className="sideDept">Dept.</div>
          </div>
        </div>

        <nav className="sideNav">
          <button className="sideItem">Dashboard</button>
          <button className="sideItem sideItemActive">Activities</button>
          <button className="sideItem">Reports</button>
          <button className="sideItem">Settings</button>
        </nav>

        <div className="sideBottom">
          <button
            className="sideItem"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/professor/login";
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topBar">
          <div className="crumbs">Dashboard / <b>Activities</b></div>
          <div className="topRight">
            <div className="pillGreen">
              <span className="dotGreen" />
              {activeCount} Active Sessions
            </div>
            <button className="iconBtn">🔔</button>
          </div>
        </div>

        <div className="pageTitle">
          <h1>Activity Management</h1>
          <p className="muted">Create and manage your course feedback sessions.</p>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="gridMain">
          {/* LEFT: CREATE */}
          <section className="cardDash">
            <div className="cardDashHeader">
              <div className="plus">＋</div>
              <div>
                <div className="cardDashTitle">Define New Session</div>
                <div className="mutedSmall">Create & generate code</div>
              </div>
            </div>

            <div className="form">
              <label className="label">Activity Topic</label>
              <input
                className="inputDash"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Intro to Econometrics - Week 3"
              />

              <label className="label">Description</label>
              <textarea
                className="textareaDash"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description..."
              />

              <label className="label">Date & Start Time</label>
              <input
                className="inputDash"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <div className="row2">
                <div>
                  <label className="label">Duration</label>
                  <select
                    className="inputDash"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>

                <div>
                  <label className="label">Access code</label>
                  <div className="codeRow">
                    <input className="inputDash" value={accessCode} readOnly />
                    <button className="btn btnSoft" onClick={regenerateCode}>
                      ↻
                    </button>
                  </div>
                </div>
              </div>

              <button className="btn btnPrimary dashBtn" onClick={onCreate}>
                Create & Generate Code →
              </button>
            </div>
          </section>

          {/* RIGHT: LIST */}
          <section className="cardDash">
            <div className="listHeader">
              <div>
                <div className="cardDashTitle">Recent Activities</div>
                <div className="mutedSmall">Showing {activities.length} sessions</div>
              </div>

              <div className="searchRow">
                <input className="inputDash" placeholder="Search sessions..." />
                <button className="iconBtn">⚙️</button>
              </div>
            </div>

            <div className="table">
              <div className="thead">
                <div>ACTIVITY</div>
                <div>DATE</div>
                <div>ACCESS CODE</div>
                <div>STATUS</div>
                <div style={{ textAlign: "right" }}>ACTIONS</div>
              </div>

              {loading ? (
                <div className="rowItem muted">Loading…</div>
              ) : activities.length === 0 ? (
                <div className="rowItem muted">No activities yet.</div>
              ) : (
                activities.map((a) => {
  const id = a.ActivityId ?? a.id;
  const title = a.Title ?? a.title;
  const desc = a.Description ?? a.description;
  const code = a.AccessCode ?? a.access_code ?? a.accessCode;
  const s = a.StartTime ?? a.start_time ?? a.startTime;

  const live = isLive(a);

  return (
    <div
      className="trow clickableRow"
      key={id}
      onClick={() => navigate(`/professor/activity/${id}`)}
      title="Open live dashboard"
    >
      <div className="cellMain">
        <div className="cellTitle">{title}</div>
        <div className="cellSub mutedSmall">{desc}</div>
      </div>

      <div className="cell">{fmtDate(s)}</div>

      <div className="cell">
        <span className="codePill">{code}</span>
      </div>

      <div className="cell">
        {live ? <span className="statusLive">Live</span> : <span className="statusClosed">Closed</span>}
      </div>

      <div className="cell" style={{ textAlign: "right" }}>
        <button
          className="iconBtn"
          onClick={(e) => {
            e.stopPropagation(); // ✅ nu navighează când apeși pe ⋮
            // aici poți pune meniul tău ulterior
          }}
        >
          ⋮
        </button>

        <button
          className="btn btnSoft"
          style={{ marginLeft: 8 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/professor/activity/${id}`);
          }}
        >
          Open
        </button>
      </div>
    </div>
  );
})
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
