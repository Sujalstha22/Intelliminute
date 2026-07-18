import os
import tempfile
import librosa
import numpy as np
import soundfile as sf
import noisereduce as nr


# =========================
# CONFIG
# =========================
TARGET_SR = 16000

TARGET_DBFS = -20.0
MAX_GAIN_DB = 12.0

TRIM_TOP_DB = 30

CHUNK_DURATION = 30
CHUNK_OVERLAP = 3
MIN_CHUNK_DURATION = 5


# =========================
# LOAD AUDIO
# =========================
def load_audio(file_path: str, target_sr: int = TARGET_SR):
    """
    Loads audio as mono 16kHz float32.
    Whisper expects 16kHz mono audio.
    """
    y, sr = librosa.load(file_path, sr=target_sr, mono=True)

    y = np.asarray(y, dtype=np.float32)

    y = np.nan_to_num(y)

    return y, sr


# =========================
# BASIC AUDIO CHECKS
# =========================
def is_audio_empty(y: np.ndarray, threshold: float = 1e-5) -> bool:
    if y is None or len(y) == 0:
        return True

    return np.max(np.abs(y)) < threshold


def get_rms(y: np.ndarray) -> float:
    if len(y) == 0:
        return 0.0

    return float(np.sqrt(np.mean(y ** 2)))


# =========================
# NOISE ESTIMATION
# =========================
def estimate_noise_clip(y: np.ndarray, sr: int, frame_duration: float = 0.5):

    frame_length = int(sr * frame_duration)

    if len(y) < frame_length:
        return y

    frames = []
    rms_values = []

    for start in range(0, len(y) - frame_length, frame_length):
        frame = y[start:start + frame_length]
        frames.append(frame)
        rms_values.append(get_rms(frame))

    if not frames:
        return y[:frame_length]

    rms_values = np.array(rms_values)

    cutoff = np.percentile(rms_values, 10)
    noise_frames = [frames[i] for i, rms in enumerate(rms_values) if rms <= cutoff]

    if not noise_frames:
        return y[:frame_length]

    noise_clip = np.concatenate(noise_frames)

    return noise_clip.astype(np.float32)


def estimate_snr_db(y: np.ndarray, noise_clip: np.ndarray) -> float:
    """
    Rough SNR estimate.
    Higher SNR means cleaner audio.
    Lower SNR means noisier audio.
    """
    signal_power = np.mean(y ** 2) + 1e-10
    noise_power = np.mean(noise_clip ** 2) + 1e-10

    return float(10 * np.log10(signal_power / noise_power))


# =========================
# ADAPTIVE NOISE REDUCTION
# =========================
def reduce_noise_adaptive(y: np.ndarray, sr: int):
    """
    Applies noise reduction only as strongly as needed.
    Over-denoising can damage speech and make Whisper worse.
    """
    if is_audio_empty(y):
        return y

    try:
        noise_clip = estimate_noise_clip(y, sr)
        snr_db = estimate_snr_db(y, noise_clip)

        # Stronger denoise only when audio is very noisy
        if snr_db < 8:
            prop_decrease = 0.90
        elif snr_db < 15:
            prop_decrease = 0.75
        elif snr_db < 25:
            prop_decrease = 0.55
        else:
            # Audio is already fairly clean
            prop_decrease = 0.30

        reduced = nr.reduce_noise(
            y=y,
            sr=sr,
            y_noise=noise_clip,
            stationary=False,
            prop_decrease=prop_decrease
        )

        return np.asarray(reduced, dtype=np.float32)

    except Exception as e:
        print(f"[audio_preprocess] Noise reduction failed: {e}")
        return y


# =========================
# RMS NORMALIZATION
# =========================
def normalize_audio_rms(
    y: np.ndarray,
    target_dbfs: float = TARGET_DBFS,
    max_gain_db: float = MAX_GAIN_DB
):
    """
    RMS normalization is safer than peak normalization.

    Old code:
        y / max(abs(y))

    Problem:
        If the recording is quiet and noisy, peak normalization increases noise too much.

    This version:
        - normalizes average loudness
        - limits maximum gain
        - prevents clipping
    """
    if is_audio_empty(y):
        return y

    rms = get_rms(y)

    if rms <= 1e-8:
        return y

    target_rms = 10 ** (target_dbfs / 20.0)
    gain = target_rms / rms

    max_gain = 10 ** (max_gain_db / 20.0)
    gain = min(gain, max_gain)

    y = y * gain

    # Prevent clipping
    peak = np.max(np.abs(y))
    if peak > 0.98:
        y = y / peak * 0.98

    return y.astype(np.float32)


# =========================
# TRIM ONLY START/END SILENCE
# =========================
def trim_silence(y: np.ndarray, top_db: int = TRIM_TOP_DB):
    """
    Only trims leading/trailing silence.

    Do NOT aggressively remove all silence inside the meeting.
    Internal silence helps Whisper understand sentence boundaries.
    """
    if is_audio_empty(y):
        return y

    try:
        trimmed, _ = librosa.effects.trim(y, top_db=top_db)

        if len(trimmed) == 0:
            return y

        return trimmed.astype(np.float32)

    except Exception as e:
        print(f"[audio_preprocess] Silence trimming failed: {e}")
        return y


# =========================
# OPTIONAL CHUNKING
# =========================
def chunk_audio(
    y: np.ndarray,
    sr: int,
    chunk_duration: int = CHUNK_DURATION,
    overlap: int = CHUNK_OVERLAP,
    min_duration: int = MIN_CHUNK_DURATION
):
    """
    Creates overlapping chunks.

    Whisper works better with about 30 seconds of context.
    Overlap prevents losing words at chunk boundaries.
    """
    chunk_size = int(sr * chunk_duration)
    overlap_size = int(sr * overlap)
    step_size = chunk_size - overlap_size

    if step_size <= 0:
        raise ValueError("overlap must be smaller than chunk_duration")

    chunks = []

    for start in range(0, len(y), step_size):
        end = start + chunk_size
        chunk = y[start:end]

        if len(chunk) < sr * min_duration:
            continue

        chunks.append(chunk.astype(np.float32))

        if end >= len(y):
            break

    return chunks


# =========================
# SAVE AUDIO
# =========================
def save_audio(y: np.ndarray, sr: int, output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sf.write(output_path, y, sr)
    return output_path


def save_chunks(chunks, sr, output_dir="chunks"):
    os.makedirs(output_dir, exist_ok=True)

    paths = []

    for i, chunk in enumerate(chunks):
        path = os.path.join(output_dir, f"chunk_{i}.wav")
        sf.write(path, chunk, sr)
        paths.append(path)

    return paths


# =========================
# MAIN PREPROCESSING PIPELINE
# =========================
def preprocess_audio(file_path: str, save: bool = False, output_dir: str = "processed_audio"):
    """
    Full preprocessing pipeline.

    Recommended for Whisper:
        return one cleaned WAV file instead of many small chunks.

    Returns:
        cleaned_audio_path if save=True
        else cleaned numpy audio
    """
    y, sr = load_audio(file_path)

    if is_audio_empty(y):
        raise ValueError("Uploaded audio is empty or too silent.")

    y = trim_silence(y)
    y = reduce_noise_adaptive(y, sr)
    y = normalize_audio_rms(y)

    if save:
        filename = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(output_dir, f"{filename}_clean.wav")
        return save_audio(y, sr, output_path)

    return y, sr


# =========================
# OPTIONAL CHUNK PIPELINE
# =========================
def preprocess_audio_to_chunks(
    file_path: str,
    save: bool = False,
    output_dir: str = "chunks"
):
    """
    Only use this if the meeting audio is very long
    or your system has memory issues.

    Otherwise, Whisper should transcribe the cleaned full audio.
    """
    y, sr = preprocess_audio(file_path, save=False)

    chunks = chunk_audio(y, sr)

    if save:
        return save_chunks(chunks, sr, output_dir)

    return chunks, sr


# =========================
# DEBUG
# =========================
def debug_preprocess(file_path: str):
    y, sr = load_audio(file_path)

    print("Original duration:", round(len(y) / sr, 2), "seconds")
    print("Original RMS:", get_rms(y))

    noise_clip = estimate_noise_clip(y, sr)
    print("Estimated SNR:", round(estimate_snr_db(y, noise_clip), 2), "dB")

    y_trimmed = trim_silence(y)
    print("After trim:", round(len(y_trimmed) / sr, 2), "seconds")

    y_denoised = reduce_noise_adaptive(y_trimmed, sr)
    print("After denoise RMS:", get_rms(y_denoised))

    y_norm = normalize_audio_rms(y_denoised)
    print("After normalization RMS:", get_rms(y_norm))

    chunks = chunk_audio(y_norm, sr)
    print("Chunks:", len(chunks))

    return y_norm, sr