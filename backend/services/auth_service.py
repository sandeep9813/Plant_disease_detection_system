from pathlib import Path

from models.user import User
from storage.file_storage import JsonFileStorage


class AuthService:
    def __init__(self, users_path: Path):
        self.storage = JsonFileStorage(users_path, [])

    def list_users(self):
        return self.storage.read()

    def save_user(self, user: User):
        users = self.storage.read()
        user_data = user.dict()
        if user_data.get("id") is None:
            user_data["id"] = len(users) + 1
        users.append(user_data)
        self.storage.write(users)
        return user_data
