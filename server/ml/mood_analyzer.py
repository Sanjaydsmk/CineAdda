#!/usr/bin/env python3
import json
import re
import sys
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


MOOD_PROFILES = {
    "happy": {
        "keywords": [
            "happy", "joy", "fun", "light", "uplifting", "cheerful", "smile",
            "positive", "bright", "feel good", "feel-good", "wholesome"
        ],
        "sentiment_bias": 0.9,
    },
    "sad": {
        "keywords": [
            "sad", "heartbreak", "lonely", "cry", "emotional", "grief", "loss",
            "melancholy", "tear", "pain", "heavy"
        ],
        "sentiment_bias": -0.7,
    },
    "romantic": {
        "keywords": [
            "love", "romance", "date", "couple", "relationship", "heart",
            "chemistry", "romantic", "valentine"
        ],
        "sentiment_bias": 0.2,
    },
    "thrilling": {
        "keywords": [
            "thrill", "adrenaline", "fast", "intense", "action", "excited",
            "suspense", "edge of my seat", "high energy", "high-energy"
        ],
        "sentiment_bias": 0.1,
    },
    "scary": {
        "keywords": [
            "scary", "horror", "fear", "dark", "ghost", "haunted", "creepy",
            "nightmare", "spooky", "terrifying"
        ],
        "sentiment_bias": -0.25,
    },
    "motivated": {
        "keywords": [
            "motivated", "inspire", "career", "growth", "winner", "success",
            "focus", "comeback", "discipline", "goal", "productive"
        ],
        "sentiment_bias": 0.55,
    },
    "calm": {
        "keywords": [
            "calm", "relax", "peaceful", "soft", "easy", "gentle", "slow",
            "chill", "comfort", "soothing"
        ],
        "sentiment_bias": 0.15,
    },
}

NEGATORS = {"not", "never", "no", "hardly", "barely", "without", "dont", "don't", "isnt", "isn't"}
INTENSIFIERS = {
    "very": 1.3,
    "really": 1.25,
    "extremely": 1.45,
    "super": 1.35,
    "too": 1.15,
    "quite": 1.1,
    "so": 1.1,
}


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_score_map(scores: dict) -> dict:
    total = sum(max(v, 0.0) for v in scores.values())
    if total <= 0:
        uniform = 1.0 / max(len(scores), 1)
        return {k: round(uniform, 4) for k in scores}
    return {k: round(max(v, 0.0) / total, 4) for k, v in scores.items()}


def token_weight(tokens: list, idx: int) -> float:
    window = tokens[max(0, idx - 2):idx]
    weight = 1.0
    for token in window:
        weight *= INTENSIFIERS.get(token, 1.0)
    return weight


def has_negation_near(tokens: list, idx: int) -> bool:
    window = tokens[max(0, idx - 3):idx]
    return any(token in NEGATORS for token in window)


def infer_mood(text: str):
    normalized = clean_text(text)
    tokens = normalized.split(" ") if normalized else []
    analyzer = SentimentIntensityAnalyzer()
    sentiment = analyzer.polarity_scores(normalized)
    compound = sentiment["compound"]

    mood_scores = {}
    for mood_id, profile in MOOD_PROFILES.items():
        keywords = profile["keywords"]
        score = 0.0
        for word in keywords:
            if " " in word:
                if word in normalized:
                    score += 2.2
                continue
            for idx, token in enumerate(tokens):
                if token == word or token.startswith(word):
                    local_weight = token_weight(tokens, idx)
                    if has_negation_near(tokens, idx):
                        score -= 1.2 * local_weight
                    else:
                        score += 1.8 * local_weight
        # Blend sentence-level sentiment with mood prior.
        score += (1.0 - abs(compound - profile["sentiment_bias"])) * 0.9
        mood_scores[mood_id] = score

    # Global sentiment priors.
    if compound >= 0.6:
        mood_scores["happy"] += 1.0
        mood_scores["motivated"] += 0.6
    elif compound <= -0.6:
        mood_scores["sad"] += 1.0
        mood_scores["calm"] += 0.8
    else:
        mood_scores["thrilling"] += 0.4

    sorted_moods = sorted(mood_scores.items(), key=lambda x: x[1], reverse=True)
    top_mood_id, top_score = sorted_moods[0]
    second_score = sorted_moods[1][1] if len(sorted_moods) > 1 else 0.0
    confidence = min(0.97, 0.56 + max(0.0, top_score - second_score) * 0.09)
    normalized_mood_scores = normalize_score_map(mood_scores)

    return {
        "mood_id": top_mood_id,
        "confidence": round(max(0.45, confidence), 3),
        "compound_sentiment": round(compound, 4),
        "mood_scores": normalized_mood_scores,
    }


def main():
    text = sys.argv[1] if len(sys.argv) > 1 else ""
    result = infer_mood(text)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
