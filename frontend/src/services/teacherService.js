//Funcții pentru login/înregistrare și gestionarea token-ului JWT
const API = process.env.REACT_APP_API_URL || "http://localhost:9001/api";

function getToken() {
  return localStorage.getItem("token");
}

async function login(email, password) {
  // Varianta A (recomandată): /api/auth/login
  // const r = await fetch(`${API}/auth/login`, { ... })

  // Varianta B: /api/teachers/login (dacă faci ruta asta)
  const r = await fetch(`${API}/teachers/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password })
  });

  if (!r.ok) throw new Error("Invalid credentials");
  return await r.json(); // ideal: { token, teacher }
}

async function getMe() {
  const r = await fetch(`${API}/teachers/me`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!r.ok) throw new Error("Unauthorized");
  return await r.json();
}

export default { login, getMe };
