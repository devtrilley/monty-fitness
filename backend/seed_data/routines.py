def seed_routines(db):
    """Seed sample routines for test athletes"""
    from models import User, Exercise, Routine, RoutineExercise, RoutineSet

    # Get users
    mike = User.query.filter_by(email="mike@test.com").first()
    sara = User.query.filter_by(email="sara@test.com").first()

    if not mike or not sara:
        print("❌ Test athletes not found. Run 'flask seed-athletes' first.")
        return

    # Helper function to find exercise
    def find_exercise(name, equipment):
        return Exercise.query.filter_by(name=name, equipment=equipment).first()

    # =====================================
    # MIKE'S ROUTINES (Powerlifting/Bodybuilding)
    # =====================================

    # --- MIKE: PUSH DAY ---
    push_routine = Routine(
        user_id=mike.id,
        name="Push Day 💪",
        description="Chest, Shoulders, Triceps",
        icon="💪",
    )
    db.session.add(push_routine)
    db.session.flush()

    push_exercises = [
        {
            "exercise": find_exercise("Bench Press", "Barbell"),
            "rest": 180,
            "sets": [
                {"type": "warmup", "weight": 135, "reps": 10},
                {"type": "normal", "weight": 185, "reps": 8},
                {"type": "normal", "weight": 205, "reps": 6},
                {"type": "normal", "weight": 225, "reps": 5},
                {"type": "normal", "weight": 225, "reps": 5},
            ],
        },
        {
            "exercise": find_exercise("Incline Bench Press", "Dumbbell"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 70, "reps": 10},
                {"type": "normal", "weight": 75, "reps": 8},
                {"type": "normal", "weight": 80, "reps": 6},
            ],
        },
        {
            "exercise": find_exercise("Chest Fly", "Dumbbell"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 35, "reps": 12},
                {"type": "normal", "weight": 35, "reps": 12},
                {"type": "normal", "weight": 35, "reps": 12},
            ],
        },
        {
            "exercise": find_exercise("Overhead Press", "Dumbbell"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 50, "reps": 10},
                {"type": "normal", "weight": 55, "reps": 8},
                {"type": "normal", "weight": 60, "reps": 6},
            ],
        },
        {
            "exercise": find_exercise("Lateral Raise", "Dumbbell"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 20, "reps": 15},
                {"type": "normal", "weight": 20, "reps": 15},
                {"type": "normal", "weight": 20, "reps": 15},
            ],
        },
        {
            "exercise": find_exercise("Tricep Pushdown", "Cable"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 60, "reps": 12},
                {"type": "normal", "weight": 70, "reps": 10},
                {"type": "normal", "weight": 80, "reps": 8},
            ],
        },
    ]

    for idx, ex_data in enumerate(push_exercises):
        if ex_data["exercise"]:
            routine_ex = RoutineExercise(
                routine_id=push_routine.id,
                exercise_id=ex_data["exercise"].id,
                order_index=idx,
                planned_sets=len(ex_data["sets"]),
                rest_seconds=ex_data["rest"],
            )
            db.session.add(routine_ex)
            db.session.flush()

            for set_num, set_data in enumerate(ex_data["sets"], start=1):
                routine_set = RoutineSet(
                    routine_exercise_id=routine_ex.id,
                    set_number=set_num,
                    set_type=set_data["type"],
                    weight=set_data["weight"],
                    reps=set_data["reps"],
                )
                db.session.add(routine_set)

    # --- MIKE: PULL DAY ---
    pull_routine = Routine(
        user_id=mike.id,
        name="Pull Day 🔙",
        description="Back, Biceps, Rear Delts",
        icon="🔙",
    )
    db.session.add(pull_routine)
    db.session.flush()

    pull_exercises = [
        {
            "exercise": find_exercise("Deadlift", "Barbell"),
            "rest": 240,
            "sets": [
                {"type": "warmup", "weight": 135, "reps": 10},
                {"type": "warmup", "weight": 225, "reps": 5},
                {"type": "normal", "weight": 315, "reps": 5},
                {"type": "normal", "weight": 365, "reps": 3},
                {"type": "normal", "weight": 405, "reps": 1},
            ],
        },
        {
            "exercise": find_exercise("Pull Up", "Bodyweight"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 10},
                {"type": "normal", "weight": 0, "reps": 8},
                {"type": "normal", "weight": 0, "reps": 6},
                {"type": "failure", "weight": 0, "reps": None},
            ],
        },
        {
            "exercise": find_exercise("Bent Over Row", "Barbell"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 135, "reps": 10},
                {"type": "normal", "weight": 155, "reps": 8},
                {"type": "normal", "weight": 175, "reps": 6},
            ],
        },
        {
            "exercise": find_exercise("Lat Pulldown", "Cable"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 140, "reps": 12},
                {"type": "normal", "weight": 160, "reps": 10},
                {"type": "normal", "weight": 180, "reps": 8},
            ],
        },
        {
            "exercise": find_exercise("Face Pull", "Cable"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 60, "reps": 15},
                {"type": "normal", "weight": 60, "reps": 15},
                {"type": "normal", "weight": 60, "reps": 15},
            ],
        },
        {
            "exercise": find_exercise("Bicep Curl", "Barbell"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 60, "reps": 10},
                {"type": "normal", "weight": 70, "reps": 8},
                {"type": "normal", "weight": 80, "reps": 6},
            ],
        },
        {
            "exercise": find_exercise("Hammer Curl", "Dumbbell"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 35, "reps": 12},
                {"type": "normal", "weight": 35, "reps": 12},
                {"type": "normal", "weight": 35, "reps": 12},
            ],
        },
    ]

    for idx, ex_data in enumerate(pull_exercises):
        if ex_data["exercise"]:
            routine_ex = RoutineExercise(
                routine_id=pull_routine.id,
                exercise_id=ex_data["exercise"].id,
                order_index=idx,
                planned_sets=len(ex_data["sets"]),
                rest_seconds=ex_data["rest"],
            )
            db.session.add(routine_ex)
            db.session.flush()

            for set_num, set_data in enumerate(ex_data["sets"], start=1):
                routine_set = RoutineSet(
                    routine_exercise_id=routine_ex.id,
                    set_number=set_num,
                    set_type=set_data["type"],
                    weight=set_data["weight"],
                    reps=set_data["reps"],
                )
                db.session.add(routine_set)

    # --- MIKE: LEG DAY ---
    leg_routine = Routine(
        user_id=mike.id,
        name="Leg Day 🦵",
        description="Quads, Hamstrings, Glutes, Calves",
        icon="🦵",
    )
    db.session.add(leg_routine)
    db.session.flush()

    leg_exercises = [
        {
            "exercise": find_exercise("Squat", "Barbell"),
            "rest": 180,
            "sets": [
                {"type": "warmup", "weight": 135, "reps": 10},
                {"type": "normal", "weight": 185, "reps": 8},
                {"type": "normal", "weight": 225, "reps": 6},
                {"type": "normal", "weight": 275, "reps": 5},
                {"type": "normal", "weight": 275, "reps": 5},
            ],
        },
        {
            "exercise": find_exercise("Romanian Deadlift", "Barbell"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 135, "reps": 10},
                {"type": "normal", "weight": 185, "reps": 8},
                {"type": "normal", "weight": 205, "reps": 8},
            ],
        },
        {
            "exercise": find_exercise("Leg Press", "Machine"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 360, "reps": 12},
                {"type": "normal", "weight": 450, "reps": 10},
                {"type": "normal", "weight": 540, "reps": 8},
            ],
        },
        {
            "exercise": find_exercise("Lying Leg Curl", "Machine"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 90, "reps": 12},
                {"type": "normal", "weight": 100, "reps": 10},
                {"type": "normal", "weight": 110, "reps": 8},
            ],
        },
        {
            "exercise": find_exercise("Leg Extension", "Machine"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 120, "reps": 12},
                {"type": "normal", "weight": 130, "reps": 10},
                {"type": "normal", "weight": 140, "reps": 8},
            ],
        },
        {
            "exercise": find_exercise("Standing Calf Raise", "Machine"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 180, "reps": 15},
                {"type": "normal", "weight": 200, "reps": 12},
                {"type": "normal", "weight": 220, "reps": 10},
            ],
        },
    ]

    for idx, ex_data in enumerate(leg_exercises):
        if ex_data["exercise"]:
            routine_ex = RoutineExercise(
                routine_id=leg_routine.id,
                exercise_id=ex_data["exercise"].id,
                order_index=idx,
                planned_sets=len(ex_data["sets"]),
                rest_seconds=ex_data["rest"],
            )
            db.session.add(routine_ex)
            db.session.flush()

            for set_num, set_data in enumerate(ex_data["sets"], start=1):
                routine_set = RoutineSet(
                    routine_exercise_id=routine_ex.id,
                    set_number=set_num,
                    set_type=set_data["type"],
                    weight=set_data["weight"],
                    reps=set_data["reps"],
                )
                db.session.add(routine_set)

    # =====================================
    # SARA'S ROUTINES (Calisthenics)
    # =====================================

    # --- SARA: UPPER BODY ---
    upper_routine = Routine(
        user_id=sara.id,
        name="Upper Body Flow 🤸",
        description="Pull-ups, Dips, Push-ups",
        icon="🤸",
    )
    db.session.add(upper_routine)
    db.session.flush()

    upper_exercises = [
        {
            "exercise": find_exercise("Pull Up", "Bodyweight"),
            "rest": 120,
            "sets": [
                {"type": "warmup", "weight": 0, "reps": 5},
                {"type": "normal", "weight": 0, "reps": 8},
                {"type": "normal", "weight": 0, "reps": 8},
                {"type": "normal", "weight": 0, "reps": 8},
                {"type": "failure", "weight": 0, "reps": None},
            ],
        },
        {
            "exercise": find_exercise("Dips", "Bodyweight"),
            "rest": 120,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 10},
                {"type": "normal", "weight": 0, "reps": 10},
                {"type": "normal", "weight": 0, "reps": 10},
                {"type": "failure", "weight": 0, "reps": None},
            ],
        },
        {
            "exercise": find_exercise("Push Up", "Bodyweight"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
            ],
        },
        {
            "exercise": find_exercise("Diamond Push Up", "Bodyweight"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 12},
                {"type": "normal", "weight": 0, "reps": 12},
                {"type": "normal", "weight": 0, "reps": 12},
            ],
        },
        {
            "exercise": find_exercise("Hanging Leg Raise", "Bodyweight"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 15},
                {"type": "normal", "weight": 0, "reps": 15},
                {"type": "normal", "weight": 0, "reps": 15},
            ],
        },
    ]

    for idx, ex_data in enumerate(upper_exercises):
        if ex_data["exercise"]:
            routine_ex = RoutineExercise(
                routine_id=upper_routine.id,
                exercise_id=ex_data["exercise"].id,
                order_index=idx,
                planned_sets=len(ex_data["sets"]),
                rest_seconds=ex_data["rest"],
            )
            db.session.add(routine_ex)
            db.session.flush()

            for set_num, set_data in enumerate(ex_data["sets"], start=1):
                routine_set = RoutineSet(
                    routine_exercise_id=routine_ex.id,
                    set_number=set_num,
                    set_type=set_data["type"],
                    weight=set_data["weight"],
                    reps=set_data["reps"],
                )
                db.session.add(routine_set)

    # --- SARA: LOWER BODY ---
    lower_routine = Routine(
        user_id=sara.id,
        name="Lower Body Power 🏋️",
        description="Squats, Lunges, Glute Work",
        icon="🏋️",
    )
    db.session.add(lower_routine)
    db.session.flush()

    lower_exercises = [
        {
            "exercise": find_exercise("Squat", "Bodyweight"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
            ],
        },
        {
            "exercise": find_exercise("Jump Squat", "Bodyweight"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 15},
                {"type": "normal", "weight": 0, "reps": 15},
                {"type": "normal", "weight": 0, "reps": 15},
            ],
        },
        {
            "exercise": find_exercise("Bulgarian Split Squat", "Bodyweight"),
            "rest": 90,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 12},
                {"type": "normal", "weight": 0, "reps": 12},
                {"type": "normal", "weight": 0, "reps": 12},
            ],
        },
        {
            "exercise": find_exercise("Walking Lunge", "Bodyweight"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
            ],
        },
        {
            "exercise": find_exercise("Glute Bridge", "Bodyweight"),
            "rest": 60,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
                {"type": "normal", "weight": 0, "reps": 20},
            ],
        },
        {
            "exercise": find_exercise("Calf Raise", "Bodyweight"),
            "rest": 45,
            "sets": [
                {"type": "normal", "weight": 0, "reps": 25},
                {"type": "normal", "weight": 0, "reps": 25},
                {"type": "normal", "weight": 0, "reps": 25},
            ],
        },
    ]

    for idx, ex_data in enumerate(lower_exercises):
        if ex_data["exercise"]:
            routine_ex = RoutineExercise(
                routine_id=lower_routine.id,
                exercise_id=ex_data["exercise"].id,
                order_index=idx,
                planned_sets=len(ex_data["sets"]),
                rest_seconds=ex_data["rest"],
            )
            db.session.add(routine_ex)
            db.session.flush()

            for set_num, set_data in enumerate(ex_data["sets"], start=1):
                routine_set = RoutineSet(
                    routine_exercise_id=routine_ex.id,
                    set_number=set_num,
                    set_type=set_data["type"],
                    weight=set_data["weight"],
                    reps=set_data["reps"],
                )
                db.session.add(routine_set)

    db.session.commit()
    print(f"✅ Seeded routines for Mike and Sara")
    print(f"   - Mike: 3 routines (Push/Pull/Legs)")
    print(f"   - Sara: 2 routines (Upper/Lower Calisthenics)")
