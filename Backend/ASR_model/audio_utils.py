import librosa
import numpy as np

TARGET_SR = 16000

def load_audio(path):
    audio, sr = librosa.load(path, sr=TARGET_SR)

    # normalize
    if np.max(np.abs(audio)) > 0:
        audio = audio / np.max(np.abs(audio))

    return audio


def audio_to_mel(audio):
    mel = librosa.feature.melspectrogram(
        y=audio,
        sr=TARGET_SR,
        n_mels=80,
        n_fft=400,
        hop_length=160
    )
    mel = librosa.power_to_db(mel)
    mel = (mel - mel.mean()) / (mel.std() + 1e-8)
    return mel


# ======================
# CHUNKING (KEY FEATURE)
# ======================
def chunk_audio(audio, chunk_sec=10, overlap_sec=1):
    chunk_size = chunk_sec * TARGET_SR
    overlap = overlap_sec * TARGET_SR

    chunks = []
    start = 0

    while start < len(audio):
        end = start + chunk_size
        chunk = audio[start:end]

        if len(chunk) < chunk_size:
            break

        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks