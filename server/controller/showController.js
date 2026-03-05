import axios from "axios"
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import connectDB from "../configs/db.js";
import { recommendMoviesForMood } from "../utils/moodNlp.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_KEY = (process.env.TMDB_API_KEY || "").trim();
const isTmdbV4Token = TMDB_KEY.startsWith("eyJ");

const getTmdbConfig = (params = {}) => {
  if (!TMDB_KEY) return null;
  if (isTmdbV4Token) {
    return {
      headers: { Authorization: `Bearer ${TMDB_KEY}` },
      params,
    };
  }
  return {
    params: {
      api_key: TMDB_KEY,
      ...params,
    },
  };
};

const SHOW_TIMEZONE = process.env.SHOW_TIMEZONE || "Asia/Kolkata";
const SHOW_TZ_OFFSET = process.env.SHOW_TZ_OFFSET || "+05:30";
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOW_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const normalizeMovieForResponse = (movie) => {
  if (!movie || typeof movie !== "object") return null;
  const id = movie._id || movie.id;
  if (!id) return null;
  return {
    ...movie,
    _id: String(id),
    id: String(id),
    title: movie.title || "Untitled Movie",
    overview: movie.overview || "",
    tagline: movie.tagline || "",
    poster_path: movie.poster_path || "",
    backdrop_path: movie.backdrop_path || "",
    release_date: movie.release_date || "",
    runtime: Number(movie.runtime || 0),
    vote_average: Number(movie.vote_average || 0),
    genres: Array.isArray(movie.genres) ? movie.genres : [],
  };
};

//api to get now playing fromtmdb 


export const getNowPlayingMovies = async (req, res) => {
    try{
        const tmdbConfig = getTmdbConfig();
        if (!tmdbConfig) {
          return res.status(500).json({
            success: false,
            message: "TMDB_API_KEY is missing in server/.env",
          });
        }
      
        const {data} =await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, tmdbConfig)

        const movies=data.results;
        res.json({success:true, movies:movies, source: "tmdb"})

    } catch(error){
        console.error(error);
        // Fallback: if TMDB is unreachable, serve locally stored movies
        // so admin can still add shows for existing catalog entries.
        try {
          const localMovies = await Movie.find({})
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

          const normalizedLocalMovies = localMovies.map((movie) => ({
            ...movie,
            id: movie._id,
          }));

          return res.json({
            success: true,
            movies: normalizedLocalMovies,
            source: "local_fallback",
            warning:
              "TMDB is unreachable right now. Showing movies from local database.",
          });
        } catch (fallbackError) {
          console.error(fallbackError);
          return res.status(500).json({
            success:false,
            message:error?.response?.data?.status_message || error.message,
          });
        }

    }
}

// api to add new show to db
export const addShow = async (req, res) => {
  try {
    await connectDB();
    const { movieId, showsInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);

    // If movie not in DB → fetch from TMDB
    if (!movie) {
      const tmdbConfig = getTmdbConfig();
      if (!tmdbConfig) {
        return res.status(500).json({
          success: false,
          message: "TMDB_API_KEY is missing in server/.env",
        });
      }

      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, tmdbConfig),
        axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, tmdbConfig)
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieData = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres.map((g) => g.name),
        cast: movieCreditsData.cast.slice(0, 12).map((c) => ({
          id: c.id,
          name: c.name,
          profile_path: c.profile_path || null,
          character: c.character || "",
        })),
        vote_average: movieApiData.vote_average,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieData);
    }

    // Create shows
    const showsToCreate = [];

    showsInput.forEach((show) => {
      const showDate = show.date;

      show.time.forEach((time) => {   // ← fixed (time not times)
        const dateTimeString = `${showDate}T${time}:00${SHOW_TZ_OFFSET}`;

        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {}
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({
      success: true,
      message: "Shows added successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


//api to get all shows

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() }
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // filter unique shows
    const uniqueShows = new Set(
      shows.map((show) => show.movie)
    );

    res.json({
      success: true,
      shows: Array.from(uniqueShows)
    });

  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message
    });
  }
};


//api to get single show from db

export const getShow = async (req, res) => {
  try {
    await connectDB()
    const { movieId } = req.params;

    // get all upcoming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() }
    });

    const movie = await Movie.findById(movieId).lean();
    if (!movie) {
      return res.json({
        success: false,
        message: "Movie not found"
      });
    }

    const existingCast = Array.isArray(movie.cast) ? movie.cast : [];
    const hasCastProfiles = existingCast.some(
      (c) => c && typeof c === "object" && c.profile_path
    );

    // Backfill cast images for older records that were saved as name-only strings.
    if (!hasCastProfiles) {
      try {
        const { data: creditsData } = await axios.get(
          `${TMDB_BASE_URL}/movie/${movieId}/credits`,
          getTmdbConfig() || {}
        );

        const enrichedCast = (creditsData?.cast || []).slice(0, 12).map((c) => ({
          id: c.id,
          name: c.name,
          profile_path: c.profile_path || null,
          character: c.character || "",
        }));

        if (enrichedCast.length) {
          movie.cast = enrichedCast;
          await Movie.findByIdAndUpdate(movieId, { cast: enrichedCast });
        }
      } catch (creditsError) {
        console.error(creditsError);
      }
    }

    const dateTime = {};

    shows.forEach((show) => {
      const parts = dateKeyFormatter.formatToParts(show.showDateTime);
      const year = parts.find((part) => part.type === "year")?.value;
      const month = parts.find((part) => part.type === "month")?.value;
      const day = parts.find((part) => part.type === "day")?.value;
      const date = `${year}-${month}-${day}`;

      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id
      });
    });
     res.json({
      success: true,movie,dateTime
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// api to recommend currently running movies based on user mood text
export const getMoodRecommendations = async (req, res) => {
  try {
    await connectDB();
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide some text to analyze mood.",
      });
    }

    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate("movie")
      .lean();

    const movieMap = new Map();
    for (const show of activeShows) {
      if (show?.movie?._id) {
        movieMap.set(String(show.movie._id), show.movie);
      }
    }

    const runningMovies = Array.from(movieMap.values())
      .map(normalizeMovieForResponse)
      .filter(Boolean);
    const { mood, moodId, recommendations } = await recommendMoviesForMood(text, runningMovies);
    const fallbackRecommendations = runningMovies
      .slice()
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 8);
    const safeRecommendations =
      Array.isArray(recommendations) && recommendations.length > 0
        ? recommendations
        : fallbackRecommendations;

    return res.json({
      success: true,
      mood,
      moodId,
      recommendations: safeRecommendations,
      totalRunningMovies: runningMovies.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
