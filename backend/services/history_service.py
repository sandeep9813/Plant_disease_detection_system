from pathlib import Path

from storage.file_storage import JsonFileStorage


class HistoryService:
    def __init__(self, history_path: Path):
        self.storage = JsonFileStorage(history_path, [])

    def list_history(self):
        return self.storage.read()

    def add_history(self, item):
        history = self.storage.read()
        history.insert(0, item)
        self.storage.write(history)
        return item

    def clear_history(self):
        self.storage.write([])
        return {"cleared": True}

