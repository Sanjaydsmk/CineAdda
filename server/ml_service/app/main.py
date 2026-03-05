from fastapi import FastAPI

from .ml_models import (
    personalized_recommendations,
    similar_movies,
    train_or_load_sentiment_model,
)
from .schemas import (
    PersonalizedRequest,
    PersonalizedResponse,
    SentimentRequest,
    SentimentResponse,
    SimilarMoviesRequest,
    SimilarMoviesResponse,
)

app = FastAPI(title="CineAdda ML Service", version="1.0.0")

sentiment_pipeline = train_or_load_sentiment_model()


@app.get("/health")
def health():
    return {"success": True, "status": "ok"}


@app.post("/api/personalized", response_model=PersonalizedResponse)
def personalized(payload: PersonalizedRequest):
    recs, strategy = personalized_recommendations(
        user_id=payload.user_id,
        movies=payload.movies,
        interactions=payload.interactions,
        top_k=payload.top_k,
    )
    return PersonalizedResponse(strategy=strategy, recommendations=recs)


@app.post("/api/sentiment", response_model=SentimentResponse)
def sentiment(payload: SentimentRequest):
    probs = sentiment_pipeline.predict_proba([payload.review_text])[0]
    labels = list(sentiment_pipeline.classes_)
    label_probs = {label: float(prob) for label, prob in zip(labels, probs)}
    predicted = labels[int(probs.argmax())]
    confidence = float(max(probs))

    return SentimentResponse(
        label=predicted,
        confidence=round(confidence, 4),
        probabilities={k: round(v, 4) for k, v in label_probs.items()},
    )


@app.post("/api/similar", response_model=SimilarMoviesResponse)
def similar(payload: SimilarMoviesRequest):
    recs = similar_movies(
        source_movie_id=payload.movie_id,
        movies=payload.movies,
        top_k=payload.top_k,
    )
    return SimilarMoviesResponse(source_movie_id=payload.movie_id, recommendations=recs)
