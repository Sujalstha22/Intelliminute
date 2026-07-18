import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

INPUT_PATH = "../dataset/meeting_dataset.csv"
OUTPUT_PATH = "../dataset/extractive_dataset.csv"

TOP_K = 3

def split_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', str(text))
    return [s.strip() for s in sentences if len(s.strip()) > 10]

df = pd.read_csv(INPUT_PATH).dropna()

print(f"Loaded {len(df)} meetings")

# ✅ GLOBAL vectorizer
vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1,2))
vectorizer.fit(df["transcript"].tolist() + df["summary"].tolist())

dataset_rows = []

for idx, row in df.iterrows():
    transcript = row["transcript"]
    summary = row["summary"]

    sentences = split_sentences(transcript)

    if len(sentences) == 0:
        continue

    sent_vecs = vectorizer.transform(sentences)
    summary_vec = vectorizer.transform([summary])

    scores = cosine_similarity(sent_vecs, summary_vec).flatten()

    # ✅ Pick top K sentences instead of threshold
    ranked_idx = scores.argsort()[::-1]

    positive_idx = set(ranked_idx[:TOP_K])

    for i, sent in enumerate(sentences):
        label = 1 if i in positive_idx else 0

        dataset_rows.append({
            "sentence": sent,
            "label": label
        })

dataset_df = pd.DataFrame(dataset_rows)

print("Total sentences:", len(dataset_df))
print("Positive samples:", dataset_df["label"].sum())

dataset_df.to_csv(OUTPUT_PATH, index=False)

print("Dataset built successfully.")