"""Short-lived database handles: commit/rollback and close on context exit.

sqlite3.Connection's normal context manager ends a transaction but leaves the
connection open. Request handlers must not leave those handles to cyclic GC.
"""

import contextlib
import sqlite3
import threading


_database_access = threading.RLock()


@contextlib.contextmanager
def connect(path, timeout=10, row_factory=None):
    # Keep the short local transaction, including open/close, together. The
    # deployed macOS SQLite library stalled during concurrent open/close in a
    # reproducible ten-thread read test. Model calls run outside this lock.
    with _database_access:
        db = sqlite3.connect(path, timeout=timeout)
        if row_factory is not None:
            db.row_factory = row_factory
        try:
            with db:
                yield db
        finally:
            db.close()
