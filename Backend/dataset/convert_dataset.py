import json
import pandas as pd

INPUT_FILE = "meeting_dataset_cleaned.json"
OUTPUT_FILE = "meeting_dataset.csv"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

rows = []

for item in data:
    rows.append({
        "transcript": item.get("transcript", ""),
        "summary": item.get("summary", ""),
        "category": item.get("category", "general")
    })

df = pd.DataFrame(rows)
df.to_csv(OUTPUT_FILE, index=False)

print("✅ Converted JSON → CSV successfully")