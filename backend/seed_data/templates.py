from models import User, Routine, RoutineFolder, RoutineExercise, RoutineSet, Exercise


def find_exercise(name, equipment=None):
    q = Exercise.query.filter(Exercise.name.ilike(f"%{name}%"))
    if equipment:
        q = q.filter(Exercise.equipment == equipment)
    return q.first()


def make_sets(sets_data):
    return sets_data


TEMPLATE_FOLDERS = [
    {
        "name": "Push / Pull / Legs",
        "routines": [
            {
                "name": "Push Day",
                "description": "Chest, shoulders, and triceps. Heavy compounds first, isolations to finish.",
                "icon": "💪",
                "exercises": [
                    {
                        "name": "Bench Press",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 135, "reps": 8}] * 4,
                    },
                    {
                        "name": "Incline Bench Press",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 60, "reps": 10}] * 3,
                    },
                    {
                        "name": "Overhead Press",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 40, "reps": 10}] * 3,
                    },
                    {
                        "name": "Lateral Raise",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 20, "reps": 15}] * 3,
                    },
                    {
                        "name": "Tricep Pushdown",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 50, "reps": 12}] * 3,
                    },
                    {
                        "name": "Skull Crusher",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 55, "reps": 12}] * 3,
                    },
                ],
            },
            {
                "name": "Pull Day",
                "description": "Back and biceps. Start with the deadlift, finish with curls.",
                "icon": "🏋️",
                "exercises": [
                    {
                        "name": "Deadlift",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 185, "reps": 5}] * 3,
                    },
                    {
                        "name": "Bent Over Row",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 115, "reps": 8}] * 4,
                    },
                    {
                        "name": "Lat Pulldown",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 100, "reps": 10}] * 3,
                    },
                    {
                        "name": "Cable Row",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 90, "reps": 10}] * 3,
                    },
                    {
                        "name": "Face Pull",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 40, "reps": 15}] * 3,
                    },
                    {
                        "name": "Bicep Curl",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 55, "reps": 12}] * 3,
                    },
                ],
            },
            {
                "name": "Leg Day",
                "description": "Quads, hamstrings, and calves. Don't skip it.",
                "icon": "🦵",
                "exercises": [
                    {
                        "name": "Squat",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 155, "reps": 8}] * 4,
                    },
                    {
                        "name": "Romanian Deadlift",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 115, "reps": 10}] * 3,
                    },
                    {
                        "name": "Leg Press",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 180, "reps": 12}] * 3,
                    },
                    {
                        "name": "Lying Leg Curl",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 60, "reps": 12}] * 3,
                    },
                    {
                        "name": "Leg Extension",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 70, "reps": 15}] * 3,
                    },
                    {
                        "name": "Standing Calf Raise",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 100, "reps": 15}] * 4,
                    },
                ],
            },
        ],
    },
    {
        "name": "Upper / Lower Split",
        "routines": [
            {
                "name": "Upper A",
                "description": "Horizontal push + pull focus. Bench and rows are the priority.",
                "icon": "🔼",
                "exercises": [
                    {
                        "name": "Bench Press",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 135, "reps": 8}] * 4,
                    },
                    {
                        "name": "Bent Over Row",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 115, "reps": 8}] * 4,
                    },
                    {
                        "name": "Overhead Press",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 40, "reps": 10}] * 3,
                    },
                    {
                        "name": "Lat Pulldown",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 100, "reps": 10}] * 3,
                    },
                    {
                        "name": "Tricep Pushdown",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 50, "reps": 12}] * 3,
                    },
                    {
                        "name": "Bicep Curl",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 55, "reps": 12}] * 3,
                    },
                ],
            },
            {
                "name": "Lower A",
                "description": "Squat-focused lower body. Quad dominant with hamstring work.",
                "icon": "🔽",
                "exercises": [
                    {
                        "name": "Squat",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 155, "reps": 8}] * 4,
                    },
                    {
                        "name": "Romanian Deadlift",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 115, "reps": 10}] * 3,
                    },
                    {
                        "name": "Leg Press",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 180, "reps": 12}] * 3,
                    },
                    {
                        "name": "Lying Leg Curl",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 60, "reps": 12}] * 3,
                    },
                    {
                        "name": "Standing Calf Raise",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 100, "reps": 15}] * 4,
                    },
                ],
            },
            {
                "name": "Upper B",
                "description": "Vertical push + pull focus. Incline press and pulldowns lead.",
                "icon": "🔼",
                "exercises": [
                    {
                        "name": "Incline Bench Press",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 60, "reps": 10}] * 4,
                    },
                    {
                        "name": "Cable Row",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 90, "reps": 10}] * 4,
                    },
                    {
                        "name": "Lateral Raise",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 20, "reps": 15}] * 3,
                    },
                    {
                        "name": "Face Pull",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 40, "reps": 15}] * 3,
                    },
                    {
                        "name": "Skull Crusher",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 55, "reps": 12}] * 3,
                    },
                    {
                        "name": "Hammer Curl",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 30, "reps": 12}] * 3,
                    },
                ],
            },
            {
                "name": "Lower B",
                "description": "Deadlift-focused lower body. Hip hinge dominant.",
                "icon": "🔽",
                "exercises": [
                    {
                        "name": "Deadlift",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 185, "reps": 5}] * 4,
                    },
                    {
                        "name": "Leg Press",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 200, "reps": 10}] * 3,
                    },
                    {
                        "name": "Lying Leg Curl",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 65, "reps": 12}] * 3,
                    },
                    {
                        "name": "Leg Extension",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 75, "reps": 15}] * 3,
                    },
                    {
                        "name": "Standing Calf Raise",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 100, "reps": 15}] * 4,
                    },
                ],
            },
        ],
    },
    {
        "name": "Total Body",
        "routines": [
            {
                "name": "Total Body A",
                "description": "Full body in one session. Squat and press pattern focus.",
                "icon": "⚡",
                "exercises": [
                    {
                        "name": "Squat",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 135, "reps": 8}] * 3,
                    },
                    {
                        "name": "Bench Press",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 115, "reps": 8}] * 3,
                    },
                    {
                        "name": "Bent Over Row",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 95, "reps": 8}] * 3,
                    },
                    {
                        "name": "Overhead Press",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 35, "reps": 10}] * 3,
                    },
                    {
                        "name": "Romanian Deadlift",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 95, "reps": 10}] * 3,
                    },
                ],
            },
            {
                "name": "Total Body B",
                "description": "Full body in one session. Deadlift and pull pattern focus.",
                "icon": "⚡",
                "exercises": [
                    {
                        "name": "Deadlift",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 155, "reps": 5}] * 3,
                    },
                    {
                        "name": "Incline Bench Press",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 55, "reps": 10}] * 3,
                    },
                    {
                        "name": "Lat Pulldown",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 90, "reps": 10}] * 3,
                    },
                    {
                        "name": "Lateral Raise",
                        "equipment": "Dumbbell",
                        "sets": [{"type": "normal", "weight": 20, "reps": 15}] * 3,
                    },
                    {
                        "name": "Leg Press",
                        "equipment": "Machine",
                        "sets": [{"type": "normal", "weight": 160, "reps": 12}] * 3,
                    },
                ],
            },
            {
                "name": "Total Body C",
                "description": "Full body in one session. Accessory and volume focus.",
                "icon": "⚡",
                "exercises": [
                    {
                        "name": "Squat",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 135, "reps": 10}] * 3,
                    },
                    {
                        "name": "Bench Press",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 115, "reps": 10}] * 3,
                    },
                    {
                        "name": "Cable Row",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 80, "reps": 12}] * 3,
                    },
                    {
                        "name": "Bicep Curl",
                        "equipment": "Barbell",
                        "sets": [{"type": "normal", "weight": 50, "reps": 12}] * 3,
                    },
                    {
                        "name": "Tricep Pushdown",
                        "equipment": "Cable",
                        "sets": [{"type": "normal", "weight": 45, "reps": 12}] * 3,
                    },
                ],
            },
        ],
    },
]


def seed_templates(db):
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        print("  ⚠️  No admin found — skipping templates")
        return

    # Wipe existing admin folders/routines
    for folder in RoutineFolder.query.filter_by(user_id=admin.id).all():
        db.session.delete(folder)
    for routine in Routine.query.filter_by(user_id=admin.id).all():
        db.session.delete(routine)
    db.session.flush()

    total_routines = 0
    for folder_data in TEMPLATE_FOLDERS:
        folder = RoutineFolder(user_id=admin.id, name=folder_data["name"])
        db.session.add(folder)
        db.session.flush()

        for r_data in folder_data["routines"]:
            routine = Routine(
                user_id=admin.id,
                name=r_data["name"],
                description=r_data.get("description"),
                icon=r_data.get("icon"),
                folder_id=folder.id,
            )
            db.session.add(routine)
            db.session.flush()

            for idx, ex_data in enumerate(r_data["exercises"]):
                exercise = find_exercise(ex_data["name"], ex_data.get("equipment"))
                if not exercise:
                    print(
                        f"  ⚠️  Exercise not found: {ex_data['name']} ({ex_data.get('equipment')})"
                    )
                    continue

                re = RoutineExercise(
                    routine_id=routine.id,
                    exercise_id=exercise.id,
                    order_index=idx,
                    planned_sets=len(ex_data["sets"]),
                    rest_seconds=120,
                )
                db.session.add(re)
                db.session.flush()

                for set_num, s in enumerate(ex_data["sets"], start=1):
                    rs = RoutineSet(
                        routine_exercise_id=re.id,
                        set_number=set_num,
                        set_type=s.get("type", "normal"),
                        weight=s.get("weight"),
                        reps=s.get("reps"),
                    )
                    db.session.add(rs)

            total_routines += 1

    db.session.commit()
    print(
        f"  ✅ Seeded {total_routines} template routines across {len(TEMPLATE_FOLDERS)} folders"
    )
