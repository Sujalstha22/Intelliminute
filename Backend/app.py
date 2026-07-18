import os
import uuid
import json
from statistics import mean
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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TRAINING_METRICS_PATH = os.path.join(
    BASE_DIR,
    "train",
    "models",
    "training_metrics.json"
)

app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)


UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def safe_average(values, minimum_valid=10):
    """
    Ignores None, missing values and extremely low values.
    """

    valid = []

    for v in values:
        try:
            v = float(v)

            if v >= minimum_valid:
                valid.append(v)

        except:
            continue

    if len(valid) == 0:
        return 0

    return round(sum(valid) / len(valid), 2)

def load_training_metrics():
    try:
        with open(TRAINING_METRICS_PATH, "r") as f:
            return json.load(f)

    except:
        return {
            "classification_accuracy": 0,
            "precision": 0,
            "recall": 0,
            "f1_score": 0,
            "summary_similarity": 0,
            "training_samples": 0,
            "total_sentences": 0
        }
    
def calculate_system_health(
    overall,
    transcript,
    summary,
    meeting_match
):

    score = round(
        (
            overall +
            transcript +
            summary +
            meeting_match
        ) / 4,
        2
    )

    if score >= 90:
        status = "Excellent"

    elif score >= 80:
        status = "Healthy"

    elif score >= 70:
        status = "Good"

    elif score >= 60:
        status = "Fair"

    else:
        status = "Needs Attention"

    return {
        "score": score,
        "status": status
    }
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

        serialized = []

        for u in users:
            user_data = serialize_user(u)
            user_data["meeting_count"] = db.meetings.count_documents({"user_id": u["_id"]})
            serialized.append(user_data)

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
    
@app.route("/api/admin/dashboard", methods=["GET"])
@token_required
@admin_required
def admin_dashboard():

    try:

        db = get_db()

        users = list(db.users.find())

        meetings = list(db.meetings.find())

        # --------------------------
        # USER STATS
        # --------------------------

        total_users = len(users)

        total_admins = sum(
            1
            for u in users
            if u.get("role") == "admin"
        )

        pro_users = sum(
            1
            for u in users
            if u.get("subscribed")
        )

        total_meetings = len(meetings)

        # --------------------------
        # Runtime Metrics
        # --------------------------

        overall_scores = []

        transcript_scores = []

        summary_scores = []

        meeting_scores = []

        warning_count = 0

        failed_meetings = 0

        for meeting in meetings:

            metrics = meeting.get("quality_metrics")

            if not metrics:
                continue

            overall_scores.append(
                metrics.get("overall_confidence")
            )

            transcript_scores.append(
                metrics.get("transcript_quality")
            )

            summary_scores.append(
                metrics.get("summary_confidence")
            )

            meeting_scores.append(
                metrics.get("meeting_type_match")
            )

            warning_count += len(
                metrics.get("warnings", [])
            )

            if metrics.get("meeting_validity", 100) < 35:
                failed_meetings += 1

        avg_overall = safe_average(overall_scores)

        avg_transcript = safe_average(transcript_scores)

        avg_summary = safe_average(summary_scores)

        avg_match = safe_average(meeting_scores)

        # --------------------------
        # System Health
        # --------------------------

        health = calculate_system_health(
            avg_overall,
            avg_transcript,
            avg_summary,
            avg_match
        )

        # --------------------------
        # Training Metrics
        # --------------------------

        training_metrics = load_training_metrics()

        # --------------------------
        # Response
        # --------------------------

        return jsonify({

            "users":{

                "total":total_users,

                "admins":total_admins,

                "pro_users":pro_users

            },

            "meetings":{

                "total":total_meetings,

                "failed":failed_meetings,

                "warnings_generated":warning_count

            },

            "runtime_metrics":{

                "overall_confidence":avg_overall,

                "transcript_quality":avg_transcript,

                "summary_confidence":avg_summary,

                "meeting_type_match":avg_match

            },

            "system_health":health,

            "training_metrics":training_metrics

        })

    except Exception as e:

        return jsonify({

            "error":str(e)

        }),500
    
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "model": "Whisper + Hybrid TF-IDF"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)