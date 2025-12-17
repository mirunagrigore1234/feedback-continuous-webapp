import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import feedbackService from "../services/feedbackService";

export default function StudentFeedback() {
  const nav = useNavigate();
  const { accessCode } = useParams();

  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [comment, setComment] = useState("");

  // load activity title/time (optional)
  useEffect(() => {
    (async () => {
      try {
        const a = await feedbackService.getActivityByCode(accessCode);
        setActivity(a);
      } catch (e) {
        setError("Invalid or expired activity code.");
      }
    })();
  }, [accessCode]);

  async function send(emotion) {
    setError("");
    setSending(true);
    try {
      await feedbackService.sendFeedbackByCode(accessCode, { emotion, comment: "" });
      // mic feedback UI (poți schimba cu toast)
    } catch (e) {
      setError("Could not send feedback.");
    } finally {
      setSending(false);
    }
  }

  async function sendWithComment() {
    setError("");
    setSending(true);
    try {
      await feedbackService.sendFeedbackByCode(accessCode, { emotion: "confused", comment });
      setOpenModal(false);
      setComment("");
    } catch (e) {
      setError("Could not send comment.");
    } finally {
      setSending(false);
    }
  }

  const title = activity?.Title ?? "Activity";
  const prof = activity?.ProfessorId ? `Professor #${activity.ProfessorId}` : "Live session";

  return (
    <>
      <header className="stNav">
        <div className="stLeft">
          <button className="backBtn" onClick={() => nav("/")}>←</button>

          <div className="stTitle">
            <b>{title}</b>
            <span>{prof}</span>
          </div>

          <span className="badgeLive">
            <span className="dot" />
            Live
          </span>
        </div>

        <div className="iconRound" title="Profile">👤</div>
      </header>

      <div className="stWrap">
        {error && (
          <div style={{ color: "crimson", fontWeight: 900, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="quadGrid">
          <button className="quadBtn happy" onClick={() => send("happy")} disabled={sending}>
            <div className="bigEmoji">😄</div>
            <div className="qTitle">Clear / Happy</div>
            <div className="qSub">I get it!</div>
          </button>

          <button className="quadBtn wow" onClick={() => send("surprised")} disabled={sending}>
            <div className="bigEmoji">😮</div>
            <div className="qTitle">Surprised / Wow</div>
            <div className="qSub">Wow!</div>
          </button>

          <button className="quadBtn conf" onClick={() => send("confused")} disabled={sending}>
            <div className="bigEmoji">🤔</div>
            <div className="qTitle">Confused / Unsure</div>
            <div className="qSub">Wait, what?</div>
          </button>

          <button className="quadBtn sad" onClick={() => send("sad")} disabled={sending}>
            <div className="bigEmoji">😣</div>
            <div className="qTitle">Lost / Unhappy</div>
            <div className="qSub">I’m lost</div>
          </button>
        </div>

        <div className="footerRow">
          <div className="lockRow">
            🙈 <span>Your feedback is anonymous.</span>
          </div>
        </div>
      </div>

      {/* Modal comment */}
      {openModal && (
        <div className="modalOverlay" onClick={() => setOpenModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add a specific comment</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Optional. Your comment will be sent anonymously.
            </p>

            <textarea
              className="textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your comment..."
            />

            <div className="modalActions">
              <button className="btn btnOutline" onClick={() => setOpenModal(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" onClick={sendWithComment} disabled={sending}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
