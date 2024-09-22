# db_utils.py

import sqlite3

class DatabaseConnection:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
        
    def get_cursor(self):
        return self.conn.cursor()
    
    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()
