from models import Challenge


def seed_challenges(db):
    challenges = [
        {
            "name": "Sydney Sweeney Push-Up Challenge",
            "description": "Start with 1 push-up on Day 1 and add one each day for 100 days. End stronger, sharper, and sculpted like Sydney herself.",
            "days_required": 100,
            "category": "Bodyweight",
            "image_url": "https://preview.redd.it/why-do-some-people-call-sydney-sweeney-mid-does-she-not-fit-v0-06pnlmnuzjge1.jpg?width=640&crop=smart&auto=webp&s=0586ed0d8872dd319416327f2543e278c5f0282b",
        },
        {
            "name": "Cael Sanderson Pull-Up Challenge",
            "description": "For 30 days, complete 50 pull-ups every day. Break them into sets however you want — just hit all 50 before midnight.",
            "days_required": 30,
            "category": "Upper Body",
            "image_url": "https://d2779tscntxxsw.cloudfront.net/688b9a05218b2.png?width=1200&quality=80",
        },
        {
            "name": "Leonidas 300 Ab Challenge",
            "description": "Spartan abs only. For 30 days, perform a 300-rep core circuit: 100 crunches, 100 leg raises, 100 bicycle kicks. 'This. Is. Abs!'",
            "days_required": 30,
            "category": "Core",
            "image_url": "https://www.looper.com/img/gallery/gerard-butler-reveals-how-he-really-got-ripped-to-play-leonidas-in-300-exclusive/gerard-butlers-strict-workout-regimen-didnt-end-when-the-production-of-300-began-1631764116.jpg",
        },
    ]

    for c in challenges:
        db.session.add(Challenge(**c))
    db.session.commit()
    print("✅ Seeded: Sydney Sweeney, Cael Sanderson, and Leonidas 300 Ab Challenges!")
