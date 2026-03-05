from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import Pipeline

from .schemas import InteractionInput, MovieInput, RecommendationItem

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
SENTIMENT_MODEL_PATH = MODEL_DIR / "sentiment_pipeline.joblib"


def _movie_feature_text(movie: MovieInput) -> str:
    genres = " ".join(movie.genres or [])
    keywords = " ".join(movie.keywords or [])
    cast = " ".join(movie.cast or [])
    return f"{movie.title} {movie.overview} {genres} {keywords} {cast}".strip().lower()


def train_or_load_sentiment_model() -> Pipeline:
    if SENTIMENT_MODEL_PATH.exists():
        return joblib.load(SENTIMENT_MODEL_PATH)

    csv_path = DATA_DIR / "sentiment_reviews.csv"
    if not csv_path.exists():
        raise FileNotFoundError(
            "Missing sentiment dataset. Add server/ml_service/data/sentiment_reviews.csv"
        )

    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["review_text", "label"])

    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words="english")),
            ("clf", LogisticRegression(max_iter=1200, class_weight="balanced")),
        ]
    )
    pipeline.fit(df["review_text"], df["label"])
    joblib.dump(pipeline, SENTIMENT_MODEL_PATH)
    return pipeline


def similar_movies(
    source_movie_id: str, movies: List[MovieInput], top_k: int = 8
) -> List[RecommendationItem]:
    if not movies:
        return []

    movie_ids = [movie.movie_id for movie in movies]
    if source_movie_id not in movie_ids:
        return []

    corpus = [_movie_feature_text(movie) for movie in movies]
    vectorizer = TfidfVectorizer(max_features=8000, ngram_range=(1, 2), stop_words="english")
    matrix = vectorizer.fit_transform(corpus)

    source_idx = movie_ids.index(source_movie_id)
    sims = cosine_similarity(matrix[source_idx], matrix).flatten()

    ranked: List[Tuple[int, float]] = sorted(
        [(idx, float(score)) for idx, score in enumerate(sims) if movie_ids[idx] != source_movie_id],
        key=lambda x: x[1],
        reverse=True,
    )[:top_k]

    return [
        RecommendationItem(
            movie_id=movie_ids[idx],
            score=round(score, 4),
            reason="High content similarity (genres/overview/keywords/cast)",
        )
        for idx, score in ranked
    ]


def _build_user_profile_vector(
    user_id: str,
    interactions: List[InteractionInput],
    movie_id_to_index: Dict[str, int],
    movie_matrix,
):
    watched = [item for item in interactions if item.user_id == user_id and item.movie_id in movie_id_to_index]
    if not watched:
        return None, []

    vectors = []
    weights = []
    watched_movie_ids = []
    for item in watched:
        idx = movie_id_to_index[item.movie_id]
        watched_movie_ids.append(item.movie_id)
        strength = 1.0
        if item.watched:
            strength += 0.5
        if item.liked:
            strength += 1.0
        if item.rating > 0:
            strength += min(item.rating / 5.0, 1.0)
        vectors.append(movie_matrix[idx].toarray()[0])
        weights.append(strength)

    if not vectors:
        return None, []

    profile = np.average(np.array(vectors), axis=0, weights=np.array(weights))
    return profile.reshape(1, -1), watched_movie_ids


def _collaborative_scores(
    user_id: str,
    interactions: List[InteractionInput],
) -> Dict[str, float]:
    user_movie_score = defaultdict(lambda: defaultdict(float))
    movie_users = defaultdict(set)

    for item in interactions:
        base = 0.0
        if item.watched:
            base += 0.5
        if item.liked:
            base += 1.5
        if item.rating > 0:
            base += item.rating / 5.0
        if base <= 0:
            continue
        user_movie_score[item.user_id][item.movie_id] += base
        movie_users[item.movie_id].add(item.user_id)

    target_movies = set(user_movie_score[user_id].keys())
    if not target_movies:
        return {}

    user_similarity: Dict[str, float] = {}
    target_ratings = user_movie_score[user_id]
    for other_user, other_ratings in user_movie_score.items():
        if other_user == user_id:
            continue
        common = set(target_ratings.keys()) & set(other_ratings.keys())
        if not common:
            continue
        dot = sum(target_ratings[m] * other_ratings[m] for m in common)
        norm_a = np.sqrt(sum(v * v for v in target_ratings.values()))
        norm_b = np.sqrt(sum(v * v for v in other_ratings.values()))
        if norm_a > 0 and norm_b > 0:
            user_similarity[other_user] = dot / (norm_a * norm_b)

    scores: Dict[str, float] = defaultdict(float)
    for other_user, sim in user_similarity.items():
        if sim <= 0:
            continue
        for movie_id, score in user_movie_score[other_user].items():
            if movie_id in target_movies:
                continue
            scores[movie_id] += sim * score
    return dict(scores)


def personalized_recommendations(
    user_id: str,
    movies: List[MovieInput],
    interactions: List[InteractionInput],
    top_k: int = 8,
) -> Tuple[List[RecommendationItem], str]:
    if not movies:
        return [], "no_data"

    movie_ids = [movie.movie_id for movie in movies]
    movie_id_to_index = {movie_id: idx for idx, movie_id in enumerate(movie_ids)}
    corpus = [_movie_feature_text(movie) for movie in movies]
    vectorizer = TfidfVectorizer(max_features=8000, ngram_range=(1, 2), stop_words="english")
    movie_matrix = vectorizer.fit_transform(corpus)

    profile_vector, watched_movie_ids = _build_user_profile_vector(
        user_id=user_id,
        interactions=interactions,
        movie_id_to_index=movie_id_to_index,
        movie_matrix=movie_matrix,
    )

    if profile_vector is None:
        top = sorted(movies, key=lambda m: m.vote_average, reverse=True)[:top_k]
        return (
            [
                RecommendationItem(
                    movie_id=movie.movie_id,
                    score=round(float(movie.vote_average), 4),
                    reason="Popular fallback (no user history yet)",
                )
                for movie in top
            ],
            "popularity_fallback",
        )

    content_scores = cosine_similarity(profile_vector, movie_matrix).flatten()
    collab_scores = _collaborative_scores(user_id=user_id, interactions=interactions)

    ranked = []
    watched_set = set(watched_movie_ids)
    for movie in movies:
        if movie.movie_id in watched_set:
            continue
        idx = movie_id_to_index[movie.movie_id]
        content_score = float(content_scores[idx])
        collab_score = float(collab_scores.get(movie.movie_id, 0.0))
        final_score = (content_score * 0.7) + (collab_score * 0.3)
        ranked.append((movie.movie_id, final_score, content_score, collab_score))

    ranked.sort(key=lambda x: x[1], reverse=True)
    top = ranked[:top_k]

    recommendations = []
    for movie_id, final_score, content_score, collab_score in top:
        reason = f"Content match {content_score:.2f}"
        if collab_score > 0:
            reason += f", collaborative signal {collab_score:.2f}"
        recommendations.append(
            RecommendationItem(movie_id=movie_id, score=round(final_score, 4), reason=reason)
        )

    return recommendations, "hybrid_content_collaborative"
