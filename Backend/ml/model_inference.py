import whisper
import os

_whisper_model = None

def load_model():
    global _whisper_model
    if _whisper_model is None:
        print("Loading Whisper model...")
        _whisper_model = whisper.load_model("base")  # you can change to small/medium later
    return _whisper_model

# ======================
# TRANSCRIBE AUDIO
# ======================
def transcribe_audio(file_path):

    if not os.path.exists(file_path):
        raise FileNotFoundError("Audio file not found")

    model = load_model()

    try:
        print("Transcribing with Whisper...")

        result = model.transcribe(
            file_path,
            fp16=False 
        )

        transcript = result.get("text", "").strip()

        if not transcript:
            print(" Empty transcript returned")
            return ""

        return transcript

    except Exception as e:
        print(" Whisper Error:", e)
        return ""