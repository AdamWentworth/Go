// sanitizeLogging.js

// Utility function to sanitize sensitive fields from an object
function sanitizeForLogging(obj, fieldsToExclude = []) {
    const sanitized = { ...obj };
    fieldsToExclude.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            sanitized[field] = '***REDACTED***';
        }
    });
    return sanitized;
}

module.exports = sanitizeForLogging;
