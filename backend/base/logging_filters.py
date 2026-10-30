import logging
import re

class RedactOAuthQuery(logging.Filter):
    def filter(self, record):
        def redact(value):
            if isinstance(value, str):
                return re.sub(r"(/api/auth/google/callback/)\?[^\s]+", r"\1?[redacted]", value)
            return value
        record.msg = redact(record.msg)
        if isinstance(record.args, tuple): record.args = tuple(redact(value) for value in record.args)
        elif isinstance(record.args, dict): record.args = {key: redact(value) for key, value in record.args.items()}
        return True
