from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import uuid

# ============================================================================
# BLUEPRINT SETUP
# ============================================================================

engagement_bp = Blueprint("engagement", __name__)

# ============================================================================
# ENGAGEMENT ROUTES (BR4, BR6)
# ============================================================================

@engagement_bp.route("/engagement/analyze", methods=["POST"])
def analyze_engagement():
    """
    BR4: Analyze student engagement from implicit/explicit signals
    """
    try:
        data = request.json

        result = {
            "engagement_score": 72.5,
            "implicit_component": 68.3,
            "explicit_component": 78.2,
            "engagement_level": "PASSIVE",
            "behaviors_detected": 2,
            "recommendations": [
                "Monitor progress for next 3-5 days",
                "Add time-lock to questions (quick guessing detected)"
            ]
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@engagement_bp.route("/engagement/class/<class_id>", methods=["GET"])
def get_class_engagement(class_id):
    """
    BR6: Get class-level engagement metrics
    """
    try:
        class_data = {
            "class_id": class_id,
            "class_engagement_index": 87,
            "distribution": {
                "ENGAGED": 20,
                "PASSIVE": 6,
                "MONITOR": 1,
                "AT_RISK": 2,
                "CRITICAL": 0
            },
            "alert_count": 2,
            "students_needing_attention": [
                {
                    "student_id": "s1",
                    "name": "Student A",
                    "engagement_score": 45,
                    "engagement_level": "AT_RISK",
                    "recommendations": ["Schedule 1-on-1 within 48 hours"]
                }
            ],
            "trend": "improving",
            "engagement_rate": 89.7
        }

        return jsonify(class_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# LIVE POLLING ROUTES (BR4)
# ============================================================================

@engagement_bp.route("/polls/create", methods=["POST"])
def create_poll():
    """
    BR4: Create anonymous live poll
    """
    try:
        data = request.json

        poll = {
            "poll_id": str(uuid.uuid4()),
            "teacher_id": data["teacher_id"],
            "question": data["question"],
            "options": data["options"],
            "poll_type": data.get("poll_type", "multiple_choice"),
            "responses": [],
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }

        # Emit via SocketIO safely
        socketio = current_app.extensions["socketio"]
        socketio.emit("new_poll", poll, broadcast=True)

        return jsonify(poll), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@engagement_bp.route("/polls/<poll_id>/respond", methods=["POST"])
def respond_to_poll(poll_id):
    """
    BR4: Submit anonymous poll response
    """
    try:
        data = request.json

        response = {
            "response_id": str(uuid.uuid4()),
            "poll_id": poll_id,
            "student_id": data["student_id"],
            "selected_option": data["selected_option"],
            "response_time": data.get("response_time"),
            "submitted_at": datetime.utcnow().isoformat()
        }

        socketio = current_app.extensions["socketio"]
        socketio.emit(
            "poll_response",
            {
                "poll_id": poll_id,
                "total_responses": 15
            },
            broadcast=True
        )

        return jsonify(response), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@engagement_bp.route("/polls/<poll_id>", methods=["GET"])
def get_poll_results(poll_id):
    """
    BR6: Get aggregated poll results
    """
    try:
        results = {
            "poll_id": poll_id,
            "question": "Do you understand today's concept?",
            "responses": [
                {"option": "Yes", "count": 20, "percentage": 71},
                {"option": "Partially", "count": 6, "percentage": 21},
                {"option": "No", "count": 2, "percentage": 7}
            ],
            "total_responses": 28,
            "class_size": 28,
            "participation_rate": 100
        }

        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
