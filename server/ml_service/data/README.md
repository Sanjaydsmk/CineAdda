# Dataset Structure

This folder contains starter datasets for the ML service.

## `sentiment_reviews.csv`

Columns:
- `review_text`: raw user review text
- `label`: one of `positive`, `negative`, `neutral`

Used by: Review Sentiment Analysis model (TF-IDF + Logistic Regression).

## `movies_seed.csv` (optional seed format)

Columns:
- `movie_id`
- `title`
- `overview`
- `genres` (pipe-separated, e.g. `Action|Thriller`)
- `keywords` (pipe-separated)
- `cast` (pipe-separated)

Used by: Similar Movie Finder and cold-start personalized recommendations.

In production, CineAdda sends live movie data from MongoDB to the FastAPI service, so this is only a reference format.
