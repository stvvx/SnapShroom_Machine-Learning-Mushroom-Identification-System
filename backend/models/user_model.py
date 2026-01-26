from bson.objectid import ObjectId

def get_user_by_email(mongo, email):
    return mongo.db.users.find_one({"email": email})

def create_user(mongo, user_data):
    return mongo.db.users.insert_one(user_data)

def get_user_by_id(mongo, user_id):
    return mongo.db.users.find_one({"_id": ObjectId(user_id)})
