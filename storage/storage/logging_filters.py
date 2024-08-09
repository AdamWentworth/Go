# storage/logging_filters.py

import logging

class AddTraceIDFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'trace_id'):
            record.trace_id = 'N/A'
        return True
