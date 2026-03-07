def seed_workouts(db):
    """Seed completed workout history for test athletes"""
    from models import (
        User,
        Exercise,
        Routine,
        WorkoutSession,
        WorkoutExercise,
        WorkoutSet,
    )
    from datetime import datetime, timedelta, date

    mike = User.query.filter_by(email="mike@test.com").first()
    sara = User.query.filter_by(email="sara@test.com").first()
    if not mike or not sara:
        print("❌ Test athletes not found.")
        return

    def ex(name, equipment):
        return Exercise.query.filter_by(name=name, equipment=equipment).first()

    def make_session(user, routine, days_ago, duration, exercises_data):
        session_date = datetime.utcnow() - timedelta(days=days_ago)
        session = WorkoutSession(
            user_id=user.id,
            routine_id=routine.id if routine else None,
            name=routine.name if routine else "Quick Workout",
            status="completed",
            session_date=session_date,
            duration_minutes=duration,
        )
        db.session.add(session)
        db.session.flush()
        for order_idx, ex_data in enumerate(exercises_data):
            exercise = ex_data.get("exercise")
            if not exercise:
                continue
            workout_ex = WorkoutExercise(
                session_id=session.id,
                exercise_id=exercise.id,
                order_index=order_idx,
            )
            db.session.add(workout_ex)
            db.session.flush()
            for set_num, s in enumerate(ex_data["sets"], start=1):
                ws = WorkoutSet(
                    workout_exercise_id=workout_ex.id,
                    set_number=set_num,
                    set_type=s.get("type", "normal"),
                    weight=s.get("weight"),
                    reps=s.get("reps"),
                )
                db.session.add(ws)
        user.total_workouts = (user.total_workouts or 0) + 1
        return session

    # ── MIKE exercises ──────────────────────────────────────────────────────
    push = Routine.query.filter_by(user_id=mike.id, name="Push Day 💪").first()
    pull = Routine.query.filter_by(user_id=mike.id, name="Pull Day 🔙").first()
    legs = Routine.query.filter_by(user_id=mike.id, name="Leg Day 🦵").first()

    bench = ex("Bench Press", "Barbell")
    incline = ex("Incline Bench Press", "Dumbbell")
    chest_fly = ex("Chest Fly", "Dumbbell")
    ohp = ex("Shoulder Press", "Dumbbell")
    lateral = ex("Lateral Raise", "Dumbbell")
    pushdown = ex("Tricep Pushdown", "Cable")
    deadlift = ex("Deadlift", "Barbell")
    pullup = ex("Pull Up", "Bodyweight")
    row = ex("Row", "Barbell")
    pulldown = ex("Lat Pulldown", "Cable")
    facepull = ex("Face Pull", "Cable")
    curl = ex("Curl", "Barbell")
    hammer = ex("Hammer Curl", "Dumbbell")
    squat = ex("Squat", "Barbell")
    rdl = ex("Romanian Deadlift", "Barbell")
    legpress = ex("Leg Press", "Machine")
    legcurl = ex("Leg Curl", "Machine")
    legext = ex("Leg Extension", "Machine")
    calfraise = ex("Calf Raise", "Machine")

    # Push sessions — progressive bench overload
    for days_ago, bw, iw, dur in [
        (56, 205, 65, 62),
        (49, 210, 67, 65),
        (42, 215, 70, 63),
        (35, 215, 70, 67),
        (28, 220, 72, 64),
        (21, 225, 75, 68),
        (14, 225, 75, 65),
        (7, 230, 77, 70),
        (2, 235, 80, 68),
    ]:
        make_session(
            mike,
            push,
            days_ago,
            dur,
            [
                {
                    "exercise": bench,
                    "sets": [
                        {"type": "warmup", "weight": 135, "reps": 10},
                        {"type": "normal", "weight": bw - 20, "reps": 8},
                        {"type": "normal", "weight": bw, "reps": 6},
                        {"type": "normal", "weight": bw + 10, "reps": 5},
                        {"type": "normal", "weight": bw + 10, "reps": 5},
                    ],
                },
                {
                    "exercise": incline,
                    "sets": [
                        {"type": "normal", "weight": iw, "reps": 10},
                        {"type": "normal", "weight": iw + 5, "reps": 8},
                        {"type": "normal", "weight": iw + 10, "reps": 6},
                    ],
                },
                {
                    "exercise": chest_fly,
                    "sets": [
                        {"type": "normal", "weight": 35, "reps": 12},
                        {"type": "normal", "weight": 35, "reps": 12},
                        {"type": "normal", "weight": 35, "reps": 12},
                    ],
                },
                {
                    "exercise": ohp,
                    "sets": [
                        {"type": "normal", "weight": 50, "reps": 10},
                        {"type": "normal", "weight": 55, "reps": 8},
                        {"type": "normal", "weight": 60, "reps": 6},
                    ],
                },
                {
                    "exercise": lateral,
                    "sets": [
                        {"type": "normal", "weight": 20, "reps": 15},
                        {"type": "normal", "weight": 20, "reps": 15},
                        {"type": "normal", "weight": 20, "reps": 15},
                    ],
                },
                {
                    "exercise": pushdown,
                    "sets": [
                        {"type": "normal", "weight": 60, "reps": 12},
                        {"type": "normal", "weight": 70, "reps": 10},
                        {"type": "normal", "weight": 80, "reps": 8},
                    ],
                },
            ],
        )

    # Pull sessions — deadlift PR chase
    for days_ago, dl, rw, dur in [
        (54, 365, 315, 72),
        (47, 375, 325, 74),
        (40, 385, 335, 71),
        (33, 395, 345, 75),
        (26, 405, 355, 73),
        (19, 405, 355, 76),
        (12, 415, 365, 74),
        (5, 425, 375, 78),
    ]:
        make_session(
            mike,
            pull,
            days_ago,
            dur,
            [
                {
                    "exercise": deadlift,
                    "sets": [
                        {"type": "warmup", "weight": 135, "reps": 10},
                        {"type": "warmup", "weight": 225, "reps": 5},
                        {"type": "normal", "weight": dl - 40, "reps": 5},
                        {"type": "normal", "weight": dl, "reps": 3},
                        {"type": "normal", "weight": dl + 20, "reps": 1},
                    ],
                },
                {
                    "exercise": pullup,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 10},
                        {"type": "normal", "weight": None, "reps": 9},
                        {"type": "normal", "weight": None, "reps": 7},
                        {"type": "failure", "weight": None, "reps": 5},
                    ],
                },
                {
                    "exercise": row,
                    "sets": [
                        {"type": "normal", "weight": rw - 20, "reps": 10},
                        {"type": "normal", "weight": rw, "reps": 8},
                        {"type": "normal", "weight": rw + 20, "reps": 6},
                    ],
                },
                {
                    "exercise": pulldown,
                    "sets": [
                        {"type": "normal", "weight": 140, "reps": 12},
                        {"type": "normal", "weight": 160, "reps": 10},
                        {"type": "normal", "weight": 180, "reps": 8},
                    ],
                },
                {
                    "exercise": facepull,
                    "sets": [
                        {"type": "normal", "weight": 60, "reps": 15},
                        {"type": "normal", "weight": 60, "reps": 15},
                        {"type": "normal", "weight": 60, "reps": 15},
                    ],
                },
                {
                    "exercise": curl,
                    "sets": [
                        {"type": "normal", "weight": 65, "reps": 10},
                        {"type": "normal", "weight": 75, "reps": 8},
                        {"type": "normal", "weight": 85, "reps": 6},
                    ],
                },
                {
                    "exercise": hammer,
                    "sets": [
                        {"type": "normal", "weight": 35, "reps": 12},
                        {"type": "normal", "weight": 35, "reps": 12},
                        {"type": "normal", "weight": 35, "reps": 12},
                    ],
                },
            ],
        )

    # Leg sessions — squat PR chase
    for days_ago, sq, dur in [
        (52, 255, 58),
        (45, 265, 61),
        (38, 275, 60),
        (31, 285, 63),
        (24, 295, 62),
        (17, 305, 65),
        (10, 315, 64),
        (3, 325, 67),
    ]:
        make_session(
            mike,
            legs,
            days_ago,
            dur,
            [
                {
                    "exercise": squat,
                    "sets": [
                        {"type": "warmup", "weight": 135, "reps": 10},
                        {"type": "normal", "weight": sq - 40, "reps": 8},
                        {"type": "normal", "weight": sq, "reps": 6},
                        {"type": "normal", "weight": sq + 20, "reps": 5},
                        {"type": "normal", "weight": sq + 20, "reps": 5},
                    ],
                },
                {
                    "exercise": rdl,
                    "sets": [
                        {"type": "normal", "weight": 155, "reps": 10},
                        {"type": "normal", "weight": 185, "reps": 8},
                        {"type": "normal", "weight": 205, "reps": 8},
                    ],
                },
                {
                    "exercise": legpress,
                    "sets": [
                        {"type": "normal", "weight": 360, "reps": 12},
                        {"type": "normal", "weight": 450, "reps": 10},
                        {"type": "normal", "weight": 540, "reps": 8},
                    ],
                },
                {
                    "exercise": legcurl,
                    "sets": [
                        {"type": "normal", "weight": 90, "reps": 12},
                        {"type": "normal", "weight": 100, "reps": 10},
                        {"type": "normal", "weight": 110, "reps": 8},
                    ],
                },
                {
                    "exercise": legext,
                    "sets": [
                        {"type": "normal", "weight": 120, "reps": 12},
                        {"type": "normal", "weight": 130, "reps": 10},
                        {"type": "normal", "weight": 140, "reps": 8},
                    ],
                },
                {
                    "exercise": calfraise,
                    "sets": [
                        {"type": "normal", "weight": 180, "reps": 15},
                        {"type": "normal", "weight": 200, "reps": 12},
                        {"type": "normal", "weight": 220, "reps": 10},
                    ],
                },
            ],
        )

    # ── SARA exercises ──────────────────────────────────────────────────────
    upper = Routine.query.filter_by(user_id=sara.id, name="Upper Body Flow 🤸").first()
    lower = Routine.query.filter_by(user_id=sara.id, name="Lower Body Power 🏋️").first()

    s_pullup = ex("Pull Up", "Bodyweight")
    dips = ex("Dips", "Bodyweight")
    pushup = ex("Push Up", "Bodyweight")
    diamond = ex("Diamond Push Up", "Bodyweight")
    leg_raise = ex("Hanging Leg Raise", "Bodyweight")
    bw_squat = ex("Squat", "Bodyweight")
    jump_sq = ex("Jump Squat", "Bodyweight")
    bss = ex("Bulgarian Split Squat", "Bodyweight")
    lunge = ex("Walking Lunge", "Bodyweight")
    bridge = ex("Glute Bridge", "Bodyweight")
    bw_calf = ex("Calf Raise", "Bodyweight")

    # Upper sessions — pull-up reps improving over time
    for days_ago, pu_reps, dur in [
        (55, 6, 48),
        (48, 7, 50),
        (41, 7, 49),
        (34, 8, 51),
        (27, 8, 52),
        (20, 9, 50),
        (13, 9, 53),
        (6, 10, 51),
        (1, 11, 54),
    ]:
        make_session(
            sara,
            upper,
            days_ago,
            dur,
            [
                {
                    "exercise": s_pullup,
                    "sets": [
                        {"type": "warmup", "weight": None, "reps": 5},
                        {"type": "normal", "weight": None, "reps": pu_reps},
                        {"type": "normal", "weight": None, "reps": pu_reps},
                        {"type": "normal", "weight": None, "reps": max(pu_reps - 1, 4)},
                        {
                            "type": "failure",
                            "weight": None,
                            "reps": max(pu_reps - 2, 3),
                        },
                    ],
                },
                {
                    "exercise": dips,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 10},
                        {"type": "normal", "weight": None, "reps": 10},
                        {"type": "normal", "weight": None, "reps": 10},
                        {"type": "failure", "weight": None, "reps": 7},
                    ],
                },
                {
                    "exercise": pushup,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                    ],
                },
                {
                    "exercise": diamond,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 12},
                        {"type": "normal", "weight": None, "reps": 12},
                        {"type": "normal", "weight": None, "reps": 12},
                    ],
                },
                {
                    "exercise": leg_raise,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 15},
                        {"type": "normal", "weight": None, "reps": 15},
                        {"type": "normal", "weight": None, "reps": 15},
                    ],
                },
            ],
        )

    # Lower sessions
    for days_ago, dur in [
        (53, 44),
        (46, 45),
        (39, 43),
        (32, 47),
        (25, 45),
        (18, 46),
        (11, 44),
        (4, 48),
    ]:
        make_session(
            sara,
            lower,
            days_ago,
            dur,
            [
                {
                    "exercise": bw_squat,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                    ],
                },
                {
                    "exercise": jump_sq,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 15},
                        {"type": "normal", "weight": None, "reps": 15},
                        {"type": "normal", "weight": None, "reps": 15},
                    ],
                },
                {
                    "exercise": bss,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 12},
                        {"type": "normal", "weight": None, "reps": 12},
                        {"type": "normal", "weight": None, "reps": 12},
                    ],
                },
                {
                    "exercise": lunge,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                    ],
                },
                {
                    "exercise": bridge,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                        {"type": "normal", "weight": None, "reps": 20},
                    ],
                },
                {
                    "exercise": bw_calf,
                    "sets": [
                        {"type": "normal", "weight": None, "reps": 25},
                        {"type": "normal", "weight": None, "reps": 25},
                        {"type": "normal", "weight": None, "reps": 25},
                    ],
                },
            ],
        )

    # ── Streak + week data ──────────────────────────────────────────────────
    today = date.today()
    current_week = today.strftime("%Y-W%U")

    mike.current_weekly_streak = 8
    mike.best_weekly_streak = 8
    mike.last_workout_week = current_week

    sara.current_weekly_streak = 8
    sara.best_weekly_streak = 8
    sara.last_workout_week = current_week

    db.session.commit()
    print(f"✅ Seeded workout history:")
    print(
        f"   - Mike: {mike.total_workouts} sessions (Push/Pull/Legs, progressive overload)"
    )
    print(
        f"   - Sara: {sara.total_workouts} sessions (Upper/Lower, pull-up progression)"
    )
