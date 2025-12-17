//Definirea rutelor /api/feedback și /api/activities/:id/feedback
import express from "express";
import {
  createFeedback,
  getFeedbacksByActivity
} from  "../dataAccess/FeedbackDA.js";

let feedbackRouter = express.Router();

/* CREATE FEEDBACK (student) */
feedbackRouter.route("/").post(async (req, res) => {
  try {
    const feedback = await createFeedback(req.body);
    res.status(201).json(feedback);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* GET FEEDBACK BY ACTIVITY (profesor) */
feedbackRouter.route("/activity/:activityId").get(async (req, res) => {
  try {
    const feedbacks = await getFeedbacksByActivity(req.params.activityId);
    res.status(200).json(feedbacks);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

export default feedbackRouter;
