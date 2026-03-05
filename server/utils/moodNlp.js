import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moodProfiles = [
  {
    id: "happy",
    label: "Happy / Feel-Good",
    keywords: [
      "happy",
      "joy",
      "fun",
      "light",
      "feel good",
      "uplifting",
      "cheerful",
      "smile",
      "positive",
      "bright",
    ],
    genres: ["Comedy", "Family", "Animation", "Adventure"],
    overviewHints: ["friendship", "journey", "celebrate", "hope", "dream"],
  },
  {
    id: "sad",
    label: "Emotional / Deep",
    keywords: [
      "sad",
      "heartbreak",
      "lonely",
      "cry",
      "emotional",
      "grief",
      "loss",
      "melancholy",
    ],
    genres: ["Drama", "Romance"],
    overviewHints: ["loss", "healing", "family", "relationship", "struggle"],
  },
  {
    id: "romantic",
    label: "Romantic",
    keywords: [
      "love",
      "romance",
      "date",
      "couple",
      "relationship",
      "heart",
      "chemistry",
    ],
    genres: ["Romance", "Drama", "Comedy"],
    overviewHints: ["love", "couple", "marriage", "relationship"],
  },
  {
    id: "thrilling",
    label: "Action / Thrilling",
    keywords: [
      "thrill",
      "adrenaline",
      "fast",
      "intense",
      "action",
      "excited",
      "edge",
      "suspense",
    ],
    genres: ["Action", "Thriller", "Crime", "Adventure", "Science Fiction"],
    overviewHints: ["mission", "escape", "battle", "chase", "danger"],
  },
  {
    id: "scary",
    label: "Scary",
    keywords: [
      "scary",
      "horror",
      "fear",
      "dark",
      "ghost",
      "haunted",
      "creepy",
      "nightmare",
    ],
    genres: ["Horror", "Thriller", "Mystery"],
    overviewHints: ["haunted", "killer", "curse", "unknown", "survival"],
  },
  {
    id: "motivated",
    label: "Motivational",
    keywords: [
      "motivated",
      "inspire",
      "career",
      "growth",
      "winner",
      "comeback",
      "success",
      "focus",
    ],
    genres: ["Drama", "Biography", "History", "Sports"],
    overviewHints: ["challenge", "goal", "dream", "discipline", "victory"],
  },
  {
    id: "calm",
    label: "Calm / Easy Watch",
    keywords: [
      "calm",
      "relax",
      "peaceful",
      "soft",
      "easy",
      "simple",
      "gentle",
      "slow",
    ],
    genres: ["Family", "Animation", "Comedy", "Drama"],
    overviewHints: ["small town", "friendship", "family", "daily life"],
  },
];

const positiveLexicon = new Set([
  "happy",
  "joy",
  "good",
  "great",
  "love",
  "fun",
  "awesome",
  "relaxed",
  "peaceful",
  "hope",
  "smile",
  "positive",
  "uplifting",
]);

const negativeLexicon = new Set([
  "sad",
  "angry",
  "stress",
  "stressed",
  "upset",
  "depressed",
  "lonely",
  "fear",
  "scared",
  "dark",
  "tired",
  "anxious",
  "broken",
  "heartbreak",
]);

let sentimentAnalyzer = null;
let sentimentAnalyzerPromise = null;
const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PY_MOOD_SCRIPT = path.resolve(__dirname, "../ml/mood_analyzer.py");

const loadSentimentAnalyzer = async () => {
  if (sentimentAnalyzer) return sentimentAnalyzer;
  if (sentimentAnalyzerPromise) return sentimentAnalyzerPromise;

  sentimentAnalyzerPromise = import("sentiment")
    .then((mod) => {
      const Sentiment = mod?.default;
      if (!Sentiment) return null;
      sentimentAnalyzer = new Sentiment();
      return sentimentAnalyzer;
    })
    .catch(() => null);

  return sentimentAnalyzerPromise;
};

const getMoodProfileById = (moodId) =>
  moodProfiles.find((mood) => mood.id === moodId);

const normalizeMoodScores = (scores = {}) => {
  const entries = Object.entries(scores).filter(([, value]) => Number(value) > 0);
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);
  if (!total) return {};
  return entries.reduce((acc, [key, value]) => {
    acc[key] = Number((Number(value) / total).toFixed(4));
    return acc;
  }, {});
};

const inferMoodWithPython = async (text = "") => {
  const pythonCommands = ["python3", "python"];

  for (const cmd of pythonCommands) {
    try {
      const { stdout } = await execFileAsync(cmd, [PY_MOOD_SCRIPT, text], {
        timeout: 2000,
        maxBuffer: 1024 * 100,
      });

      const parsed = JSON.parse((stdout || "").trim() || "{}");
      const moodId = parsed?.mood_id;
      if (!moodId) continue;

      return {
        moodId,
        confidence: Number(parsed?.confidence || 0),
        compoundSentiment: Number(parsed?.compound_sentiment || 0),
        moodScores: normalizeMoodScores(parsed?.mood_scores || {}),
      };
    } catch (_error) {
      // Try next python command or fallback to JS logic.
    }
  }

  return null;
};

const cleanText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTokens = (text = "") => cleanText(text).split(" ").filter(Boolean);

const countHits = (haystack, needles = []) => {
  let score = 0;
  for (const needle of needles) {
    if (haystack.includes(needle.toLowerCase())) score += 1;
  }
  return score;
};

const normalizeMovie = (movie) => {
  if (!movie) return null;
  const rawMovie =
    typeof movie.toObject === "function" ? movie.toObject() : movie;
  if (!rawMovie || typeof rawMovie !== "object") return null;

  const id = rawMovie._id || rawMovie.id;
  if (!id) return null;

  return {
    ...rawMovie,
    _id: String(id),
    id: String(id),
    title: rawMovie.title || "",
    overview: rawMovie.overview || "",
    tagline: rawMovie.tagline || "",
    poster_path: rawMovie.poster_path || "",
    backdrop_path: rawMovie.backdrop_path || "",
    release_date: rawMovie.release_date || "",
    runtime: Number(rawMovie.runtime || 0),
    vote_average: Number(rawMovie.vote_average || 0),
    genres: Array.isArray(rawMovie.genres) ? rawMovie.genres : [],
  };
};

const inferMoodFromText = (text = "") => {
  const normalized = cleanText(text);
  const tokens = getTokens(text);

  let positiveCount = 0;
  let negativeCount = 0;
  for (const token of tokens) {
    if (positiveLexicon.has(token)) positiveCount += 1;
    if (negativeLexicon.has(token)) negativeCount += 1;
  }

  const scoredMoods = moodProfiles.map((mood) => {
    const keywordScore = countHits(normalized, mood.keywords) * 3;
    return { ...mood, moodScore: keywordScore };
  });

  scoredMoods.sort((a, b) => b.moodScore - a.moodScore);
  const topMood = scoredMoods[0];
  const hasStrongKeywordSignal = topMood && topMood.moodScore > 0;

  if (!hasStrongKeywordSignal) {
    if (negativeCount > positiveCount) {
      return moodProfiles.find((m) => m.id === "calm");
    }
    if (positiveCount > negativeCount) {
      return moodProfiles.find((m) => m.id === "happy");
    }
    return moodProfiles.find((m) => m.id === "thrilling");
  }

  return topMood;
};

export const recommendMoviesForMood = async (userText = "", movies = []) => {
  const pythonMood = await inferMoodWithPython(userText);
  const fallbackMood = inferMoodFromText(userText);
  const mood = (pythonMood?.moodId && getMoodProfileById(pythonMood.moodId)) || fallbackMood;
  const moodDistribution = pythonMood?.moodScores?.[mood.id]
    ? pythonMood.moodScores
    : { [mood.id]: 1 };
  const normalizedInput = cleanText(userText);
  const inputTokens = Array.from(
    new Set(
      normalizedInput
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 2)
    )
  );
  const analyzer = await loadSentimentAnalyzer();
  const jsSentimentScore = analyzer?.analyze?.(userText)?.score || 0;
  const pythonSentimentScore = Number(pythonMood?.compoundSentiment || 0) * 5;
  const sentimentScore = pythonSentimentScore || jsSentimentScore;
  const normalizedMovies = movies.map(normalizeMovie).filter(Boolean);
  const lowerTargetGenresByMood = moodProfiles.reduce((acc, profile) => {
    acc[profile.id] = profile.genres.map((genre) => genre.toLowerCase());
    return acc;
  }, {});

  const scoredMovies = normalizedMovies.map((movie) => {
    const movieGenres = Array.isArray(movie.genres)
      ? movie.genres.map((genre) =>
          typeof genre === "string" ? genre.toLowerCase() : String(genre?.name || "").toLowerCase()
        )
      : [];

    const searchableText = cleanText(
      `${movie.title || ""} ${movie.overview || ""} ${movie.tagline || ""}`
    );
    const titleText = cleanText(movie.title || "");

    let weightedGenreMatches = 0;
    let weightedOverviewHits = 0;
    for (const [moodId, weight] of Object.entries(moodDistribution)) {
      const profile = getMoodProfileById(moodId);
      if (!profile || !weight) continue;
      const targetGenres = lowerTargetGenresByMood[moodId] || [];
      const genreHits = movieGenres.filter((genre) => targetGenres.includes(genre)).length;
      const hintHits = countHits(searchableText, profile.overviewHints);
      weightedGenreMatches += genreHits * Number(weight);
      weightedOverviewHits += hintHits * Number(weight);
    }

    const directInputOverlap = countHits(searchableText, inputTokens);
    const titleOverlap = countHits(titleText, inputTokens);
    const ratingBoost = Number(movie.vote_average || 0) / 10;

    const score =
      weightedGenreMatches * 4.2 +
      weightedOverviewHits * 2.4 +
      directInputOverlap * 0.45 +
      titleOverlap * 0.6 +
      ratingBoost +
      sentimentScore * 0.12;

    return {
      ...movie,
      moodMatchScore: Number(score.toFixed(2)),
    };
  });

  const recommendations = scoredMovies
    .sort((a, b) => b.moodMatchScore - a.moodMatchScore)
    .slice(0, 8);

  return {
    mood: mood.label,
    moodId: mood.id,
    recommendations,
  };
};
