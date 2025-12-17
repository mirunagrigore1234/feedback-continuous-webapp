import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Completează email-ul.");
    if (!password) return setError("Completează parola.");

    setLoading(true);
    try {
      const API = process.env.REACT_APP_API_URL || "http://localhost:9000/api";

      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email.trim(), Password: password })
      });

      if (!r.ok) {
        const msg = await r.json().catch(() => ({}));
        throw new Error(msg.message || "Email sau parolă greșite.");
      }

      const data = await r.json(); // { token }
      localStorage.setItem("token", data.token);

      navigate("/professor/dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginTopBrand">
        <div className="loginTopLogo">🎓</div>
        <div className="loginTopName">CourseFeedback</div>
      </div>

      <div className="loginCard">
        <div className="loginHero">
          <div className="loginHeroTag">FACULTY PORTAL</div>
        </div>

        <div className="loginBody">
          <h1 className="loginTitle">Professor Login</h1>
          <p className="loginSubtitle">
            Please enter your credentials to manage your courses and view feedback.
          </p>

          {error && <div className="errorBox" style={{ marginTop: 12 }}>{error}</div>}

          <form onSubmit={onSubmit} className="loginForm">
            <label className="loginLabel">Email Address</label>
            <div className="loginInputWrap">
              <span className="loginInputIcon">✉️</span>
              <input
                className="loginInput"
                placeholder="professor@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <label className="loginLabel" style={{ marginTop: 14 }}>Password</label>
            <div className="loginInputWrap">
              <span className="loginInputIcon">🔒</span>
              <input
                className="loginInput"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="loginEye"
                onClick={() => setShowPw((s) => !s)}
                aria-label="toggle password"
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="loginRow">
              <div />
              <button type="button" className="loginLink" onClick={() => alert("Not implemented")}>
                Forgot Password?
              </button>
            </div>

            <button className="loginBtn" disabled={loading}>
              {loading ? "Logging in..." : "Log In  →"}
            </button>

            <div className="loginSecure">
              🔒 Secure encrypted connection
            </div>
          </form>
        </div>
      </div>

      <div className="loginBottom">
        Need help accessing your account? <span className="loginLinkStrong">Contact Support</span>
      </div>
      <div className="loginFooter">© 2025 CourseFeedback. All rights reserved.</div>
    </div>
  );
}
