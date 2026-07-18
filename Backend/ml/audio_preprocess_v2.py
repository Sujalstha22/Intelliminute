import librosa
import numpy as np
import webrtcvad
import collections
import soundfile as sf

from pyannote.audio import Pipeline


# =========================
# CONFIG
# =========================
TARGET_SR = 16000
FRAME_DURATION = 30  # ms
VAD_MODE = 2  # 0-3 (3 = aggressive)


# =========================
# LOAD AUDIO
# =========================
def load_audio(path):
    y, sr = librosa.load(path, sr=TARGET_SR, mono=True)
    return y, sr


# =========================
# FRAME GENERATOR
# =========================
def frame_generator(audio, sr, frame_duration_ms):
    frame_size = int(sr * frame_duration_ms / 1000)
    for i in range(0, len(audio), frame_size):
        yield audio[i:i+frame_size]


# =========================
# VAD FILTER
# =========================
def apply_vad(y, sr):
    vad = webrtcvad.Vad(VAD_MODE)

    frames = list(frame_generator(y, sr, FRAME_DURATION))

    speech = []

    for frame in frames:
        if len(frame) < int(sr * FRAME_DURATION / 1000):
            continue

        pcm = (frame * 32768).astype(np.int16).tobytes()

        if vad.is_speech(pcm, sr):
            speech.extend(frame)

    return np.array(speech)


# =========================
# CHUNK AFTER VAD
# =========================
def chunk_audio(y, sr, duration=15):
    size = int(sr * duration)

    chunks = []
    for i in range(0, len(y), size):
        chunk = y[i:i+size]

        if len(chunk) > sr * 3:
            chunks.append(chunk)

    return chunks


# =========================
# SPEAKER DIARIZATION
# =========================
def diarize_audio(file_path, hf_token):
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization",
        use_auth_token=hf_token
    )

    diarization = pipeline(file_path)

    segments = []

    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": speaker
        })

    return segments


# =========================
# MAP AUDIO TO SPEAKERS
# =========================
def extract_speaker_chunks(y, sr, segments):
    speaker_chunks = []

    for seg in segments:
        start = int(seg["start"] * sr)
        end = int(seg["end"] * sr)

        audio_chunk = y[start:end]

        if len(audio_chunk) > sr * 2:
            speaker_chunks.append({
                "speaker": seg["speaker"],
                "audio": audio_chunk
            })

    return speaker_chunks


# =========================
# FULL PIPELINE
# =========================
def preprocess_with_diarization(file_path, hf_token):
    # 1. Load
    y, sr = load_audio(file_path)

    # 2. Apply VAD
    y_vad = apply_vad(y, sr)

    # 3. Diarization (on original audio)
    segments = diarize_audio(file_path, hf_token)

    # 4. Extract speaker chunks
    speaker_chunks = extract_speaker_chunks(y, sr, segments)

    return speaker_chunks