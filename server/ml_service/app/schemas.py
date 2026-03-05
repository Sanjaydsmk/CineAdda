from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class MovieInput(BaseModel):
    movie_id: str = Field(..., description="Unique movie identifier")
    title: str = ""
    overview: str = ""
    genres: List[str] = []
    keywords: List[str] = []
    cast: List[str] = []
    vote_average: float = 0.0
    runtime: int = 0
    release_date: str = ""


class InteractionInput(BaseModel):
    user_id: str
    movie_id: str
    rating: float = 0.0
    liked: bool = False
    watched: bool = False


class PersonalizedRequest(BaseModel):
    user_id: str
    movies: List[MovieInput]
    interactions: List[InteractionInput] = []
    top_k: int = 8


class SentimentRequest(BaseModel):
    review_text: str


class SimilarMoviesRequest(BaseModel):
    movie_id: str
    movies: List[MovieInput]
    top_k: int = 8


class RecommendationItem(BaseModel):
    movie_id: str
    score: float
    reason: str


class PersonalizedResponse(BaseModel):
    success: bool = True
    strategy: str
    recommendations: List[RecommendationItem]


class SentimentResponse(BaseModel):
    success: bool = True
    label: str
    confidence: float
    probabilities: Dict[str, float]


class SimilarMoviesResponse(BaseModel):
    success: bool = True
    source_movie_id: str
    recommendations: List[RecommendationItem]
