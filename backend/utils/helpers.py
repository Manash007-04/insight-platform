"""
AMEP Utility Helper Functions
Common utility functions used across the application

Location: backend/utils/helpers.py
"""

from flask import jsonify
from datetime import datetime, timedelta
from bson import ObjectId
import re
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_email(email):
    """
    Validate email format

    Args:
        email (str): Email address to validate

    Returns:
        bool: True if valid email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Validate password strength

    Requirements:
    - At least 6 characters
    - Contains at least one letter
    - Contains at least one number (optional for basic validation)

    Args:
        password (str): Password to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters"

    if not re.search(r'[a-zA-Z]', password):
        return False, "Password must contain at least one letter"

    return True, None


def validate_object_id(object_id):
    """
    Validate MongoDB ObjectId format

    Args:
        object_id (str): ID to validate

    Returns:
        bool: True if valid ObjectId format
    """
    if not object_id:
        return False

    try:
        ObjectId(object_id)
        return True
    except:
        return False


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in request data

    Args:
        data (dict): Request data
        required_fields (list): List of required field names

    Returns:
        tuple: (is_valid, missing_fields)
    """
    if not data:
        return False, required_fields

    missing = [field for field in required_fields if field not in data or data[field] is None]
    return len(missing) == 0, missing


# ============================================================================
# RESPONSE HELPERS
# ============================================================================

def success_response(message=None, data=None, status_code=200):
    """
    Create standardized success response

    Args:
        message (str): Success message
        data (dict): Response data
        status_code (int): HTTP status code

    Returns:
        tuple: (response, status_code)
    """
    response = {}

    if message:
        response['message'] = message

    if data:
        response['data'] = data

    response['success'] = True
    response['timestamp'] = datetime.utcnow().isoformat()

    return jsonify(response), status_code


def error_response(error=None, detail=None, status_code=400):
    """
    Create standardized error response

    Args:
        error (str): Error message
        detail (str): Detailed error information
        status_code (int): HTTP status code

    Returns:
        tuple: (response, status_code)
    """
    response = {
        'success': False,
        'timestamp': datetime.utcnow().isoformat()
    }

    if error:
        response['error'] = error

    if detail:
        response['detail'] = detail

    return jsonify(response), status_code


# ============================================================================
# DATE/TIME HELPERS
# ============================================================================

def get_date_range(days_ago=7):
    """
    Get date range from X days ago to now

    Args:
        days_ago (int): Number of days in the past

    Returns:
        tuple: (start_date, end_date)
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_ago)
    return start_date, end_date


def format_datetime(dt):
    """
    Format datetime to ISO 8601 string

    Args:
        dt (datetime): Datetime object

    Returns:
        str: ISO formatted datetime string
    """
    if not dt:
        return None

    if isinstance(dt, str):
        return dt

    return dt.isoformat()


def parse_datetime(dt_string):
    """
    Parse ISO 8601 datetime string

    Args:
        dt_string (str): ISO formatted datetime string

    Returns:
        datetime: Parsed datetime object
    """
    if not dt_string:
        return None

    if isinstance(dt_string, datetime):
        return dt_string

    try:
        return datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
    except:
        return None


def get_week_number():
    """Get current ISO week number"""
    return datetime.utcnow().isocalendar()[1]


def get_academic_year():
    """
    Get current academic year (e.g., "2024-2025")
    Academic year starts in September
    """
    now = datetime.utcnow()
    if now.month >= 9:
        return f"{now.year}-{now.year + 1}"
    else:
        return f"{now.year - 1}-{now.year}"


# ============================================================================
# DATA TRANSFORMATION HELPERS
# ============================================================================

def sanitize_mongo_doc(doc):
    """
    Sanitize MongoDB document for JSON response
    Converts ObjectId to string, formats dates

    Args:
        doc (dict): MongoDB document

    Returns:
        dict: Sanitized document
    """
    if not doc:
        return None

    # Make a copy to avoid modifying original
    sanitized = {}

    for key, value in doc.items():
        if isinstance(value, ObjectId):
            sanitized[key] = str(value)
        elif isinstance(value, datetime):
            sanitized[key] = value.isoformat()
        elif isinstance(value, dict):
            sanitized[key] = sanitize_mongo_doc(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_mongo_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value

    return sanitized


def sanitize_mongo_docs(docs):
    """
    Sanitize list of MongoDB documents

    Args:
        docs (list): List of MongoDB documents

    Returns:
        list: List of sanitized documents
    """
    return [sanitize_mongo_doc(doc) for doc in docs]


def calculate_percentage(numerator, denominator, decimal_places=1):
    """
    Calculate percentage with safe division

    Args:
        numerator (float): Numerator
        denominator (float): Denominator
        decimal_places (int): Number of decimal places

    Returns:
        float: Percentage (0.0 to 100.0)
    """
    if not denominator or denominator == 0:
        return 0.0

    percentage = (numerator / denominator) * 100
    return round(percentage, decimal_places)


def calculate_average(values):
    """
    Calculate average of list of numbers

    Args:
        values (list): List of numbers

    Returns:
        float: Average value or 0 if list is empty
    """
    if not values or len(values) == 0:
        return 0.0

    return sum(values) / len(values)


def clamp(value, min_value, max_value):
    """
    Clamp value between min and max

    Args:
        value (float): Value to clamp
        min_value (float): Minimum value
        max_value (float): Maximum value

    Returns:
        float: Clamped value
    """
    return max(min_value, min(value, max_value))


# ============================================================================
# SCORING HELPERS
# ============================================================================

def normalize_score(score, min_val=0, max_val=100):
    """
    Normalize score to 0-100 range

    Args:
        score (float): Raw score
        min_val (float): Minimum possible value
        max_val (float): Maximum possible value

    Returns:
        float: Normalized score (0-100)
    """
    if max_val == min_val:
        return 0.0

    normalized = ((score - min_val) / (max_val - min_val)) * 100
    return clamp(normalized, 0.0, 100.0)


def categorize_mastery_level(mastery_score):
    """
    Categorize mastery score into level

    Args:
        mastery_score (float): Mastery score (0-100)

    Returns:
        str: Mastery level (NOT_STARTED, DEVELOPING, APPROACHING, PROFICIENT, MASTERED)
    """
    if mastery_score < 20:
        return "NOT_STARTED"
    elif mastery_score < 50:
        return "DEVELOPING"
    elif mastery_score < 70:
        return "APPROACHING"
    elif mastery_score < 90:
        return "PROFICIENT"
    else:
        return "MASTERED"


def categorize_engagement_level(engagement_score):
    """
    Categorize engagement score into level

    Args:
        engagement_score (float): Engagement score (0-100)

    Returns:
        str: Engagement level (CRITICAL, AT_RISK, MONITOR, PASSIVE, ENGAGED)
    """
    if engagement_score < 30:
        return "CRITICAL"
    elif engagement_score < 50:
        return "AT_RISK"
    elif engagement_score < 60:
        return "MONITOR"
    elif engagement_score < 75:
        return "PASSIVE"
    else:
        return "ENGAGED"


# ============================================================================
# LOGGING HELPERS
# ============================================================================

def log_api_request(endpoint, method, user_id=None):
    """Log API request for monitoring"""
    logger.info(f"API Request: {method} {endpoint} | User: {user_id or 'anonymous'}")


def log_error(error, context=None):
    """Log error with context"""
    if context:
        logger.error(f"Error: {error} | Context: {context}")
    else:
        logger.error(f"Error: {error}")


def log_warning(message, context=None):
    """Log warning with context"""
    if context:
        logger.warning(f"Warning: {message} | Context: {context}")
    else:
        logger.warning(f"Warning: {message}")


# ============================================================================
# PAGINATION HELPERS
# ============================================================================

def paginate(items, page=1, per_page=20):
    """
    Paginate list of items

    Args:
        items (list): List to paginate
        page (int): Page number (1-indexed)
        per_page (int): Items per page

    Returns:
        dict: Paginated result with metadata
    """
    total_items = len(items)
    total_pages = (total_items + per_page - 1) // per_page  # Ceiling division

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return {
        'items': items[start_idx:end_idx],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_items': total_items,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    }


# ============================================================================
# STRING HELPERS
# ============================================================================

def slugify(text):
    """
    Convert text to slug format

    Args:
        text (str): Text to slugify

    Returns:
        str: Slugified text
    """
    # Convert to lowercase
    text = text.lower()

    # Replace spaces and underscores with hyphens
    text = re.sub(r'[\s_]+', '-', text)

    # Remove special characters
    text = re.sub(r'[^\w\-]', '', text)

    # Remove multiple consecutive hyphens
    text = re.sub(r'\-+', '-', text)

    # Strip hyphens from start and end
    text = text.strip('-')

    return text


def truncate_text(text, max_length=100, suffix='...'):
    """
    Truncate text to maximum length

    Args:
        text (str): Text to truncate
        max_length (int): Maximum length
        suffix (str): Suffix to add if truncated

    Returns:
        str: Truncated text
    """
    if not text or len(text) <= max_length:
        return text

    return text[:max_length - len(suffix)] + suffix


# ============================================================================
# EXPORT
# ============================================================================

__all__ = [
    # Validation
    'validate_email',
    'validate_password',
    'validate_object_id',
    'validate_required_fields',

    # Response
    'success_response',
    'error_response',

    # Date/Time
    'get_date_range',
    'format_datetime',
    'parse_datetime',
    'get_week_number',
    'get_academic_year',

    # Data Transformation
    'sanitize_mongo_doc',
    'sanitize_mongo_docs',
    'calculate_percentage',
    'calculate_average',
    'clamp',

    # Scoring
    'normalize_score',
    'categorize_mastery_level',
    'categorize_engagement_level',

    # Logging
    'log_api_request',
    'log_error',
    'log_warning',

    # Pagination
    'paginate',

    # String
    'slugify',
    'truncate_text'
]
