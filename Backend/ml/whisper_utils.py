import re
import whisper

from ml.audio_preprocess import (
    preprocess_audio,
    preprocess_audio_to_chunks
)


_model_cache = {}


# =========================
# LOAD WHISPER MODEL
# =========================
def load_model(model_size: str = "small"):

    global _model_cache

    if model_size not in _model_cache:
        print(f"[whisper_utils] Loading Whisper model: {model_size}")
        _model_cache[model_size] = whisper.load_model(model_size)

    return _model_cache[model_size]


# =========================
# TEXT CLEANING
# =========================
def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\b(\w+)(\s+\1\b)+", r"\1", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    return text.strip()
# =========================
# SEGMENT FILTERING
# =========================
def is_bad_segment(segment: dict) -> bool:
    """
    Filters out likely hallucinated/no-speech segments.
    Whisper sometimes hallucinates text in silence or heavy noise.
    """
    text = segment.get("text", "").strip()

    if not text:
        return True

    no_speech_prob = segment.get("no_speech_prob", 0.0)
    avg_logprob = segment.get("avg_logprob", 0.0)
    compression_ratio = segment.get("compression_ratio", 0.0)

    # High no-speech + low confidence
    if no_speech_prob > 0.75 and avg_logprob < -1.0:
        return True

    # Repetitive hallucination indicator
    if compression_ratio > 2.6:
        return True

    return False


def extract_text_from_segments(result: dict) -> str:
    segments = result.get("segments", [])

    cleaned_segments = []

    for segment in segments:
        if is_bad_segment(segment):
            continue

        text = clean_text(segment.get("text", ""))
        if text:
            cleaned_segments.append(text)

    return " ".join(cleaned_segments).strip()


# =========================
# MAIN FULL-AUDIO TRANSCRIPTION
# =========================
def transcribe_audio(
    file_path: str,
    model_size: str = "small",
    language: str = "en",
    use_preprocessing: bool = True
):
    """
    Recommended pipeline:
        raw audio
        -> cleaned WAV
        -> Whisper full transcription

    This is usually better than manually sending 15-second chunks.
    """
    model = load_model(model_size)

    if use_preprocessing:
        audio_input = preprocess_audio(file_path, save=True)
    else:
        audio_input = file_path

    initial_prompt = (
        "This is a meeting transcript. The speakers may discuss tasks, deadlines, "
        "project updates, decisions, action items, issues, and follow-up work. "
        "Please transcribe clearly with proper punctuation."
    )

    try:
        result = model.transcribe(
            audio_input,
            language=language,
            task="transcribe",
            fp16=False,

            # Better decoding quality
            temperature=0.0,
            beam_size=5,

            # Keeps context between Whisper's internal segments
            condition_on_previous_text=True,

            # Helps Whisper understand meeting-style audio
            initial_prompt=initial_prompt,

            # Silence/noise controls
            no_speech_threshold=0.6,
            logprob_threshold=-1.0,
            compression_ratio_threshold=2.4,

            verbose=False
        )

        transcript = extract_text_from_segments(result)

        if not transcript:
            transcript = clean_text(result.get("text", ""))

        return transcript

    except Exception as e:
        print(f"[whisper_utils] Transcription failed: {e}")
        raise e


# =========================
# FALLBACK CHUNK TRANSCRIPTION
# =========================
def transcribe_audio_in_chunks(
    file_path: str,
    model_size: str = "small",
    language: str = "en"
):
    """
    Use this only for very long audio or low-memory machines.

    Uses 30-second overlapping chunks instead of 15-second hard chunks.
    """
    model = load_model(model_size)

    chunks, sr = preprocess_audio_to_chunks(file_path, save=False)

    transcripts = []

    initial_prompt = (
        "This is a meeting transcript with discussion, decisions, action items, "
        "deadlines, and project updates."
    )

    previous_text = ""

    for i, chunk in enumerate(chunks):
        try:
            prompt = initial_prompt

            if previous_text:
                prompt += " Previous context: " + previous_text[-300:]

            result = model.transcribe(
                chunk,
                language=language,
                task="transcribe",
                fp16=False,
                temperature=0.0,
                beam_size=5,
                condition_on_previous_text=True,
                initial_prompt=prompt,
                no_speech_threshold=0.6,
                logprob_threshold=-1.0,
                compression_ratio_threshold=2.4,
                verbose=False
            )

            text = extract_text_from_segments(result)

            if not text:
                text = clean_text(result.get("text", ""))

            if text:
                transcripts.append(text)
                previous_text += " " + text

        except Exception as e:
            print(f"[whisper_utils] Error in chunk {i}: {e}")
            continue

    return merge_transcripts(transcripts)


# =========================
# TRANSCRIPT MERGING
# =========================
def merge_transcripts(chunks_text):
    """
    Merges chunked transcripts and reduces duplicate overlap text.
    """
    final_text = ""

    for text in chunks_text:
        text = clean_text(text)

        if not text:
            continue

        if not final_text:
            final_text = text
            continue

        # Simple overlap duplicate prevention
        overlap_found = False

        for overlap_size in range(80, 20, -10):
            if len(final_text) < overlap_size or len(text) < overlap_size:
                continue

            if final_text[-overlap_size:].lower() in text[:overlap_size * 2].lower():
                final_text += " " + text[overlap_size:]
                overlap_found = True
                break

        if not overlap_found:
            final_text += " " + text

    return clean_text(final_text)