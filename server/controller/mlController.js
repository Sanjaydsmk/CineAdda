import axios from "axios";
import { clerkClient } from "@clerk/express";
import connectDB from "../configs/db.js";
import Booking from "../models/Bookings.js";
import Movie from "../models/Movie.js";

const ML_API_BASE_URL = (process.env.ML_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const mapMovieToMlPayload = (movie) => ({
  movie_id: String(movie?._id || movie?.id || ""),
  title: movie?.title || "",
  overview: movie?.overview || "",
  genres: Array.isArray(movie?.genres) ? movie.genres.map((genre) => String(genre?.name || genre)) : [],
  keywords: Array.isArray(movie?.keywords) ? movie.keywords.map(String) : [],
  cast: Array.isArray(movie?.cast)
    ? movie.cast.map((c) => (typeof c === "string" ? c : String(c?.name || ""))).filter(Boolean)
    : [],
  vote_average: Number(movie?.vote_average || 0),
  runtime: Number(movie?.runtime || 0),
  release_date: movie?.release_date || "",
});

const mapBookingToInteraction = (booking) => {
  const userId = String(booking?.user || "");
  const movieId = String(booking?.show?.movie?._id || booking?.show?.movie || "");
  if (!userId || !movieId) return null;
  return {
    user_id: userId,
    movie_id: movieId,
    rating: booking?.isPaid ? 4 : 0,
    liked: false,
    watched: Boolean(booking?.isPaid),
  };
};

export const getPersonalizedRecommendations = async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.auth();
    const topK = Number(req.body?.top_k || 8);

    const [movies, bookings] = await Promise.all([
      Movie.find({}).lean(),
      Booking.find({})
        .populate({ path: "show", populate: { path: "movie" } })
        .lean(),
    ]);

    const interactions = bookings
      .map(mapBookingToInteraction)
      .filter(Boolean);

    const user = await clerkClient.users.getUser(userId);
    const favorites = user?.privateMetadata?.favorites || [];
    for (const movieId of favorites) {
      interactions.push({
        user_id: userId,
        movie_id: String(movieId),
        rating: 5,
        liked: true,
        watched: true,
      });
    }

    const payload = {
      user_id: userId,
      movies: movies.map(mapMovieToMlPayload).filter((movie) => movie.movie_id),
      interactions,
      top_k: topK,
    };

    const { data } = await axios.post(`${ML_API_BASE_URL}/api/personalized`, payload, {
      timeout: 10000,
    });

    const scoreMap = new Map((data?.recommendations || []).map((item) => [item.movie_id, item]));
    const recommendedMovies = movies
      .filter((movie) => scoreMap.has(String(movie._id)))
      .map((movie) => {
        const rec = scoreMap.get(String(movie._id));
        return {
          ...movie,
          mlScore: rec?.score || 0,
          mlReason: rec?.reason || "Recommended by ML model",
        };
      })
      .sort((a, b) => b.mlScore - a.mlScore);

    return res.json({
      success: true,
      strategy: data?.strategy || "hybrid_content_collaborative",
      recommendations: recommendedMovies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.response?.data?.detail || error.message,
    });
  }
};

export const analyzeReviewSentiment = async (req, res) => {
  try {
    const reviewText = String(req.body?.reviewText || "").trim();
    if (!reviewText) {
      return res.status(400).json({ success: false, message: "reviewText is required" });
    }

    const { data } = await axios.post(
      `${ML_API_BASE_URL}/api/sentiment`,
      { review_text: reviewText },
      { timeout: 10000 }
    );
    return res.json({
      success: true,
      label: data?.label,
      confidence: data?.confidence,
      probabilities: data?.probabilities || {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.response?.data?.detail || error.message,
    });
  }
};

export const getSimilarMovies = async (req, res) => {
  try {
    await connectDB();
    const { movieId } = req.params;
    const topK = Number(req.query?.top_k || 8);
    const movies = await Movie.find({}).lean();

    const payload = {
      movie_id: String(movieId),
      movies: movies.map(mapMovieToMlPayload).filter((movie) => movie.movie_id),
      top_k: topK,
    };

    const { data } = await axios.post(`${ML_API_BASE_URL}/api/similar`, payload, {
      timeout: 10000,
    });

    const scoreMap = new Map((data?.recommendations || []).map((item) => [item.movie_id, item]));
    const recommendations = movies
      .filter((movie) => scoreMap.has(String(movie._id)))
      .map((movie) => {
        const rec = scoreMap.get(String(movie._id));
        return {
          ...movie,
          mlScore: rec?.score || 0,
          mlReason: rec?.reason || "Similar by ML model",
        };
      })
      .sort((a, b) => b.mlScore - a.mlScore);

    return res.json({
      success: true,
      sourceMovieId: movieId,
      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.response?.data?.detail || error.message,
    });
  }
};
