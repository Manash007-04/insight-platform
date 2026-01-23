
from app import create_app
from models.database import find_many

app, _ = create_app()

with app.app_context():
    submissions = find_many('classroom_submissions', {'attachments': {'$exists': True, '$ne': []}})
    print(f"Found {len(submissions)} submissions with attachments")
    for sub in submissions:
        print(f"Submission ID: {sub['_id']}")
        print(f"Attachments: {sub['attachments']}")
