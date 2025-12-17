const API = process.env.REACT_APP_API_URL || "http://localhost:9000/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// cod de 6 caractere (A-Z, 0-9)
function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // fără 0/O/1/I (mai lizibil)
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function getActivities() {
  const r = await fetch(`${API}/activities`, { method: "GET" });
  if (!r.ok) throw new Error("Get failed");
  return await r.json();
}

async function createActivity(payload) {
  const r = await fetch(`${API}/activities`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error("Create failed");
  return await r.json();
}
async function getActivityById(id) {
  const API = process.env.REACT_APP_API_URL || "http://localhost:9000/api";
  const token = localStorage.getItem("token");

  const r = await fetch(`${API}/activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!r.ok) throw new Error("Failed to load activity");
  return await r.json();
}


export default {
  getActivityById,
  generateAccessCode,
  getActivities,
  createActivity
};
