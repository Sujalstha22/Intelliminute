import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/intelliminute")

_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
        try:
            _client.admin.command("ping")
            print("MongoDB connected successfully.")
        except ConnectionFailure as e:
            print(f"MongoDB connection failed: {e}")
            raise
    return _client.get_default_database()
