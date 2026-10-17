"""测试隔离：每个测试会话使用独立的临时 SQLite，避免污染开发库。"""
import os
import pathlib
import tempfile

_tmp = tempfile.mkdtemp(prefix="fm_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{pathlib.Path(_tmp) / 'test.db'.replace('/', os.sep)}"

from app.db import init_db  # noqa: E402

init_db()
