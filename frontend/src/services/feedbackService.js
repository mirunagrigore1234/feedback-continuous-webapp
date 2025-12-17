const API = process.env.REACT_APP_API_URL || "http://localhost:9001/api";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function jsonFetch(url, options = {}) {
  // cheia: prevenim 304/caching pentru live
  const sep = url.includes("?") ? "&" : "?";
  const noCacheUrl = `${url}${sep}ts=${Date.now()}`;

  const r = await fetch(noCacheUrl, {
    cache: "no-store",
    ...options,
  });

  // încearcă să citești mesajul de eroare dacă există
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || `HTTP ${r.status}`);
  }

  // unele răspunsuri pot fi 204
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

// 1) ia activitatea după cod (ca să afli ActivityId)
async function getActivityByCode(accessCode) {
  return jsonFetch(`${API}/activities/code/${encodeURIComponent(accessCode)}`);
}

// 2) trimite feedback
async function createFeedback({ ActivityId, Emotion, Comment }) {
  // student anonim: ID local (persistă în browser)
  let studentId = localStorage.getItem("anonStudentId");
  if (!studentId) {
    studentId = String(Math.floor(Math.random() * 1_000_000_000));
    localStorage.setItem("anonStudentId", studentId);
  }

  const payload = {
    ActivityId,
    StudentId: parseInt(studentId, 10),
    Emotion,
  };

  if (Comment && Comment.trim()) payload.Comment = Comment.trim();

  return jsonFetch(`${API}/feedback`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

// helper: feedback direct by code
async function sendFeedbackByCode(accessCode, { emotion, comment }) {
  const activity = await getActivityByCode(accessCode);
  const activityId = activity?.ActivityId ?? activity?.id;
  if (!activityId) throw new Error("ActivityId missing from server response");
  return createFeedback({ ActivityId: activityId, Emotion: emotion, Comment: comment });
}

// 3) ia feedback-urile pe activitate (profesor / dashboard)
async function getFeedbacksByActivity(activityId) {
  // ajustează ruta dacă la tine e altfel
  return jsonFetch(`${API}/feedback/activity/${activityId}`, {
    headers: authHeaders(),
  });
}

export default {
  getFeedbacksByActivity,
  getActivityByCode,
  createFeedback,
  sendFeedbackByCode,
};
