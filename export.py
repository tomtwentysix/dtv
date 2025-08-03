from replit import db
import json

export_data = {key: db[key] for key in db.keys()}
with open("replit_db_export.json", "w") as f:
    json.dump(export_data, f, indent=2)

print("Export complete: replit_db_export.json")
