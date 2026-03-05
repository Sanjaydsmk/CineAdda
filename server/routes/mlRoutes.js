import express from "express";
import { requireAuth } from "@clerk/express";
import {
  analyzeReviewSentiment,
  getPersonalizedRecommendations,
  getSimilarMovies,
} from "../controller/mlController.js";

const mlRouter = express.Router();

mlRouter.post("/personalized", requireAuth(), getPersonalizedRecommendations);
mlRouter.post("/sentiment", analyzeReviewSentiment);
mlRouter.get("/similar/:movieId", getSimilarMovies);

export default mlRouter;
