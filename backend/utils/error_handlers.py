"""
AMEP Error Handlers
Centralized error handling for Flask application

Location: backend/utils/error_handlers.py
"""

from flask import jsonify
from werkzeug.exceptions import HTTPException
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# ERROR HANDLER REGISTRATION
# ============================================================================

def register_error_handlers(app):
    """
    Register all error handlers with Flask app

    Args:
        app: Flask application instance
    """

    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request errors"""
        logger.warning(f"Bad Request: {error}")
        return jsonify({
            'success': False,
            'error': 'Bad Request',
            'message': str(error) if hasattr(error, 'description') else 'Invalid request format',
            'status_code': 400
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 Unauthorized errors"""
        logger.warning(f"Unauthorized access attempt: {error}")
        return jsonify({
            'success': False,
            'error': 'Unauthorized',
            'message': 'Authentication required. Please provide valid credentials.',
            'status_code': 401
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 Forbidden errors"""
        logger.warning(f"Forbidden access attempt: {error}")
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource.',
            'status_code': 403
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors"""
        logger.info(f"Resource not found: {error}")
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': 'The requested resource could not be found.',
            'status_code': 404
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 Method Not Allowed errors"""
        logger.warning(f"Method not allowed: {error}")
        return jsonify({
            'success': False,
            'error': 'Method Not Allowed',
            'message': 'The HTTP method is not allowed for this endpoint.',
            'status_code': 405
        }), 405

    @app.errorhandler(409)
    def conflict(error):
        """Handle 409 Conflict errors"""
        logger.warning(f"Conflict: {error}")
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': str(error) if hasattr(error, 'description') else 'Resource conflict occurred',
            'status_code': 409
        }), 409

    @app.errorhandler(422)
    def unprocessable_entity(error):
        """Handle 422 Unprocessable Entity errors"""
        logger.warning(f"Unprocessable entity: {error}")
        return jsonify({
            'success': False,
            'error': 'Unprocessable Entity',
            'message': 'The request was well-formed but contains semantic errors.',
            'status_code': 422
        }), 422

    @app.errorhandler(429)
    def too_many_requests(error):
        """Handle 429 Too Many Requests errors"""
        logger.warning(f"Rate limit exceeded: {error}")
        return jsonify({
            'success': False,
            'error': 'Too Many Requests',
            'message': 'Rate limit exceeded. Please try again later.',
            'status_code': 429
        }), 429

    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle 500 Internal Server Error"""
        logger.error(f"Internal server error: {error}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please try again later.',
            'status_code': 500
        }), 500

    @app.errorhandler(502)
    def bad_gateway(error):
        """Handle 502 Bad Gateway errors"""
        logger.error(f"Bad gateway: {error}")
        return jsonify({
            'success': False,
            'error': 'Bad Gateway',
            'message': 'Invalid response from upstream server.',
            'status_code': 502
        }), 502

    @app.errorhandler(503)
    def service_unavailable(error):
        """Handle 503 Service Unavailable errors"""
        logger.error(f"Service unavailable: {error}")
        return jsonify({
            'success': False,
            'error': 'Service Unavailable',
            'message': 'Service temporarily unavailable. Please try again later.',
            'status_code': 503
        }), 503

    @app.errorhandler(504)
    def gateway_timeout(error):
        """Handle 504 Gateway Timeout errors"""
        logger.error(f"Gateway timeout: {error}")
        return jsonify({
            'success': False,
            'error': 'Gateway Timeout',
            'message': 'Request timeout. Please try again.',
            'status_code': 504
        }), 504

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle all other HTTP exceptions"""
        logger.warning(f"HTTP Exception: {error.code} - {error.description}")
        return jsonify({
            'success': False,
            'error': error.name,
            'message': error.description,
            'status_code': error.code
        }), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle all unexpected errors"""
        logger.error(f"Unexpected error: {error}", exc_info=True)

        # Don't expose internal errors in production
        if app.config.get('ENV') == 'production':
            message = 'An unexpected error occurred. Please try again later.'
        else:
            message = str(error)

        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': message,
            'status_code': 500
        }), 500


# ============================================================================
# CUSTOM EXCEPTION CLASSES
# ============================================================================

class AMEPException(Exception):
    """Base exception for AMEP application"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['success'] = False
        rv['error'] = self.__class__.__name__
        rv['message'] = self.message
        rv['status_code'] = self.status_code
        return rv


class ValidationError(AMEPException):
    """Validation error exception"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=400, payload=payload)


class AuthenticationError(AMEPException):
    """Authentication error exception"""
    def __init__(self, message='Authentication required', payload=None):
        super().__init__(message, status_code=401, payload=payload)


class AuthorizationError(AMEPException):
    """Authorization error exception"""
    def __init__(self, message='Insufficient permissions', payload=None):
        super().__init__(message, status_code=403, payload=payload)


class ResourceNotFoundError(AMEPException):
    """Resource not found exception"""
    def __init__(self, message='Resource not found', payload=None):
        super().__init__(message, status_code=404, payload=payload)


class ResourceConflictError(AMEPException):
    """Resource conflict exception"""
    def __init__(self, message='Resource conflict', payload=None):
        super().__init__(message, status_code=409, payload=payload)


class DatabaseError(AMEPException):
    """Database error exception"""
    def __init__(self, message='Database operation failed', payload=None):
        super().__init__(message, status_code=500, payload=payload)


class ExternalServiceError(AMEPException):
    """External service error exception"""
    def __init__(self, message='External service error', payload=None):
        super().__init__(message, status_code=502, payload=payload)


def register_custom_error_handlers(app):
    """
    Register custom AMEP exception handlers

    Args:
        app: Flask application instance
    """

    @app.errorhandler(AMEPException)
    def handle_amep_exception(error):
        """Handle AMEP custom exceptions"""
        logger.warning(f"AMEP Exception: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle validation errors"""
        logger.warning(f"Validation error: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(AuthenticationError)
    def handle_authentication_error(error):
        """Handle authentication errors"""
        logger.warning(f"Authentication error: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(error):
        """Handle authorization errors"""
        logger.warning(f"Authorization error: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(ResourceNotFoundError)
    def handle_not_found_error(error):
        """Handle not found errors"""
        logger.info(f"Resource not found: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(DatabaseError)
    def handle_database_error(error):
        """Handle database errors"""
        logger.error(f"Database error: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response


# ============================================================================
# EXPORT
# ============================================================================

__all__ = [
    'register_error_handlers',
    'register_custom_error_handlers',
    'AMEPException',
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'ResourceNotFoundError',
    'ResourceConflictError',
    'DatabaseError',
    'ExternalServiceError'
]
