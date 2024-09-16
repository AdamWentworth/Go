# storage/logging_filters.py

import logging

class AddTraceIDFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'trace_id'):
            record.trace_id = 'N/A'
        return True

class SQLFilter(logging.Filter):
    """
    Filter to exclude SQL commands from logs.
    """
    def filter(self, record):
        sql_keywords = ['SELECT', 'UPDATE', 'DELETE', 'INSERT', 'BEGIN', 'COMMIT']
        if any(keyword in record.getMessage() for keyword in sql_keywords):
            return False
        return True