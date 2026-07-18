import os
import uuid
from flask import Flask,request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

from Database.connection import get_db
from auth import generate_token, token_required, admin_required
from models import (
    new_user,
    new_meeting,
    serialize_user,
    serialize_meeting,
    FREE_MEETING_LIMIT,
)

from ml.whisper_utils import transcribe_audio
from ml.model import analyze_meeting, clean_transcript

app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)


UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

get_db()  
# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed = generate_password_hash(password)
    user_doc = new_user(email, hashed, name)
    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = generate_token(str(result.inserted_id), user_doc["role"])
    return jsonify({"token": token, "user": serialize_user(user_doc)}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(str(user["_id"]), user["role"])
    return jsonify({"token": token, "user": serialize_user(user)}), 200


@app.route("/api/auth/me", methods=["GET"])
@token_required
def me():
    return jsonify(serialize_user(request.current_user)), 200


@app.route("/api/meetings/upload", methods=["POST"])
@token_required
def upload_meeting():
    user = request.current_user
    db = get_db()

    # Free-tier check
    if user.get("meeting_count", 0) >= FREE_MEETING_LIMIT and not user.get("subscribed", False):
        return jsonify({
            "error": "free_limit_reached",
            "message": f"You have used all {FREE_MEETING_LIMIT} free meetings."
        }), 402

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    meeting_title = request.form.get("meetingTitle", "Untitled Meeting")
    meeting_type = request.form.get("meetingType", "general").lower()

    filename = f"{uuid.uuid4()}_{audio_file.filename}"
    path = os.path.join(UPLOAD_FOLDER, filename)
    audio_file.save(path)

    try:
        print("Transcribing...")

        transcript = transcribe_audio(path)
        transcript = clean_transcript(transcript)

        timeline = []
        dominant = "UNKNOWN"
        consistency = 0.0

        analysis = analyze_meeting(
            transcript,
            timeline,
            consistency,
            meeting_type=meeting_type
        )

        meeting_doc = new_meeting(
            user_id=user["_id"],
            title=meeting_title,
            meeting_type=meeting_type,
            summary=analysis.get("summary", []),
            transcript=transcript,
            participants=[],
            action_items=analysis.get("action_items", []),
            decision_items=analysis.get("decisions", []),
            audio_filename=filename,
            quality_metrics=analysis.get("quality_metrics", {})
        )       

        result = db.meetings.insert_one(meeting_doc)
        meeting_doc["_id"] = result.inserted_id

        db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"meeting_count": 1}},
        )

        return jsonify({
            "meeting": serialize_meeting(meeting_doc),
            "analysis": analysis,
            "dominant_speaker": dominant,
            "speaker_timeline": timeline
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(path):
            os.remove(path)

@app.route("/api/meetings/upload-demo", methods=["POST"])
def upload_meeting_demo():
    db = get_db()

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    meeting_title = request.form.get("meetingTitle", "Untitled Meeting")
    meeting_type = request.form.get("meetingType", "general").lower()

    filename = f"{uuid.uuid4()}_{audio_file.filename}"
    path = os.path.join(UPLOAD_FOLDER, filename)
    audio_file.save(path)

    try:
        print("Transcribing (demo)...")

        transcript = transcribe_audio(path)
        transcript = clean_transcript(transcript)

        analysis = analyze_meeting(
            transcript,
            [],   # timeline
            0.0,  # consistency
            meeting_type=meeting_type
        )

        return jsonify({
            "id": str(uuid.uuid4()),  
            "meetingTitle": meeting_title,
            "meetingType": meeting_type,
            "analysis": analysis,
            "transcript": transcript,
            "dominant_speaker": "UNKNOWN",
            "speaker_timeline": []
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(path):
            os.remove(path)

@app.route("/api/meetings", methods=["GET"])
@token_required
def get_my_meetings():
    try:
        db = get_db()
        user = request.current_user

        meetings = list(
            db.meetings.find(
                {"user_id": user["_id"]}
            ).sort("created_at", -1)
        )

        serialized = [
            serialize_meeting(m)
            for m in meetings
        ]

        return jsonify(serialized), 200

    except Exception as e:
        print("GET MEETINGS ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
    
@app.route("/api/meetings/<meeting_id>", methods=["GET"])
@token_required
def get_meeting(meeting_id):
    try:
        db = get_db()
        user = request.current_user

        meeting = db.meetings.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": user["_id"]
        })

        if not meeting:
            return jsonify({
                "error": "Meeting not found"
            }), 404

        return jsonify({
            "meeting": serialize_meeting(meeting)
        }), 200

    except Exception as e:
        print("GET MEETING ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
# ---------------------------------------------------------------------------
# Subscription
# ---------------------------------------------------------------------------

@app.route("/api/subscription/activate", methods=["POST"])
@token_required
def activate_subscription():
    try:
        db = get_db()
        user = request.current_user

        # Prevent duplicate subscriptions
        if user.get("subscribed", False):
            return jsonify({
                "error": "User already subscribed"
            }), 400

        data = request.get_json(silent=True) or {}

        plan = data.get("plan", "pro")

        db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "subscribed": True,
                    "subscription_plan": plan
                }
            }
        )

        updated_user = db.users.find_one({
            "_id": user["_id"]
        })

        return jsonify({
            "message": "Subscription activated",
            "user": serialize_user(updated_user)
        }), 200

    except Exception as e:
        print("SUBSCRIPTION ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
# ---------------------------------------------------------------------------
# ADMIN ROUTES
# ---------------------------------------------------------------------------

@app.route("/api/admin/users", methods=["GET"])
@token_required
@admin_required
def admin_get_users():
    try:
        db = get_db()

        users = list(db.users.find().sort("created_at", -1))

        serialized = [
            serialize_user(u)
            for u in users
        ]

        return jsonify(serialized), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/users/<user_id>/meetings", methods=["GET"])
@token_required
@admin_required
def admin_get_user_meetings(user_id):
    try:
        db = get_db()

        meetings = list(
            db.meetings.find({
                "user_id": ObjectId(user_id)
            }).sort("created_at", -1)
        )

        serialized = [
            serialize_meeting(m)
            for m in meetings
        ]

        return jsonify(serialized), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users/<user_id>", methods=["PUT"])
@token_required
@admin_required
def admin_update_user(user_id):
    try:
        db = get_db()

        data = request.get_json(force=True)

        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]

        if "role" in data:
            update_data["role"] = data["role"]

        if "subscribed" in data:
            update_data["subscribed"] = data["subscribed"]

        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        updated_user = db.users.find_one({
            "_id": ObjectId(user_id)
        })

        return jsonify(
            serialize_user(updated_user)
        ), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
    
@app.route("/api/admin/users/<user_id>", methods=["DELETE"])
@token_required
@admin_required
def admin_delete_user(user_id):
    try:
        db = get_db()

        db.meetings.delete_many({
            "user_id": ObjectId(user_id)
        })

        db.users.delete_one({
            "_id": ObjectId(user_id)
        })

        return jsonify({
            "message": "User deleted"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "model": "Whisper + Hybrid TF-IDF"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)