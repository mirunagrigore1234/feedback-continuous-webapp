const API = process.env.REACT_APP_API_URL || "http://localhost:9000/api";

// 1) ia activitatea după cod (ca să afli ActivityId)
async function getActivityByCode(accessCode) {
  const r = await fetch(`${API}/activities/code/${encodeURIComponent(accessCode)}`);
  if (!r.ok) throw new Error("Invalid code");
  return await r.json(); // trebuie să aibă ActivityId
}

// 2) trimite feedback
async function createFeedback({ ActivityId, Emotion, Comment }) {
  // student anonim: generăm un ID local (persistă în browser)
  let studentId = localStorage.getItem("anonStudentId");
  if (!studentId) {
    studentId = String(Math.floor(Math.random() * 1_000_000_000));
    localStorage.setItem("anonStudentId", studentId);
  }

  const payload = {
    ActivityId,
    StudentId: parseInt(studentId, 10),
    Emotion
  };

  // opțional comment
  if (Comment && Comment.trim().length > 0) payload.Comment = Comment.trim();

  const r = await fetch(`${API}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!r.ok) throw new Error("Failed to send feedback");
  return await r.json();
}

// helper: feedback direct by code
async function sendFeedbackByCode(accessCode, { emotion, comment }) {
  const activity = await getActivityByCode(accessCode);
  const activityId = activity.ActivityId ?? activity.id;
  return createFeedback({ ActivityId: activityId, Emotion: emotion, Comment: comment });
}

async function getFeedbacksByActivity(activityId) {
  const API = process.env.REACT_APP_API_URL || "http://localhost:9000/api";

  // adaptează ruta dacă e diferită în backend-ul tău:
  const r = await fetch(`${API}/feedback/activity/${activityId}`);
  if (!r.ok) throw new Error("Failed to load feedback");
  return await r.json();
}

export default {
  getFeedbacksByActivity,
  getActivityByCode,
  createFeedback,
  sendFeedbackByCode
};
