# CineAdda ML Service (FastAPI)

This microservice provides:
1. Personalized Movie Recommendation (`/api/personalized`)
2. Review Sentiment Analysis (`/api/sentiment`)
3. Similar Movie Finder (`/api/similar`)

## Setup

```bash
cd server/ml_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_sentiment.py
uvicorn app.main:app --reload --port 8000
```

## Node Integration

Set in `server/.env`:

```env
ML_API_BASE_URL=http://127.0.0.1:8000
```

Node backend proxies these endpoints:
- `POST /api/ml/personalized` (auth required)
- `POST /api/ml/sentiment`
- `GET /api/ml/similar/:movieId?top_k=8`

## Folder Structure

```text
server/ml_service/
  app/
    __init__.py
    main.py
    ml_models.py
    schemas.py
  data/
    README.md
    sentiment_reviews.csv
  models/
    sentiment_pipeline.joblib   # generated after training
  requirements.txt
  train_sentiment.py
```
