import json
from pathlib import Path
from typing import Any


class JsonFileStorage:
    def __init__(self, path: Path, default_data: Any):
        self.path = path
        self.default_data = default_data
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def read(self):
        if not self.path.exists():
            self.write(self.default_data)
            return self.default_data

        with open(self.path, "r", encoding="utf-8") as file:
            return json.load(file)

    def write(self, data):
        with open(self.path, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)


class UploadStorage:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, upload_file):
        destination = self.upload_dir / upload_file.filename
        contents = await upload_file.read()
        with open(destination, "wb") as file:
            file.write(contents)
        return destination

