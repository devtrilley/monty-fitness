from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from functools import wraps
from sqlalchemy import func, desc, or_
from dotenv import load_dotenv

import os
from datetime import datetime, timedelta, timezone

# Load environment variables
load_dotenv()

# Import models
from models import (
    db,
    User,
    Exercise,
    Routine,
    RoutineExercise,
    RoutineSet,
    WorkoutSession,
    WorkoutExercise,
    WorkoutSet,
    Challenge,
    UserChallengeProgress,
    RoutineFolder,
)


# Create Flask app
app = Flask(__name__)

# Configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
db_url = os.getenv("DATABASE_URL", "sqlite:///monty_fitness.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
# Production Tokens
# app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
# app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
# Dev Tokens
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=4)  # 4 hours instead of 15 min
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)  # 30 days instead of 7
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_COOKIE_SECURE"] = (
    False  # Set True in productionapp.config["JWT_COOKIE_SECURE"] = os.getenv("FLASK_ENV") == "production"
)
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"

# Initialize extensions
db.init_app(app)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
CORS(app, origins=allowed_origins, supports_credentials=True)
jwt = JWTManager(app)


# JWT error handlers with detailed logging
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    print(f"🔴 JWT ERROR: Missing or invalid token - {callback}")
    return jsonify({"error": "Missing or invalid token"}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(
        f"🔴 JWT ERROR: Token expired - User ID: {jwt_payload.get('sub')}, Exp: {jwt_payload.get('exp')}"
    )
    return jsonify({"error": "Token has expired"}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"🔴 JWT ERROR: Invalid token - {error}")
    return jsonify({"error": "Invalid token"}), 401


# Custom decorators
def jwt_required_custom(fn):
    """Custom JWT required decorator that passes user object"""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404
        return fn(user=user, *args, **kwargs)

    return wrapper


def optional_jwt(fn):
    """Optional JWT decorator"""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id)) if user_id else None
        except:
            user = None
        return fn(user=user, *args, **kwargs)

    return wrapper


def admin_required(fn):
    """Decorator that requires user to be an admin"""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404
        if not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return fn(user=user, *args, **kwargs)

    return wrapper


# Helper functions
def generate_tokens(user_id):
    return {
        "access_token": create_access_token(identity=str(user_id)),
        "refresh_token": create_refresh_token(identity=str(user_id)),
    }


def update_last_login(user):
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()


# ============================================
# HEALTH & ROOT ROUTES
# ============================================


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "message": "Monty Fitness API"}), 200


@app.route("/")
def index():
    return jsonify({"message": "Monty Fitness API", "version": "1.0.0"}), 200


# ============================================
# AUTH ROUTES
# ============================================


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()

    if (
        not data
        or not data.get("first_name")
        or not data.get("last_name")
        or not data.get("username")
        or not data.get("email")
        or not data.get("password")
    ):
        return (
            jsonify(
                {
                    "error": "First name, last name, username, email, and password required"
                }
            ),
            400,
        )

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 409

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        username=data["username"],
        email=data["email"],
        display_name_preference=data.get("display_name_preference", "username"),
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    tokens = generate_tokens(user.id)
    update_last_login(user)

    response = make_response(
        jsonify(
            {
                "message": "User registered successfully",
                "user": user.to_dict(),
                "access_token": tokens["access_token"],
            }
        ),
        201,
    )

    set_refresh_cookies(response, tokens["refresh_token"])
    return response


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email or username and password required"}), 400

    identifier = data["email"].strip()

    user = User.query.filter(
        or_(
            func.lower(User.email) == identifier.lower(),
            func.lower(User.username) == identifier.lower(),
        )
    ).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    if user.is_admin:
        return jsonify({"error": "Invalid credentials"}), 401

    tokens = generate_tokens(user.id)
    update_last_login(user)

    response = make_response(
        jsonify(
            {
                "message": "Login successful",
                "user": user.to_dict(),
                "access_token": tokens["access_token"],
            }
        ),
        200,
    )

    set_refresh_cookies(response, tokens["refresh_token"])
    return response


@app.route("/api/auth/admin-login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.is_admin:
        return jsonify({"error": "Invalid credentials"}), 401
    tokens = generate_tokens(user.id)
    update_last_login(user)
    response = make_response(
        jsonify(
            {
                "message": "Admin login successful",
                "user": user.to_dict(),
                "access_token": tokens["access_token"],
            }
        ),
        200,
    )
    set_refresh_cookies(response, tokens["refresh_token"])
    return response


@app.route("/api/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    tokens = generate_tokens(int(user_id))

    response = make_response(jsonify({"access_token": tokens["access_token"]}), 200)
    set_refresh_cookies(response, tokens["refresh_token"])
    return response


@app.route("/api/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    response = make_response(jsonify({"message": "Logout successful"}), 200)
    unset_jwt_cookies(response)
    return response


@app.route("/api/auth/me", methods=["GET"])
@jwt_required_custom
def get_me(user):
    return jsonify({"user": user.to_dict()}), 200


@app.route("/api/auth/me", methods=["PUT"])
@jwt_required_custom
def update_profile(user):
    data = request.get_json()

    if "first_name" in data:
        user.first_name = data["first_name"].strip()
    if "last_name" in data:
        user.last_name = data["last_name"].strip()
    if "bio" in data:
        user.bio = data["bio"]
    if "profile_photo_url" in data:
        user.profile_photo_url = data["profile_photo_url"]

    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200


# ============================================
# EXERCISE ROUTES
# ============================================


@app.route("/api/exercises", methods=["GET"])
@optional_jwt
def get_exercises(user):
    equipment = request.args.get("equipment")
    muscle = request.args.get("muscle")
    search = request.args.get("search")

    query = Exercise.query

    if user:
        query = query.filter(
            or_(Exercise.is_global == True, Exercise.created_by_user_id == user.id)
        )
    else:
        query = query.filter(Exercise.is_global == True)

    if equipment:
        query = query.filter(Exercise.equipment == equipment)
    if muscle:
        query = query.filter(Exercise.primary_muscle == muscle)
    if search:
        query = query.filter(Exercise.name.ilike(f"%{search}%"))

    exercises = query.order_by(Exercise.name).all()

    return (
        jsonify(
            {"exercises": [ex.to_dict() for ex in exercises], "count": len(exercises)}
        ),
        200,
    )


@app.route("/api/exercises/<int:exercise_id>", methods=["GET"])
def get_exercise(exercise_id):
    exercise = Exercise.query.get(exercise_id)
    if not exercise:
        return jsonify({"error": "Exercise not found"}), 404
    return jsonify({"exercise": exercise.to_dict()}), 200


@app.route("/api/exercises", methods=["POST"])
@jwt_required_custom
def create_exercise(user):
    data = request.get_json()

    if (
        not data
        or not data.get("name")
        or not data.get("equipment")
        or not data.get("primary_muscle")
    ):
        return jsonify({"error": "Name, equipment, primary_muscle required"}), 400

    exercise = Exercise(
        name=data["name"],
        equipment=data["equipment"],
        primary_muscle=data["primary_muscle"],
        secondary_muscles=data.get("secondary_muscles", ""),
        instructions=data.get("instructions"),
        is_global=False,
        created_by_user_id=user.id,
    )

    db.session.add(exercise)
    db.session.commit()

    return jsonify({"message": "Exercise created", "exercise": exercise.to_dict()}), 201


@app.route("/api/exercises/<int:exercise_id>", methods=["DELETE"])
@jwt_required_custom
def delete_exercise(user, exercise_id):
    exercise = Exercise.query.get(exercise_id)

    if not exercise:
        return jsonify({"error": "Exercise not found"}), 404

    if exercise.is_global or exercise.created_by_user_id != user.id:
        return jsonify({"error": "Cannot delete this exercise"}), 403

    db.session.delete(exercise)
    db.session.commit()

    return jsonify({"message": "Exercise deleted"}), 200


@app.route("/api/exercises/filters", methods=["GET"])
def get_filter_options():
    equipment_types = db.session.query(Exercise.equipment).distinct().all()
    muscle_groups = db.session.query(Exercise.primary_muscle).distinct().all()

    return (
        jsonify(
            {
                "equipment": [eq[0] for eq in equipment_types if eq[0]],
                "muscles": [m[0] for m in muscle_groups if m[0]],
            }
        ),
        200,
    )


# ============================================
# ROUTINE ROUTES
# ============================================


@app.route("/api/routines", methods=["GET"])
@jwt_required_custom
def get_routines(user):
    routines = (
        Routine.query.filter_by(user_id=user.id)
        .order_by(Routine.created_at.desc())
        .all()
    )

    def routine_with_preview(r):
        d = r.to_dict(include_exercises=False)
        exs = [re.exercise for re in r.routine_exercises if re.exercise]
        d["exercise_preview"] = ", ".join(
            ex.name + " (" + ex.equipment + ")" for ex in exs[:4]
        )
        d["exercise_images"] = [ex.image_url for ex in exs[:4] if ex.image_url]
        return d

    return (
        jsonify(
            {
                "routines": [routine_with_preview(r) for r in routines],
                "count": len(routines),
            }
        ),
        200,
    )


@app.route("/api/folders", methods=["GET"])
@jwt_required_custom
def get_folders(user):
    folders = (
        RoutineFolder.query.filter_by(user_id=user.id)
        .order_by(RoutineFolder.created_at)
        .all()
    )
    return jsonify({"folders": [f.to_dict() for f in folders]}), 200


@app.route("/api/folders", methods=["POST"])
@jwt_required_custom
def create_folder(user):
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Name required"}), 400
    folder = RoutineFolder(user_id=user.id, name=data["name"])
    db.session.add(folder)
    db.session.commit()
    return jsonify({"message": "Folder created", "folder": folder.to_dict()}), 201


@app.route("/api/folders/<int:folder_id>", methods=["PUT"])
@jwt_required_custom
def rename_folder(user, folder_id):
    folder = RoutineFolder.query.get(folder_id)
    if not folder or folder.user_id != user.id:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    if data.get("name"):
        folder.name = data["name"]
    db.session.commit()
    return jsonify({"message": "Folder renamed", "folder": folder.to_dict()}), 200


@app.route("/api/folders/<int:folder_id>", methods=["DELETE"])
@jwt_required_custom
def delete_folder(user, folder_id):
    folder = RoutineFolder.query.get(folder_id)
    if not folder or folder.user_id != user.id:
        return jsonify({"error": "Not found"}), 404
    Routine.query.filter_by(folder_id=folder_id).update({"folder_id": None})
    db.session.delete(folder)
    db.session.commit()
    return jsonify({"message": "Folder deleted"}), 200


@app.route("/api/routines/<int:routine_id>/move", methods=["PATCH"])
@jwt_required_custom
def move_routine(user, routine_id):
    routine = Routine.query.get(routine_id)
    if not routine or routine.user_id != user.id:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    routine.folder_id = data.get("folder_id")
    db.session.commit()
    return jsonify({"message": "Routine moved", "routine": routine.to_dict()}), 200


@app.route("/api/routines/<int:routine_id>", methods=["GET"])
@jwt_required_custom
def get_routine(user, routine_id):
    routine = Routine.query.get(routine_id)

    if not routine:
        return jsonify({"error": "Routine not found"}), 404
    if routine.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    return jsonify({"routine": routine.to_dict(include_exercises=True)}), 200


@app.route("/api/routines/<int:routine_id>", methods=["PUT"])
@jwt_required_custom
def update_routine(user, routine_id):
    routine = Routine.query.get(routine_id)

    if not routine:
        return jsonify({"error": "Routine not found"}), 404
    if routine.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()

    # DEBUG: Log what we received
    print("=== BACKEND RECEIVED ===")
    import json

    print(json.dumps(data, indent=2))

    if "name" in data:
        routine.name = data["name"]
    if "description" in data:
        routine.description = data["description"]
    if "icon" in data:
        routine.icon = data["icon"]

    if "exercises" in data:
        # DEBUG: Log before deletion
        print(f"=== DELETING OLD EXERCISES for routine {routine.id} ===")

        # Delete existing exercises and their sets explicitly
        for routine_exercise in RoutineExercise.query.filter_by(
            routine_id=routine.id
        ).all():
            # Delete all sets for this exercise first
            RoutineSet.query.filter_by(routine_exercise_id=routine_exercise.id).delete()
        # Now delete the exercises
        RoutineExercise.query.filter_by(routine_id=routine.id).delete()

        for idx, ex_data in enumerate(data["exercises"]):
            if not ex_data.get("exercise_id"):
                continue

            print(
                f"\n=== Processing Exercise {idx}: {ex_data.get('exercise_name')} ==="
            )
            print(f"Sets to save: {json.dumps(ex_data.get('sets', []), indent=2)}")

            routine_exercise = RoutineExercise(
                routine_id=routine.id,
                exercise_id=ex_data["exercise_id"],
                order_index=idx,
                planned_sets=len(ex_data.get("sets", [])),
                rest_seconds=ex_data.get("rest_seconds", 120),
                notes=ex_data.get("notes"),
            )
            db.session.add(routine_exercise)
            db.session.flush()

            print(f"Created RoutineExercise with ID: {routine_exercise.id}")

            sets = ex_data.get("sets", [])
            for set_num, set_data in enumerate(sets, start=1):
                routine_set = RoutineSet(
                    routine_exercise_id=routine_exercise.id,
                    set_number=set_num,
                    set_type=set_data.get("type", "normal"),
                    weight=(
                        float(set_data["weight"]) if set_data.get("weight") else None
                    ),
                    reps=int(set_data["reps"]) if set_data.get("reps") else None,
                )
                db.session.add(routine_set)
                print(
                    f"  Set {set_num}: type={set_data.get('type')}, weight={set_data.get('weight')}, reps={set_data.get('reps')}"
                )

    db.session.commit()
    print("=== COMMIT SUCCESSFUL ===")

    return (
        jsonify(
            {
                "message": "Routine updated",
                "routine": routine.to_dict(include_exercises=True),
            }
        ),
        200,
    )


@app.route("/api/routines/<int:routine_id>", methods=["DELETE"])
@jwt_required_custom
def delete_routine(user, routine_id):
    routine = Routine.query.get(routine_id)

    if not routine:
        return jsonify({"error": "Routine not found"}), 404
    if routine.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(routine)
    db.session.commit()

    return jsonify({"message": "Routine deleted"}), 200


# ============================================
# TEMPLATE ROUTES
# ============================================
@app.route("/api/routines/templates", methods=["GET"])
@jwt_required_custom
def get_template_routines(user):
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        return jsonify({"templates": [], "creator": None}), 200

    folders = RoutineFolder.query.filter_by(user_id=admin.id).order_by(RoutineFolder.created_at).all()
    result = []
    for folder in folders:
        folder_routines = Routine.query.filter_by(user_id=admin.id, folder_id=folder.id).all()
        routines_data = []
        for r in folder_routines:
            d = r.to_dict(include_exercises=True)
            exs = [re.exercise for re in r.routine_exercises if re.exercise]
            d["exercise_preview"] = ", ".join(ex.name for ex in exs)
            d["exercise_images"] = [ex.image_url for ex in exs[:4] if ex.image_url]
            d["exercise_count"] = len(r.routine_exercises)
            routines_data.append(d)
        result.append({
            "folder_id": folder.id,
            "folder_name": folder.name,
            "routines": routines_data,
        })

    return jsonify({
        "templates": result,
        "creator": {"username": admin.username, "id": admin.id},
    }), 200


@app.route("/api/routines/templates/<int:routine_id>/save", methods=["POST"])
@jwt_required_custom
def save_template_routine(user, routine_id):
    admin = User.query.filter_by(is_admin=True).first()
    source = Routine.query.filter_by(id=routine_id, user_id=admin.id).first() if admin else None
    if not source:
        return jsonify({"error": "Template not found"}), 404

    data = request.get_json() or {}
    new_routine = Routine(
        user_id=user.id,
        name=source.name,
        description=source.description,
        icon=source.icon,
        folder_id=data.get("folder_id"),
    )
    db.session.add(new_routine)
    db.session.flush()

    for re in source.routine_exercises:
        new_re = RoutineExercise(
            routine_id=new_routine.id,
            exercise_id=re.exercise_id,
            order_index=re.order_index,
            planned_sets=re.planned_sets,
            rest_seconds=re.rest_seconds,
            notes=re.notes,
        )
        db.session.add(new_re)
        db.session.flush()
        for rs in re.sets:
            db.session.add(RoutineSet(
                routine_exercise_id=new_re.id,
                set_number=rs.set_number,
                set_type=rs.set_type,
                weight=rs.weight,
                reps=rs.reps,
            ))

    db.session.commit()
    return jsonify({"message": "Routine saved", "routine": new_routine.to_dict()}), 201


@app.route("/api/routines/templates/folder/<int:folder_id>/save", methods=["POST"])
@jwt_required_custom
def save_template_folder(user, folder_id):
    admin = User.query.filter_by(is_admin=True).first()
    source_folder = RoutineFolder.query.filter_by(id=folder_id, user_id=admin.id).first() if admin else None
    if not source_folder:
        return jsonify({"error": "Template folder not found"}), 404

    new_folder = RoutineFolder(user_id=user.id, name=source_folder.name)
    db.session.add(new_folder)
    db.session.flush()

    for source in Routine.query.filter_by(user_id=admin.id, folder_id=folder_id).all():
        new_routine = Routine(
            user_id=user.id,
            name=source.name,
            description=source.description,
            icon=source.icon,
            folder_id=new_folder.id,
        )
        db.session.add(new_routine)
        db.session.flush()
        for re in source.routine_exercises:
            new_re = RoutineExercise(
                routine_id=new_routine.id,
                exercise_id=re.exercise_id,
                order_index=re.order_index,
                planned_sets=re.planned_sets,
                rest_seconds=re.rest_seconds,
                notes=re.notes,
            )
            db.session.add(new_re)
            db.session.flush()
            for rs in re.sets:
                db.session.add(RoutineSet(
                    routine_exercise_id=new_re.id,
                    set_number=rs.set_number,
                    set_type=rs.set_type,
                    weight=rs.weight,
                    reps=rs.reps,
                ))

    db.session.commit()
    return jsonify({"message": "Folder saved", "folder": new_folder.to_dict()}), 201


# ============================================
# WORKOUT ROUTES
# ============================================


@app.route("/api/workouts", methods=["GET"])
@jwt_required_custom
def get_workouts(user):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    query = WorkoutSession.query.filter_by(user_id=user.id).order_by(
        desc(WorkoutSession.session_date)
    )
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return (
        jsonify(
            {
                "workouts": [
                    w.to_dict(include_exercises=False) for w in pagination.items
                ],
                "total": pagination.total,
                "page": page,
                "pages": pagination.pages,
            }
        ),
        200,
    )


@app.route("/api/workouts/<int:workout_id>", methods=["GET"])
@jwt_required_custom
def get_workout(user, workout_id):
    """Return a completed workout session (no routine data)"""
    workout = WorkoutSession.query.get(workout_id)

    if not workout:
        return jsonify({"error": "Workout not found"}), 404
    if workout.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    # Prevent returning uncompleted sessions
    if workout.status != "completed":
        return jsonify({"error": "Workout not yet completed"}), 400

    workout_dict = workout.to_dict(include_exercises=True)

    # 🔹 Strip all routine/template fields
    for ex in workout_dict.get("exercises", []):
        ex.pop("planned_sets", None)
        ex.pop("expected_reps", None)
        ex.pop("expected_weight", None)
        for s in ex.get("sets", []):
            s.pop("planned_reps", None)
            s.pop("planned_weight", None)
            s.pop("expected_reps", None)
            s.pop("expected_weight", None)

    # Add frontend-friendly fields
    workout_dict["is_completed"] = True
    workout_dict["completed_sets"] = sum(
        len([s for s in ex.get("sets", []) if s.get("reps")])
        for ex in workout_dict.get("exercises", [])
    )

    return jsonify({"workout": workout_dict}), 200


@app.route("/api/workouts", methods=["POST"])
@jwt_required_custom
def create_workout(user):
    data = request.get_json()

    workout = WorkoutSession(
        user_id=user.id,
        routine_id=data.get("routine_id"),
        name=data.get("name"),
        duration_minutes=data.get("duration_minutes"),
        session_date=(
            datetime.fromisoformat(data["session_date"])
            if data.get("session_date")
            else datetime.utcnow()
        ),
        notes=data.get("notes"),
    )

    db.session.add(workout)
    db.session.flush()

    exercises = data.get("exercises", [])
    for idx, ex_data in enumerate(exercises):
        if not ex_data.get("exercise_id"):
            continue

        workout_exercise = WorkoutExercise(
            session_id=workout.id,
            exercise_id=ex_data["exercise_id"],
            order_index=idx,
            notes=ex_data.get("notes"),
        )
        db.session.add(workout_exercise)
        db.session.flush()

        sets = ex_data.get("sets", [])
        for set_num, set_data in enumerate(sets, start=1):
            workout_set = WorkoutSet(
                workout_exercise_id=workout_exercise.id,
                set_number=set_num,
                weight=set_data.get("weight"),
                reps=set_data.get("reps"),
                rir=set_data.get("rir"),
                is_pr=set_data.get("is_pr", False),
                set_type=set_data.get("set_type", "normal"),
            )
            db.session.add(workout_set)

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Workout created",
                "workout": workout.to_dict(include_exercises=True),
            }
        ),
        201,
    )


@app.route("/api/workouts/<int:workout_id>", methods=["DELETE"])
@jwt_required_custom
def delete_workout(user, workout_id):
    workout = WorkoutSession.query.get(workout_id)

    if not workout:
        return jsonify({"error": "Workout not found"}), 404
    if workout.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(workout)
    db.session.commit()

    return jsonify({"message": "Workout deleted"}), 200


@app.route("/api/workouts/stats", methods=["GET"])
@jwt_required_custom
def get_workout_stats(user):
    weeks = request.args.get("weeks", 12, type=int)
    start_date = datetime.utcnow() - timedelta(weeks=weeks)

    total_workouts = WorkoutSession.query.filter_by(user_id=user.id).count()

    recent_workouts = WorkoutSession.query.filter(
        WorkoutSession.user_id == user.id, WorkoutSession.session_date >= start_date
    ).all()

    total_volume = sum(w.calculate_total_volume() for w in recent_workouts)
    total_duration = sum(w.duration_minutes or 0 for w in recent_workouts)
    total_prs = sum(w.count_prs() for w in recent_workouts)

    return (
        jsonify(
            {
                "total_workouts": total_workouts,
                "recent_stats": {
                    "weeks": weeks,
                    "workout_count": len(recent_workouts),
                    "total_volume": total_volume,
                    "total_duration": total_duration,
                    "total_prs": total_prs,
                },
            }
        ),
        200,
    )


@app.route("/api/workouts/calendar", methods=["GET"])
@jwt_required_custom
def get_workout_calendar(user):
    year = request.args.get("year", datetime.utcnow().year, type=int)
    month = request.args.get("month", datetime.utcnow().month, type=int)

    start_date = datetime(year, month, 1)
    end_date = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

    workouts = WorkoutSession.query.filter(
        WorkoutSession.user_id == user.id,
        WorkoutSession.session_date >= start_date,
        WorkoutSession.session_date < end_date,
    ).all()

    calendar_data = {}
    for workout in workouts:
        date_key = workout.session_date.strftime("%Y-%m-%d")
        if date_key not in calendar_data:
            calendar_data[date_key] = []
        calendar_data[date_key].append(
            {
                "id": workout.id,
                "name": workout.name
                or (workout.routine.name if workout.routine else "Quick Workout"),
                "duration": workout.duration_minutes,
            }
        )

    return jsonify({"year": year, "month": month, "calendar": calendar_data}), 200


@app.route("/api/routines", methods=["POST"])
@jwt_required_custom
def create_routine(user):
    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Name required"}), 400

    routine = Routine(
        user_id=user.id,
        name=data["name"],
        description=data.get("description"),
        icon=data.get("icon"),
    )

    db.session.add(routine)
    db.session.flush()

    exercises = data.get("exercises", [])
    for idx, ex_data in enumerate(exercises):
        if not ex_data.get("exercise_id"):
            continue

        routine_exercise = RoutineExercise(
            routine_id=routine.id,
            exercise_id=ex_data["exercise_id"],
            order_index=idx,
            planned_sets=len(ex_data.get("sets", [])),  # Count of sets
            rest_seconds=ex_data.get("rest_seconds", 120),
            notes=ex_data.get("notes"),
        )
        db.session.add(routine_exercise)
        db.session.flush()

        # Save individual sets
        sets = ex_data.get("sets", [])
        for set_num, set_data in enumerate(sets, start=1):
            routine_set = RoutineSet(
                routine_exercise_id=routine_exercise.id,
                set_number=set_num,
                set_type=set_data.get("type", "normal"),
                weight=float(set_data["weight"]) if set_data.get("weight") else None,
                reps=int(set_data["reps"]) if set_data.get("reps") else None,
            )
            db.session.add(routine_set)

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Routine created",
                "routine": routine.to_dict(include_exercises=True),
            }
        ),
        201,
    )


@app.route("/api/workouts/start-empty", methods=["POST"])
@jwt_required_custom
def start_empty_workout(user):
    session = WorkoutSession(
        user_id=user.id,
        routine_id=None,
        name="Empty Workout",
        status="in_progress",
        session_date=datetime.utcnow(),
    )
    db.session.add(session)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Empty workout started",
                "session": session.to_dict(include_exercises=True),
            }
        ),
        201,
    )


@app.route("/api/workouts/start/<int:routine_id>", methods=["POST"])
@jwt_required_custom
def start_workout(user, routine_id):
    routine = Routine.query.get(routine_id)

    if not routine:
        return jsonify({"error": "Routine not found"}), 404
    if routine.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    # Create workout session
    session = WorkoutSession(
        user_id=user.id,
        routine_id=routine.id,
        name=routine.name,
        status="in_progress",
        session_date=datetime.utcnow(),
    )
    db.session.add(session)
    db.session.flush()

    # Copy routine exercises to workout
    for routine_ex in routine.routine_exercises:
        workout_ex = WorkoutExercise(
            session_id=session.id,
            exercise_id=routine_ex.exercise_id,
            order_index=routine_ex.order_index,
            notes=routine_ex.notes,
        )
        db.session.add(workout_ex)
        db.session.flush()

        # Copy planned sets as template
        for routine_set in routine_ex.sets:
            workout_set = WorkoutSet(
                workout_exercise_id=workout_ex.id,
                set_number=routine_set.set_number,
                set_type=routine_set.set_type,
                weight=routine_set.weight,  # Pre-fill with planned
                reps=routine_set.reps,
            )
            db.session.add(workout_set)

    db.session.commit()

    session_dict = session.to_dict(include_exercises=True)

    for ex_dict in session_dict.get("exercises", []):
        exercise_id = ex_dict["exercise_id"]
        last_workout_ex = (
            WorkoutExercise.query.join(
                WorkoutSession, WorkoutSession.id == WorkoutExercise.session_id
            )
            .filter(
                WorkoutSession.user_id == user.id,
                WorkoutSession.status == "completed",
                WorkoutExercise.exercise_id == exercise_id,
            )
            .order_by(WorkoutSession.session_date.desc())
            .first()
        )
        ex_dict["last_performance"] = (
            [s.to_dict() for s in last_workout_ex.sets] if last_workout_ex else []
        )

    return (
        jsonify(
            {
                "message": "Workout started",
                "session": session_dict,
            }
        ),
        201,
    )


@app.route("/api/workouts/<int:session_id>/finish", methods=["POST"])
@jwt_required_custom
def finish_workout(user, session_id):
    session = WorkoutSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()

    # Get list of completed set IDs from frontend
    completed_set_ids = data.get("completed_set_ids", [])

    # Delete all sets that are NOT in the completed list
    if completed_set_ids:
        for workout_ex in session.workout_exercises:
            for workout_set in list(workout_ex.sets):
                if workout_set.id not in completed_set_ids:
                    db.session.delete(workout_set)

        # Also remove exercises that have no sets left
        db.session.flush()  # Apply deletions first
        db.session.expire_all()  # Force refresh from database
        for workout_ex in list(session.workout_exercises):
            if len(workout_ex.sets) == 0:
                db.session.delete(workout_ex)

    session.status = "completed"
    session.duration_minutes = data.get("duration_minutes")
    session.notes = data.get("notes")

    # 💾 APPLY SET VALUE UPDATES FROM FRONTEND
    set_updates = {u["id"]: u for u in data.get("set_updates", [])}
    for workout_ex in session.workout_exercises:
        for workout_set in workout_ex.sets:
            if workout_set.id in set_updates:
                update = set_updates[workout_set.id]
                workout_set.weight = update.get("weight")
                workout_set.reps = update.get("reps")
                workout_set.rir = update.get("rir")
                workout_set.set_type = update.get("set_type", "normal")

    # 🏆 CALCULATE PRs FOR COMPLETED SETS
    for workout_ex in session.workout_exercises:
        exercise_id = workout_ex.exercise_id
        for workout_set in workout_ex.sets:
            if workout_set.weight is None or workout_set.reps is None:
                continue
            # Query historical bests for this exercise, excluding current session
            historical = (
                db.session.query(
                    func.max(WorkoutSet.weight).label("best_weight"),
                    func.max(WorkoutSet.reps).label("best_reps"),
                    func.max(WorkoutSet.weight * WorkoutSet.reps).label("best_volume"),
                )
                .join(
                    WorkoutExercise,
                    WorkoutExercise.id == WorkoutSet.workout_exercise_id,
                )
                .join(WorkoutSession, WorkoutSession.id == WorkoutExercise.session_id)
                .filter(
                    WorkoutSession.user_id == user.id,
                    WorkoutSession.status == "completed",
                    WorkoutSession.id != session.id,
                    WorkoutExercise.exercise_id == exercise_id,
                    WorkoutSet.weight.isnot(None),
                    WorkoutSet.reps.isnot(None),
                )
                .first()
            )
            current_volume = workout_set.weight * workout_set.reps
            is_weight_pr = workout_set.weight is not None and (
                (not historical.best_weight)
                or (workout_set.weight > historical.best_weight)
            )
            is_reps_pr = (not historical.best_reps) or (
                workout_set.reps > historical.best_reps
            )
            is_volume_pr = workout_set.weight is not None and (
                (not historical.best_volume)
                or (current_volume > historical.best_volume)
            )
            if is_weight_pr or is_reps_pr or is_volume_pr:
                workout_set.is_pr = True
                pr_types = []
                if is_weight_pr:
                    pr_types.append("weight")
                if is_reps_pr:
                    pr_types.append("reps")
                if is_volume_pr:
                    pr_types.append("volume")
                workout_set.pr_type = ",".join(pr_types)

    # 🏅 AUTO-MARK CHALLENGE DAY COMPLETE
    if session.challenge_id and not data.get("skip_challenge_complete", False):
        challenge_progress = UserChallengeProgress.query.filter_by(
            user_id=user.id, challenge_id=session.challenge_id
        ).first()
        if challenge_progress and not challenge_progress.completed:
            challenge_progress.day_index += 1
            if (
                challenge_progress.day_index
                >= challenge_progress.challenge.days_required
            ):
                challenge_progress.completed = True
            challenge_progress.last_updated = datetime.utcnow()

    # 🆕 UPDATE USER ANALYTICS
    from datetime import date

    user.total_workouts += 1

    # Calculate weekly streak
    today = date.today()
    current_week = today.strftime("%Y-W%U")

    if user.last_workout_week != current_week:
        # New week - check if consecutive
        if user.last_workout_week:
            # Parse the last workout week
            try:
                last_year, last_week = user.last_workout_week.split("-W")
                last_year = int(last_year)
                last_week = int(last_week)
                current_year = today.year
                current_week_num = int(today.strftime("%U"))

                # Calculate week difference
                week_diff = (current_year - last_year) * 52 + (
                    current_week_num - last_week
                )

                if week_diff == 1:
                    # Consecutive week
                    user.current_weekly_streak += 1
                else:
                    # Streak broken, restart
                    user.current_weekly_streak = 1
            except:
                user.current_weekly_streak = 1
        else:
            # First workout ever
            user.current_weekly_streak = 1

        # Update best streak
        if user.current_weekly_streak > user.best_weekly_streak:
            user.best_weekly_streak = user.current_weekly_streak

        user.last_workout_week = current_week

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Workout completed",
                "session": session.to_dict(include_exercises=True),
            }
        ),
        200,
    )


@app.route("/api/workouts/<int:session_id>/discard", methods=["DELETE"])
@jwt_required_custom
def discard_workout(user, session_id):
    session = WorkoutSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(session)
    db.session.commit()

    return jsonify({"message": "Workout discarded"}), 200


@app.route("/api/workouts/history", methods=["GET"])
@jwt_required_custom
def get_workout_history(user):
    """Get user's completed workouts for history feed"""
    limit = request.args.get("limit", 20, type=int)

    sessions = (
        WorkoutSession.query.filter_by(user_id=user.id, status="completed")
        .order_by(WorkoutSession.session_date.desc())
        .limit(limit)
        .all()
    )

    return (
        jsonify(
            {
                "workouts": [s.to_dict(include_exercises=True) for s in sessions],
                "count": len(sessions),
            }
        ),
        200,
    )


@app.route("/api/workouts/<int:session_id>/session", methods=["GET"])
@jwt_required_custom
def get_active_session(user, session_id):
    """Get an active workout session (in-progress)"""
    session = WorkoutSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    return jsonify({"workout": session.to_dict(include_exercises=True)}), 200


# ============================================
# ANALYTICS ROUTES
# ============================================


@app.route("/api/analytics/summary", methods=["GET"])
@jwt_required_custom
def get_analytics_summary(user):
    """Get user's analytics summary: streaks, totals, this week stats"""
    from datetime import date, timedelta

    # Calculate this week stats
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    this_week_sessions = WorkoutSession.query.filter(
        WorkoutSession.user_id == user.id,
        WorkoutSession.status == "completed",
        WorkoutSession.session_date >= week_start,
    ).all()

    this_week_stats = {
        "workouts": len(this_week_sessions),
        "volume": sum(s.calculate_total_volume() for s in this_week_sessions),
        "sets": sum(
            len([st for ex in s.workout_exercises for st in ex.sets])
            for s in this_week_sessions
        ),
        "duration": sum(s.duration_minutes or 0 for s in this_week_sessions),
    }

    # Calculate daily streak
    all_sessions = (
        WorkoutSession.query.filter_by(user_id=user.id, status="completed")
        .order_by(WorkoutSession.session_date.desc())
        .all()
    )

    daily_streak = 0
    if all_sessions:
        current_date = date.today()
        for session in all_sessions:
            session_date = (
                session.session_date.date()
                if hasattr(session.session_date, "date")
                else session.session_date
            )
            if (
                session_date == current_date
                or session_date == current_date - timedelta(days=1)
            ):
                daily_streak += 1
                current_date = session_date - timedelta(days=1)
            else:
                break

    # Determine badge
    total = user.total_workouts
    if total >= 1000:
        badge = "🏆 Monty Elite"
    elif total >= 750:
        badge = "🔥 Veteran"
    elif total >= 500:
        badge = "⚡ Unstoppable"
    elif total >= 250:
        badge = "🧠 Disciplined"
    elif total >= 100:
        badge = "💪 Seasoned"
    elif total >= 50:
        badge = "🥉 Relentless"
    elif total >= 25:
        badge = "🥈 Dedicated"
    elif total >= 1:
        badge = "🥇 Rookie"
    else:
        badge = None

    all_time_volume = sum(
        s.calculate_total_volume()
        for s in WorkoutSession.query.filter_by(
            user_id=user.id, status="completed"
        ).all()
    )
    total_prs = (
        db.session.query(func.count(WorkoutSet.id))
        .join(WorkoutExercise, WorkoutExercise.id == WorkoutSet.workout_exercise_id)
        .join(WorkoutSession, WorkoutSession.id == WorkoutExercise.session_id)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == "completed",
            WorkoutSet.is_pr == True,
        )
        .scalar()
        or 0
    )

    return (
        jsonify(
            {
                "daily_streak": daily_streak,
                "current_weekly_streak": user.current_weekly_streak,
                "best_weekly_streak": user.best_weekly_streak,
                "this_week": this_week_stats,
                "total_workouts": user.total_workouts,
                "total_volume": all_time_volume,
                "total_prs": total_prs,
                "badge": badge,
            }
        ),
        200,
    )


@app.route("/api/analytics/volume", methods=["GET"])
@jwt_required_custom
def get_volume_analytics(user):
    """Get volume/duration/reps data for charts"""
    from datetime import date, timedelta

    range_param = request.args.get("range", "3months")  # 3months, 1year, alltime

    # Determine date range
    today = date.today()
    if range_param == "1year":
        start_date = today - timedelta(days=365)
    elif range_param == "alltime":
        start_date = None
    else:  # 3months default
        start_date = today - timedelta(days=90)

    # Query sessions
    query = WorkoutSession.query.filter_by(user_id=user.id, status="completed")
    if start_date:
        query = query.filter(WorkoutSession.session_date >= start_date)

    sessions = query.order_by(WorkoutSession.session_date).all()

    # Group by week
    from collections import defaultdict

    weeks = defaultdict(lambda: {"volume": 0, "duration": 0, "reps": 0, "workouts": 0})

    for session in sessions:
        session_date = (
            session.session_date.date()
            if hasattr(session.session_date, "date")
            else session.session_date
        )
        week_key = session_date.strftime("%Y-W%U")

        weeks[week_key]["volume"] += session.calculate_total_volume()
        weeks[week_key]["duration"] += session.duration_minutes or 0
        weeks[week_key]["workouts"] += 1

        # Count total reps
        for ex in session.workout_exercises:
            for set_data in ex.sets:
                if set_data.reps:
                    weeks[week_key]["reps"] += set_data.reps

    # Format for frontend
    data = [
        {
            "week": week,
            "volume": stats["volume"],
            "duration": stats["duration"],
            "reps": stats["reps"],
        }
        for week, stats in sorted(weeks.items())
    ]

    return jsonify({"data": data}), 200


@app.route("/api/analytics/personal-records", methods=["GET"])
@jwt_required_custom
def get_personal_records(user):
    """Get all PRs grouped by exercise"""
    from sqlalchemy import func

    # Get all exercises user has done
    pr_query = (
        db.session.query(
            Exercise.id,
            Exercise.name,
            Exercise.equipment,
            Exercise.image_url,
            func.max(WorkoutSet.weight).label("best_weight"),
            func.max(WorkoutSet.reps).label("best_reps"),
            func.max(WorkoutSet.weight * WorkoutSet.reps).label("best_volume"),
        )
        .join(WorkoutExercise, WorkoutExercise.exercise_id == Exercise.id)
        .join(WorkoutSet, WorkoutSet.workout_exercise_id == WorkoutExercise.id)
        .join(WorkoutSession, WorkoutSession.id == WorkoutExercise.session_id)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == "completed",
            WorkoutSet.weight.isnot(None),
            WorkoutSet.reps.isnot(None),
        )
        .group_by(Exercise.id)
        .all()
    )

    prs = []
    for record in pr_query:
        prs.append(
            {
                "exercise_id": record.id,
                "exercise_name": record.name,
                "equipment": record.equipment,
                "image_url": record.image_url,
                "best_weight": float(record.best_weight) if record.best_weight else 0,
                "best_reps": record.best_reps or 0,
                "best_volume": float(record.best_volume) if record.best_volume else 0,
            }
        )

    # Sort by best volume
    prs.sort(key=lambda x: x["best_volume"], reverse=True)

    return jsonify({"prs": prs}), 200


# ======================
# ✅ CHALLENGES ROUTES
# ======================


@app.route("/api/challenges/<int:challenge_id>/start-day", methods=["POST"])
@jwt_required_custom
def start_challenge_day(user, challenge_id):
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404

    progress = UserChallengeProgress.query.filter_by(
        user_id=user.id, challenge_id=challenge_id
    ).first()
    if not progress:
        return jsonify({"error": "Join the challenge first"}), 400
    if progress.completed:
        return jsonify({"error": "Challenge already completed"}), 400

    day = progress.day_index + 1

    # Build exercise list based on challenge type
    def find_exercise(name_fragment, equipment=None):
        q = Exercise.query.filter(Exercise.name.ilike(f"%{name_fragment}%"))
        if equipment:
            q = q.filter(Exercise.equipment == equipment)
        return q.first()

    exercises_to_add = []

    if "Sydney" in challenge.name:
        ex = find_exercise("Push Up", "Bodyweight")
        if ex:
            exercises_to_add.append(
                {
                    "exercise": ex,
                    "sets": [{"set_type": "normal", "reps": day, "weight": None}],
                }
            )

    elif "Cael" in challenge.name:
        ex = find_exercise("Pull Up", "Bodyweight")
        if ex:
            # 50 pull-ups broken into 5 sets of 10
            exercises_to_add.append(
                {
                    "exercise": ex,
                    "sets": [
                        {"set_type": "normal", "reps": 10, "weight": None}
                        for _ in range(5)
                    ],
                }
            )

    elif "Leonidas" in challenge.name:
        for name, reps in [("Crunch", 100), ("Leg Raise", 100), ("Bicycle", 100)]:
            ex = find_exercise(name, "Bodyweight")
            if ex:
                exercises_to_add.append(
                    {
                        "exercise": ex,
                        "sets": [{"set_type": "normal", "reps": reps, "weight": None}],
                    }
                )

    if not exercises_to_add:
        return jsonify({"error": "Could not find exercises for this challenge"}), 500

    # Guard against duplicate in-progress sessions
    existing_session = WorkoutSession.query.filter_by(
        user_id=user.id, challenge_id=challenge_id, status="in_progress"
    ).first()
    if existing_session:
        return (
            jsonify(
                {
                    "message": "Challenge day already in progress",
                    "session": existing_session.to_dict(include_exercises=True),
                    "day": day,
                }
            ),
            200,
        )

    # Create the workout session
    session = WorkoutSession(
        user_id=user.id,
        routine_id=None,
        challenge_id=challenge_id,
        name=f"{challenge.name} — Day {day}",
        status="in_progress",
        session_date=datetime.utcnow(),
    )
    db.session.add(session)
    db.session.flush()

    for order_idx, ex_data in enumerate(exercises_to_add):
        workout_ex = WorkoutExercise(
            session_id=session.id,
            exercise_id=ex_data["exercise"].id,
            order_index=order_idx,
        )
        db.session.add(workout_ex)
        db.session.flush()

        for set_num, s in enumerate(ex_data["sets"], start=1):
            workout_set = WorkoutSet(
                workout_exercise_id=workout_ex.id,
                set_number=set_num,
                set_type=s["set_type"],
                reps=s["reps"],
                weight=s["weight"],
            )
            db.session.add(workout_set)

    db.session.commit()
    return (
        jsonify(
            {
                "message": "Challenge day started",
                "session": session.to_dict(include_exercises=True),
                "day": day,
            }
        ),
        201,
    )


@app.route("/api/challenges", methods=["GET"])
@jwt_required_custom
def get_all_challenges(user):
    challenges = Challenge.query.all()
    return (
        jsonify(
            {
                "challenges": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "description": c.description,
                        "days_required": c.days_required,
                        "category": c.category,
                        "image_url": c.image_url,
                    }
                    for c in challenges
                ]
            }
        ),
        200,
    )


@app.route("/api/challenges/<int:challenge_id>/join", methods=["POST"])
@jwt_required_custom
def join_challenge(user, challenge_id):
    existing = UserChallengeProgress.query.filter_by(
        user_id=user.id, challenge_id=challenge_id
    ).first()
    if existing:
        return jsonify({"message": "Already joined"}), 200

    progress = UserChallengeProgress(
        user_id=user.id,
        challenge_id=challenge_id,
        day_index=0,
        completed=False,
    )
    db.session.add(progress)
    db.session.commit()
    return jsonify({"message": "Challenge joined", "challenge_id": challenge_id}), 201


@app.route("/api/challenges/<int:challenge_id>/mark-complete", methods=["POST"])
@jwt_required_custom
def mark_challenge_complete(user, challenge_id):
    progress = UserChallengeProgress.query.filter_by(
        user_id=user.id, challenge_id=challenge_id
    ).first()
    if not progress:
        return jsonify({"error": "Challenge not joined"}), 400

    progress.day_index += 1
    if progress.day_index >= progress.challenge.days_required:
        progress.completed = True
    progress.last_updated = datetime.utcnow()
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Progress updated",
                "day_index": progress.day_index,
                "completed": progress.completed,
            }
        ),
        200,
    )


@app.route("/api/challenges/progress", methods=["GET"])
@jwt_required_custom
def get_user_challenge_progress(user):
    progress = UserChallengeProgress.query.filter_by(user_id=user.id).all()
    return (
        jsonify(
            {
                "progress": [
                    {
                        "challenge_id": p.challenge_id,
                        "challenge_name": p.challenge.name,
                        "day_index": p.day_index,
                        "completed": p.completed,
                    }
                    for p in progress
                ]
            }
        ),
        200,
    )


# ============================================
# ADMIN ROUTES
# ============================================


@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_get_users(user):
    users = User.query.order_by(User.created_at.desc()).all()
    return (
        jsonify(
            {
                "users": [
                    {
                        "id": u.id,
                        "username": u.username,
                        "email": u.email,
                        "is_admin": u.is_admin,
                        "is_active": u.is_active,
                        "total_workouts": u.total_workouts,
                        "created_at": (
                            u.created_at.isoformat() if u.created_at else None
                        ),
                        "last_login": (
                            u.last_login.isoformat() if u.last_login else None
                        ),
                    }
                    for u in users
                ],
                "count": len(users),
            }
        ),
        200,
    )


@app.route("/api/admin/users/<int:target_id>/deactivate", methods=["PATCH"])
@admin_required
def admin_deactivate_user(user, target_id):
    target = User.query.get(target_id)
    if not target:
        return jsonify({"error": "User not found"}), 404
    if target.id == user.id:
        return jsonify({"error": "Cannot deactivate yourself"}), 400
    target.is_active = not target.is_active
    db.session.commit()
    status = "activated" if target.is_active else "deactivated"
    return jsonify({"message": f"User {status}", "is_active": target.is_active}), 200


@app.route("/api/admin/users/<int:target_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(user, target_id):
    target = User.query.get(target_id)
    if not target:
        return jsonify({"error": "User not found"}), 404
    if target.id == user.id:
        return jsonify({"error": "Cannot delete yourself"}), 400
    db.session.delete(target)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200


# ============================================
# CLI COMMANDS
# ============================================


@app.cli.command("init-db")
def init_db():
    """Initialize database"""
    db.create_all()
    print("Database initialized!")


@app.cli.command("seed-exercises")
def seed_exercises_cmd():
    """Seed exercises"""
    from seed_data.exercises import seed_exercises

    seed_exercises(db)
    print("Exercises seeded!")


@app.cli.command("seed-athletes")
def seed_athletes():
    """Seed test athlete accounts"""
    from models import User

    # Check if users already exist
    if User.query.filter_by(email="mike@test.com").first():
        print("Test athletes already exist!")
        return

    athletes = [
        {
            "username": "weightlifter_mike",
            "email": "mike@test.com",
            "password": "mike123",
            "bio": "Powerlifting and bodybuilding. Chasing that 500lb deadlift.",
        },
        {
            "username": "calisthenics_sara",
            "email": "sara@test.com",
            "password": "sara123",
            "bio": "Bodyweight movements only. Pull-ups, muscle-ups, handstands.",
        },
    ]

    for athlete_data in athletes:
        user = User(
            username=athlete_data["username"],
            email=athlete_data["email"],
            bio=athlete_data["bio"],
        )
        user.set_password(athlete_data["password"])
        db.session.add(user)

    db.session.commit()
    print(f"Seeded {len(athletes)} test athletes!")


@app.cli.command("seed-routines")
def seed_routines_cmd():
    """Seed sample routines for test athletes"""
    from seed_data.routines import seed_routines

    seed_routines(db)
    print("Routines seeded!")


@app.cli.command("reset-db")
def reset_db():
    """Reset database"""
    db.drop_all()
    db.create_all()
    print("Database reset!")


@app.cli.command("seed-workouts")
def seed_workouts_cmd():
    """Seed workout history for test athletes"""
    from seed_data.workouts import seed_workouts

    seed_workouts(db)
    print("Workout history seeded!")


@app.cli.command("seed-challenges")
def seed_challenges_cmd():
    """Seed challenges"""
    from seed_data.challenges import seed_challenges

    seed_challenges(db)
    print("Challenges seeded!")


@app.cli.command("seed-admin")
def seed_admin():
    """Create the admin dev account"""
    existing = User.query.filter_by(email="admin@monty").first()
    if existing:
        existing.is_admin = True
        db.session.commit()
        print("✅ Admin already exists — is_admin flag confirmed!")
        return
    admin = User(username="admin", email="admin@monty")
    admin.set_password("monty123")
    admin.is_admin = True
    db.session.add(admin)
    db.session.commit()
    print("✅ Admin account created: admin@monty / monty123")


@app.cli.command("seed-templates")
def seed_templates_cmd():
    """Seed admin template routines"""
    from seed_data.templates import seed_templates
    seed_templates(db)
    print("Template routines seeded!")

@app.cli.command("fresh")
def fresh():
    """Nuke and reseed the entire database"""
    from seed_data.exercises import seed_exercises
    from seed_data.routines import seed_routines
    from seed_data.challenges import seed_challenges
    from seed_data.templates import seed_templates

    print("💣 Dropping all tables...")
    db.drop_all()
    db.create_all()

    print("🌱 Seeding exercises...")
    seed_exercises(db)

    print("👤 Seeding athletes...")
    athletes = [
        {
            "username": "weightlifter_mike",
            "email": "mike@test.com",
            "password": "mike123",
            "bio": "Powerlifting and bodybuilding.",
        },
        {
            "username": "calisthenics_sara",
            "email": "sara@test.com",
            "password": "sara123",
            "bio": "Bodyweight movements only.",
        },
    ]
    for a in athletes:
        u = User(username=a["username"], email=a["email"], bio=a["bio"])
        u.set_password(a["password"])
        db.session.add(u)
    db.session.commit()

    print("🏋️ Seeding routines...")
    seed_routines(db)
    print("📊 Seeding workout history...")
    from seed_data.workouts import seed_workouts

    seed_workouts(db)
    print("🔥 Seeding challenges...")
    seed_challenges(db)

    print("🔑 Creating admin...")
    admin = User(username="admin", email="admin@monty")
    admin.set_password("monty123")
    admin.is_admin = True
    db.session.add(admin)
    db.session.commit()
    print("📋 Seeding template routines...")
    seed_templates(db)
    print("✅ Done! Fresh database ready.")


# Run app
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
