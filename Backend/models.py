import datetime
from bson import ObjectId


FREE_MEETING_LIMIT = 3


def new_user(email: str, hashed_password: str, name: str, role: str = "user") -> dict:
    """Returns a new user document ready to insert into MongoDB."""
    return {
        "email": email.lower().strip(),
        "password": hashed_password,
        "name": name,
        "role": role,                      # "user" | "admin"
        "subscribed": False,
        "meeting_count": 0,                # total meetings processed
        "created_at": datetime.datetime.utcnow(),
    }


def new_meeting(
    user_id: ObjectId,
    title: str,
    meeting_type: str,
    summary,
    transcript: str,
    participants: list,
    action_items: list,
    decision_items: list,
    audio_filename: str,

    # NEW
    quality_metrics: dict = None,
) -> dict:
    """Returns a meeting document ready to insert into MongoDB."""

    return {
        "user_id": user_id,

        "title": title,
        "meeting_type": meeting_type,

        "audio_filename": audio_filename,

        "summary": summary,
        "transcript": transcript,

        "participants": participants,
        "action_items": action_items,
        "decision_items": decision_items,

        # NEW QUALITY DATA
        "quality_metrics": quality_metrics or {
            "overall_confidence": 0,
            "transcript_quality": 0,
            "summary_confidence": 0,
            "meeting_type_match": 0,
            "detected_meeting_type": "general",
            "warnings": []
        },

        "created_at": datetime.datetime.utcnow(),
    }

def serialize_user(user: dict) -> dict:
    """Strips sensitive fields and converts ObjectId to str for JSON response."""
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "subscribed": user.get("subscribed", False),
        "meeting_count": user.get("meeting_count", 0),
        "created_at": user["created_at"].isoformat(),
    }


def serialize_meeting(meeting: dict) -> dict:
    return {
        "id": str(meeting["_id"]),
        "user_id": str(meeting["user_id"]),

        "title": meeting.get("title", "Untitled Meeting"),
        "meeting_type": meeting.get("meeting_type", "general"),

        "audio_filename": meeting.get("audio_filename", ""),

        "summary": meeting.get("summary", ""),
        "transcript": meeting.get("transcript", ""),

        "participants": meeting.get("participants", []),

        "action_items": meeting.get("action_items", []),
        "decision_items": meeting.get("decision_items", []),

        # NEW
        "quality_metrics": meeting.get("quality_metrics", {
            "overall_confidence": 0,
            "transcript_quality": 0,
            "summary_confidence": 0,
            "meeting_type_match": 0,
            "detected_meeting_type": "general",
            "warnings": []
        }),

        "created_at": meeting["created_at"].isoformat(),
    }