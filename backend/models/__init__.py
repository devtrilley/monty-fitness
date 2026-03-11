from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()


# ============================================
# USER MODEL
# ============================================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    profile_photo_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # Analytics fields
    total_workouts = db.Column(db.Integer, default=0)
    best_weekly_streak = db.Column(db.Integer, default=0)
    current_weekly_streak = db.Column(db.Integer, default=0)
    last_workout_week = db.Column(db.String(10), nullable=True)
    display_name_preference = db.Column(db.String(20), default="username")

    custom_exercises = db.relationship(
        "Exercise",
        back_populates="creator",
        foreign_keys="Exercise.created_by_user_id",
        cascade="all, delete-orphan",
    )
    routines = db.relationship(
        "Routine", back_populates="user", cascade="all, delete-orphan"
    )
    workout_sessions = db.relationship(
        "WorkoutSession", back_populates="user", cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profile_photo_url": self.profile_photo_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "total_workouts": self.total_workouts,
            "current_weekly_streak": self.current_weekly_streak,
            "best_weekly_streak": self.best_weekly_streak,
            "is_admin": self.is_admin,
            "is_active": self.is_active,
            "display_name_preference": self.display_name_preference,
        }


# ============================================
# EXERCISE MODEL
# ============================================
class Exercise(db.Model):
    __tablename__ = "exercises"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    equipment = db.Column(db.String(50), nullable=False)
    primary_muscle = db.Column(db.String(50), nullable=False, index=True)
    secondary_muscles = db.Column(db.String(200), nullable=True)
    instructions = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    video_url = db.Column(db.String(255), nullable=True)
    is_global = db.Column(db.Boolean, default=False, index=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship(
        "User", back_populates="custom_exercises", foreign_keys=[created_by_user_id]
    )
    routine_exercises = db.relationship(
        "RoutineExercise", back_populates="exercise", cascade="all, delete-orphan"
    )
    workout_exercises = db.relationship("WorkoutExercise", back_populates="exercise")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "equipment": self.equipment,
            "primary_muscle": self.primary_muscle,
            "secondary_muscles": (
                self.secondary_muscles.split(",") if self.secondary_muscles else []
            ),
            "instructions": self.instructions,
            "image_url": self.image_url,
            "video_url": self.video_url,
            "is_global": self.is_global,
            "created_by_user_id": self.created_by_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================
# ROUTINE FOLDER MODEL
# ============================================
class RoutineFolder(db.Model):
    __tablename__ = "routine_folders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="folders")
    routines = db.relationship("Routine", back_populates="folder")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================
# ROUTINE MODEL
# ============================================
class Routine(db.Model):
    __tablename__ = "routines"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(10), nullable=True)
    folder_id = db.Column(
        db.Integer, db.ForeignKey("routine_folders.id"), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User", back_populates="routines")
    folder = db.relationship("RoutineFolder", back_populates="routines")
    routine_exercises = db.relationship(
        "RoutineExercise",
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineExercise.order_index",
    )
    workout_sessions = db.relationship("WorkoutSession", back_populates="routine")

    def to_dict(self, include_exercises=False):
        result = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "folder_id": self.folder_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_exercises:
            result["exercises"] = [re.to_dict() for re in self.routine_exercises]
        return result


# ============================================
# ROUTINE EXERCISE MODEL
# ============================================
class RoutineExercise(db.Model):
    __tablename__ = "routine_exercises"

    id = db.Column(db.Integer, primary_key=True)
    routine_id = db.Column(
        db.Integer, db.ForeignKey("routines.id"), nullable=False, index=True
    )
    exercise_id = db.Column(
        db.Integer, db.ForeignKey("exercises.id"), nullable=False, index=True
    )
    order_index = db.Column(db.Integer, nullable=False, default=0)
    planned_sets = db.Column(db.Integer, nullable=False, default=3)
    planned_reps_min = db.Column(db.Integer, nullable=True)
    planned_reps_max = db.Column(db.Integer, nullable=True)
    rest_seconds = db.Column(db.Integer, nullable=True, default=120)
    notes = db.Column(db.Text, nullable=True)
    # Add this line inside RoutineExercise class, after the existing relationships
    sets = db.relationship(
        "RoutineSet",
        back_populates="routine_exercise",
        cascade="all, delete-orphan",
        order_by="RoutineSet.set_number",
    )

    routine = db.relationship("Routine", back_populates="routine_exercises")
    exercise = db.relationship("Exercise", back_populates="routine_exercises")

    def to_dict(self):
        return {
            "id": self.id,
            "routine_id": self.routine_id,
            "exercise_id": self.exercise_id,
            "exercise_name": self.exercise.name if self.exercise else None,  # Add this
            "exercise": self.exercise.to_dict() if self.exercise else None,
            "order_index": self.order_index,
            "planned_sets": self.planned_sets,
            "planned_reps_min": self.planned_reps_min,
            "planned_reps_max": self.planned_reps_max,
            "rest_seconds": self.rest_seconds,
            "notes": self.notes,
            "sets": [s.to_dict() for s in self.sets],  # Add this line
        }


# ============================================
# WORKOUT SESSION MODEL
# ============================================
class WorkoutSession(db.Model):
    __tablename__ = "workout_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    routine_id = db.Column(
        db.Integer, db.ForeignKey("routines.id"), nullable=True, index=True
    )
    name = db.Column(db.String(150), nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    session_date = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, index=True
    )
    status = db.Column(
        db.String(20), default="in_progress"
    )  # in_progress, completed, discarded
    notes = db.Column(db.Text, nullable=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey("challenges.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User", back_populates="workout_sessions")
    routine = db.relationship("Routine", back_populates="workout_sessions")
    challenge = db.relationship("Challenge", backref="workout_sessions")
    workout_exercises = db.relationship(
        "WorkoutExercise",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.order_index",
    )

    def calculate_total_volume(self):
        total = 0
        for exercise in self.workout_exercises:
            for set_record in exercise.sets:
                if set_record.weight and set_record.reps:
                    total += set_record.weight * set_record.reps
        return total

    def count_prs(self):
        return sum(1 for ex in self.workout_exercises for s in ex.sets if s.is_pr)

    def to_dict(self, include_exercises=False):
        result = {
            "id": self.id,
            "user_id": self.user_id,
            "routine_id": self.routine_id,
            "routine_name": self.routine.name if self.routine else None,
            "name": self.name
            or (self.routine.name if self.routine else "Quick Workout"),
            "duration_minutes": self.duration_minutes,
            "session_date": (
                self.session_date.replace(tzinfo=timezone.utc).isoformat()
                if self.session_date
                else None
            ),
            "status": self.status,
            "notes": self.notes,
            "total_volume": self.calculate_total_volume(),
            "pr_count": self.count_prs(),
            "challenge_id": self.challenge_id,
            "challenge_required_reps": (
                self.challenge.days_required
                if self.challenge_id and self.challenge
                else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_exercises:
            result["exercises"] = [we.to_dict() for we in self.workout_exercises]
        return result


# ============================================
# WORKOUT EXERCISE MODEL
# ============================================
class WorkoutExercise(db.Model):
    __tablename__ = "workout_exercises"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer, db.ForeignKey("workout_sessions.id"), nullable=False, index=True
    )
    exercise_id = db.Column(
        db.Integer, db.ForeignKey("exercises.id"), nullable=False, index=True
    )
    order_index = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)

    session = db.relationship("WorkoutSession", back_populates="workout_exercises")
    exercise = db.relationship("Exercise", back_populates="workout_exercises")
    sets = db.relationship(
        "WorkoutSet",
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.set_number",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "exercise_id": self.exercise_id,
            "exercise": self.exercise.to_dict() if self.exercise else None,
            "order_index": self.order_index,
            "notes": self.notes,
            "sets": [s.to_dict() for s in self.sets],
        }


# ============================================
# WORKOUT SET MODEL
# ============================================
class WorkoutSet(db.Model):
    __tablename__ = "workout_sets"

    id = db.Column(db.Integer, primary_key=True)
    workout_exercise_id = db.Column(
        db.Integer, db.ForeignKey("workout_exercises.id"), nullable=False, index=True
    )
    set_number = db.Column(db.Integer, nullable=False)
    weight = db.Column(db.Float, nullable=True)
    reps = db.Column(db.Integer, nullable=True)
    rir = db.Column(db.Integer, nullable=True)  # Reps in Reserve
    is_pr = db.Column(db.Boolean, default=False)
    pr_type = db.Column(db.String(20), nullable=True)  # 'weight', 'reps', 'volume'
    set_type = db.Column(db.String(20), default="normal")

    workout_exercise = db.relationship("WorkoutExercise", back_populates="sets")

    def to_dict(self):
        return {
            "id": self.id,
            "workout_exercise_id": self.workout_exercise_id,
            "set_number": self.set_number,
            "weight": self.weight,
            "reps": self.reps,
            "rir": self.rir,
            "is_pr": self.is_pr,
            "pr_type": self.pr_type,  # ADD THIS
            "set_type": self.set_type,
        }


# Add this after the RoutineExercise model (around line 140)


class RoutineSet(db.Model):
    __tablename__ = "routine_sets"

    id = db.Column(db.Integer, primary_key=True)
    routine_exercise_id = db.Column(
        db.Integer, db.ForeignKey("routine_exercises.id"), nullable=False, index=True
    )
    set_number = db.Column(db.Integer, nullable=False)
    set_type = db.Column(
        db.String(20), default="normal"
    )  # normal, warmup, failure, drop
    weight = db.Column(db.Float, nullable=True)
    reps = db.Column(db.Integer, nullable=True)

    routine_exercise = db.relationship("RoutineExercise", back_populates="sets")

    def to_dict(self):
        return {
            "id": self.id,
            "set_number": self.set_number,
            "type": self.set_type,
            "weight": self.weight,
            "reps": self.reps,
        }


# ======================
# ✅ CHALLENGES SYSTEM
# ======================


class Challenge(db.Model):
    __tablename__ = "challenges"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    days_required = db.Column(db.Integer, nullable=False, default=30)
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(255))
    type = db.Column(
        db.String(30), default="progressive"
    )  # progressive | static | circuit
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class UserChallengeProgress(db.Model):
    __tablename__ = "user_challenge_progress"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey("challenges.id"), nullable=False)
    day_index = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="challenges_progress", lazy=True)
    challenge = db.relationship("Challenge", backref="user_progress", lazy=True)
