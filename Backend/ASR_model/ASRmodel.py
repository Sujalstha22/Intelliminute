import os
import torch
import torch.nn as nn
import torch.optim as optim
import librosa
import numpy as np

from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

# ======================
# DEVICE
# ======================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ======================
# TOKENIZER
# ======================
class CharTokenizer:
    def __init__(self):
        chars = list("abcdefghijklmnopqrstuvwxyz '")
        self.vocab = ["<blank>"] + chars

        self.char2idx = {c: i for i, c in enumerate(self.vocab)}
        self.idx2char = {i: c for c, i in self.char2idx.items()}

        self.blank_id = 0

    def encode(self, text):
        return [self.char2idx[c] for c in text.lower() if c in self.char2idx]

    def decode(self, ids):
        result = []
        prev = None
        for i in ids:
            if i != prev and i != self.blank_id:
                result.append(self.idx2char[i])
            prev = i
        return "".join(result)

tokenizer = CharTokenizer()

# ======================
# AUDIO PROCESSING
# ======================
def load_audio(path):
    audio, sr = librosa.load(path, sr=16000)
    return audio

def audio_to_mel(audio):
    mel = librosa.feature.melspectrogram(
        y=audio,
        sr=16000,
        n_mels=80,
        n_fft=400,
        hop_length=160
    )
    mel = librosa.power_to_db(mel)
    mel = (mel - mel.mean()) / (mel.std() + 1e-8)
    return torch.tensor(mel, dtype=torch.float32)

# ======================
# DATASET
# ======================
class LibriSpeechDataset(Dataset):
    def __init__(self, root_dir):
        self.samples = []

        for root, _, files in os.walk(root_dir):
            for file in files:
                if file.endswith(".trans.txt"):
                    txt_path = os.path.join(root, file)

                    with open(txt_path, "r") as f:
                        for line in f:
                            parts = line.strip().split(" ", 1)
                            if len(parts) < 2:
                                continue

                            audio_id = parts[0]
                            text = parts[1].lower()

                            audio_path = os.path.join(root, audio_id + ".flac")

                            if os.path.exists(audio_path):
                                self.samples.append((audio_path, text))

        print(f"Loaded {len(self.samples)} samples")

        if len(self.samples) == 0:
            print("ERROR: Dataset not found or not extracted!")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        audio_path, text = self.samples[idx]

        audio = load_audio(audio_path)
        mel = audio_to_mel(audio)

        tokens = tokenizer.encode(text)

        return mel, torch.tensor(tokens)

# ======================
# COLLATE FUNCTION
# ======================
def collate_fn(batch):
    mels, tokens = zip(*batch)

    max_mel = max(m.shape[1] for m in mels)
    max_tok = max(len(t) for t in tokens)

    mel_batch = []
    tok_batch = []
    input_lengths = []
    target_lengths = []

    for m, t in zip(mels, tokens):
        padded_m = torch.zeros(80, max_mel)
        padded_m[:, :m.shape[1]] = m

        padded_t = torch.zeros(max_tok, dtype=torch.long)
        padded_t[:len(t)] = t

        mel_batch.append(padded_m)
        tok_batch.append(padded_t)

        input_lengths.append(m.shape[1] // 2)
        target_lengths.append(len(t))

    return (
        torch.stack(mel_batch),
        torch.stack(tok_batch),
        torch.tensor(input_lengths),
        torch.tensor(target_lengths)
    )

# ======================
# MODEL
# ======================
class ASRModel(nn.Module):
    def __init__(self, vocab_size):
        super().__init__()

        self.cnn = nn.Sequential(
            nn.Conv1d(80, 128, 3, padding=1),
            nn.ReLU(),
            nn.Conv1d(128, 128, 3, stride=2, padding=1),
            nn.ReLU(),
        )

        self.lstm = nn.LSTM(
            128, 256,
            num_layers=2,
            bidirectional=True,
            batch_first=True
        )

        self.fc = nn.Linear(512, vocab_size)

    def forward(self, x):
        x = self.cnn(x)
        x = x.transpose(1, 2)
        x, _ = self.lstm(x)
        return self.fc(x)

# ======================
# TRAINING
# ======================
def train():
    dataset = LibriSpeechDataset("dataset/LibriSpeech1/train-clean-100")

    # ======================
    # SPLIT
    # ======================
    train_samples, test_samples = train_test_split(
        dataset.samples, test_size=0.3, random_state=42
    )

    # ======================
    # SIMPLE DATASET
    # ======================
    class SimpleDataset(Dataset):
        def __init__(self, samples):
            self.samples = samples

        def __len__(self):
            return len(self.samples)

        def __getitem__(self, idx):
            audio_path, text = self.samples[idx]

            audio = load_audio(audio_path)
            mel = audio_to_mel(audio)
            tokens = tokenizer.encode(text)

            return mel, torch.tensor(tokens)   # ✅ FIXED

    train_dataset = SimpleDataset(train_samples)
    test_dataset = SimpleDataset(test_samples)

    # ======================
    # DATALOADER
    # ======================
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True, collate_fn=collate_fn)
    test_loader = DataLoader(test_dataset, batch_size=8, collate_fn=collate_fn)

    # ======================
    # MODEL
    # ======================
    model = ASRModel(len(tokenizer.vocab)).to(device)

    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    ctc_loss = nn.CTCLoss(blank=tokenizer.blank_id)

    # ======================
    # TRAIN LOOP
    # ======================
    for epoch in range(5):
        total_loss = 0
        model.train()

        print(f"\n===== Epoch {epoch+1} =====")

        for step, (mels, tokens, input_lengths, target_lengths) in enumerate(train_loader):

            print(f"Step {step}", end="\r")

            mels = mels.to(device)
            tokens = tokens.to(device)

            logits = model(mels)
            log_probs = logits.log_softmax(2).transpose(0, 1)

            loss = ctc_loss(log_probs, tokens, input_lengths, target_lengths)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        print(f"\nEpoch {epoch+1} Loss: {total_loss:.4f}")

        # ======================
        # EVALUATION
        # ======================
        model.eval()

        all_preds = []
        all_targets = []

        with torch.no_grad():
            for mels, tokens, _, _ in test_loader:

                mels = mels.to(device)

                logits = model(mels)
                preds = logits.argmax(dim=-1).cpu()

                for i in range(len(tokens)):
                    pred_text = tokenizer.decode(preds[i].numpy())
                    target_text = tokenizer.decode(tokens[i].numpy())

                    pred_chars = list(pred_text)
                    target_chars = list(target_text)

                    min_len = min(len(pred_chars), len(target_chars))

                    if min_len > 0:
                        all_preds.extend(pred_chars[:min_len])
                        all_targets.extend(target_chars[:min_len])

        if len(all_targets) > 0:
            acc = accuracy_score(all_targets, all_preds)
            print(f"Validation Accuracy: {acc:.4f}")
        else:
            print("No valid predictions")

    torch.save(model.state_dict(), "asr_model.pt")
    print("\nModel saved!")
# ======================
# INFERENCE
# ======================
def transcribe(audio_path):
    model = ASRModel(len(tokenizer.vocab)).to(device)
    model.load_state_dict(torch.load("asr_model.pt", map_location=device))
    model.eval()

    audio = load_audio(audio_path)
    mel = audio_to_mel(audio).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(mel)[0]

    pred = logits.argmax(dim=-1).cpu().numpy()
    return tokenizer.decode(pred)

# ======================
# RUN
# ======================
if __name__ == "__main__":
    train()