from app.ml_models import train_or_load_sentiment_model


if __name__ == "__main__":
    model = train_or_load_sentiment_model()
    print("Sentiment model ready:", type(model).__name__)
