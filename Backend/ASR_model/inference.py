import torch
import numpy as np
import librosa

from ASRmodel import ASRModel, tokenizer  # reuse tokenizer + model class

# ======================
# DEVICE
# ======================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ======================
# LOAD MODEL
# ======================
model = ASRModel(len(tokenizer.vocab)).to(device)
model.load_state_dict(torch.load("asr_model.pt", map_location=device))
model.eval()

print("✅ ASR Model Loaded")

# ======================
# AUDIO PREPROCESSING
# ======================
def load_audio(path):
    audio, sr = librosa.load(path, sr=16000)

    # normalize
    if np.max(np.abs(audio)) > 0:
        audio = audio / np.max(np.abs(audio))

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
    mel = (mel - mel.mean()) / (mel.std() + 1e-6)

    return torch.tensor(mel, dtype=torch.float32)


# ======================
# CHUNKING (IMPORTANT)
# ======================
def split_audio(audio, chunk_seconds=5):
    chunk_size = 16000 * chunk_seconds

    chunks = []
    for i in range(0, len(audio), chunk_size):
        chunk = audio[i:i + chunk_size]

        if len(chunk) < chunk_size:
            chunk = np.pad(chunk, (0, chunk_size - len(chunk)))

        chunks.append(chunk)

    return chunks


# ======================
# CTC DECODERS
# ======================
def ctc_greedy_decode(logits):
    pred_ids = np.argmax(logits, axis=-1)

    decoded = []
    prev = -1

    for p in pred_ids:
        if p != prev and p != 0:  # remove duplicates + blanks
            decoded.append(p)
        prev = p

    return decoded


def ctc_beam_search(logits, beam_width=3):
    T, V = logits.shape
    beams = [([], 0)]

    for t in range(T):
        new_beams = []

        for seq, score in beams:
            for v in range(V):
                new_seq = seq + [v]
                new_score = score + logits[t][v]
                new_beams.append((new_seq, new_score))

        new_beams = sorted(new_beams, key=lambda x: x[1], reverse=True)[:beam_width]
        beams = new_beams

    best_seq = beams[0][0]

    # CTC collapse
    final = []
    prev = -1
    for p in best_seq:
        if p != prev and p != 0:
            final.append(p)
        prev = p

    return final


# ======================
# SINGLE CHUNK TRANSCRIPTION
# ======================
def transcribe_chunk(chunk, use_beam=False):
    mel = audio_to_mel(chunk)

    # pad to fixed size
    if mel.shape[1] < 300:
        pad = torch.zeros(80, 300 - mel.shape[1])
        mel = torch.cat([mel, pad], dim=1)
    else:
        mel = mel[:, :300]

    mel = mel.unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(mel)  # (B, T, V)

    logits = logits[0].cpu().numpy()

    if use_beam:
        token_ids = ctc_beam_search(logits)
    else:
        token_ids = ctc_greedy_decode(logits)

    text = tokenizer.decode(token_ids)
    return text


# ======================
# FULL AUDIO TRANSCRIPTION
# ======================
def transcribe_audio(filepath, use_beam=False):
    audio = load_audio(filepath)

    chunks = split_audio(audio, chunk_seconds=5)

    full_text = []

    print(f"🔊 Processing {len(chunks)} chunks...")

    for i, chunk in enumerate(chunks):
        print(f"Chunk {i+1}/{len(chunks)}")

        text = transcribe_chunk(chunk, use_beam=use_beam)

        if text.strip():
            full_text.append(text)

    final_transcript = " ".join(full_text)

    return final_transcript


# ======================
# TEST RUN
# ======================
if __name__ == "__main__":
    path = "test.wav"  # replace with your audio file

    text = transcribe_audio(path, use_beam=True)

    print("\n===== TRANSCRIPT =====\n")
    print(text)