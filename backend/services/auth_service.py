from utils.password import hash_password, verify_password
from models.user_model import get_user_by_email, create_user

def register_user(mongo, username, email, password):
    if get_user_by_email(mongo, email):
        return False

    user = {
        "username": username,
        "email": email,
        "password": hash_password(password)
    }

    create_user(mongo, user)
    return True

def login_user(mongo, email, password):
    user = get_user_by_email(mongo, email)

    if not user:
        return None

    if verify_password(password, user["password"]):
        return user["_id"]

    return None
