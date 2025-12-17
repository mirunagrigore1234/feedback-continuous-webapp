//Logica pentru trimiterea și vizualizarea feedback-ului; gestionează cererile student/profesor legate de feedback
import Feedback from "../entities/Feedback.js";

async function createFeedback(payload) {
  return await Feedback.create(payload);
}

async function getFeedbacksByActivity(activityId) {
  return await Feedback.findAll({
    where: { ActivityId: activityId },
    order: [["Timestamp", "ASC"]]
  });
}

export {
  createFeedback,
  getFeedbacksByActivity
};
