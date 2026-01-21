"""
AMEP Authentication Routes
Handles user login, registration, and JWT token management

Location: backend/api/auth_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import bcrypt
import jwt
import os
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    USERS,
    STUDENTS,
    TEACHERS,
    find_one,
    insert_one,
    update_one
)

auth_bp = Blueprint('auth', __name__)

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 24))

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user (student or teacher)

    Request body:
    {
        "email": "user@example.com",
        "username": "username",
        "password": "password123",
        "role": "student|teacher",
        "first_name": "John",
        "last_name": "Doe",
        "grade_level": 8  # for students only
    }
    """
    try:
        data = request.json

        # Validate required fields
        required = ['email', 'username', 'password', 'role', 'first_name', 'last_name']
        missing = [field for field in required if field not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        # Validate role
        if data['role'] not in ['student', 'teacher', 'admin']:
            return jsonify({'error': 'Invalid role. Must be student, teacher, or admin'}), 400

        # Check if user already exists
        existing_email = find_one(USERS, {'email': data['email']})
        if existing_email:
            return jsonify({'error': 'Email already registered'}), 409

        existing_username = find_one(USERS, {'username': data['username']})
        if existing_username:
            return jsonify({'error': 'Username already taken'}), 409

        # Hash password
        password_hash = bcrypt.hashpw(
            data['password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        # Create user document
        user_id = str(ObjectId())
        user_doc = {
            '_id': user_id,
            'email': data['email'],
            'username': data['username'],
            'password_hash': password_hash,
            'role': data['role'],
            'created_at': datetime.utcnow()
        }

        insert_one(USERS, user_doc)

        # Create role-specific profile
        if data['role'] == 'student':
            student_doc = {
                '_id': user_id,
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'grade_level': data.get('grade_level', 8),
                'section': data.get('section', 'Section-A'),
                'enrollment_date': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            insert_one(STUDENTS, student_doc)

        elif data['role'] == 'teacher':
            teacher_doc = {
                '_id': user_id,
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'subject_area': data.get('subject_area', 'General'),
                'department': data.get('department', 'Education'),
                'created_at': datetime.utcnow()
            }
            insert_one(TEACHERS, teacher_doc)

        # Generate JWT token
        token = generate_jwt_token(user_id, data['role'])

        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': {
                'user_id': user_id,
                'email': data['email'],
                'username': data['username'],
                'role': data['role']
            }
        }), 201

    except Exception as e:
        return jsonify({
            'error': 'Registration failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and return JWT token

    Request body:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400

        # Find user by email
        user = find_one(USERS, {'email': data['email']})
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        # Verify password
        password_valid = bcrypt.checkpw(
            data['password'].encode('utf-8'),
            user['password_hash'].encode('utf-8')
        )

        if not password_valid:
            return jsonify({'error': 'Invalid email or password'}), 401

        # Update last login
        update_one(
            USERS,
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )

        # Generate JWT token
        token = generate_jwt_token(user['_id'], user['role'])

        # Get user profile
        profile = None
        if user['role'] == 'student':
            profile = find_one(STUDENTS, {'user_id': user['_id']})
        elif user['role'] == 'teacher':
            profile = find_one(TEACHERS, {'user_id': user['_id']})

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'user_id': user['_id'],
                'email': user['email'],
                'username': user['username'],
                'role': user['role'],
                'profile': {
                    'first_name': profile.get('first_name') if profile else None,
                    'last_name': profile.get('last_name') if profile else None
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Login failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """
    Verify JWT token validity

    Headers:
        Authorization: Bearer <token>
    """
    try:
        token = extract_token_from_header()
        if not token:
            return jsonify({'error': 'No token provided'}), 401

        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Check if user still exists
        user = find_one(USERS, {'_id': payload['user_id']})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'valid': True,
            'user': {
                'user_id': payload['user_id'],
                'role': payload['role']
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Token verification failed',
            'detail': str(e)
        }), 500


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """
    Change user password

    Request body:
    {
        "old_password": "current_password",
        "new_password": "new_password"
    }

    Headers:
        Authorization: Bearer <token>
    """
    try:
        token = extract_token_from_header()
        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401

        data = request.json
        if not data or 'old_password' not in data or 'new_password' not in data:
            return jsonify({'error': 'Old password and new password required'}), 400

        # Validate new password length
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400

        # Get user
        user = find_one(USERS, {'_id': payload['user_id']})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify old password
        password_valid = bcrypt.checkpw(
            data['old_password'].encode('utf-8'),
            user['password_hash'].encode('utf-8')
        )

        if not password_valid:
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Hash new password
        new_password_hash = bcrypt.hashpw(
            data['new_password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        # Update password
        update_one(
            USERS,
            {'_id': payload['user_id']},
            {'$set': {'password_hash': new_password_hash, 'password_changed_at': datetime.utcnow()}}
        )

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        return jsonify({
            'error': 'Password change failed',
            'detail': str(e)
        }), 500


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_jwt_token(user_id, role):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt_token(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def extract_token_from_header():
    """Extract JWT token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None

    return parts[1]


def require_auth(required_role=None):
    """
    Decorator to protect routes with authentication

    Usage:
        @auth_bp.route('/protected')
        @require_auth()
        def protected_route():
            ...

        @auth_bp.route('/admin-only')
        @require_auth(required_role='admin')
        def admin_route():
            ...
    """
    def decorator(f):
        from functools import wraps

        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = extract_token_from_header()
            if not token:
                return jsonify({'error': 'Authentication required'}), 401

            payload = decode_jwt_token(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            # Check role if required
            if required_role and payload.get('role') != required_role:
                return jsonify({'error': 'Insufficient permissions'}), 403

            # Add user info to request context
            request.user_id = payload['user_id']
            request.user_role = payload['role']

            return f(*args, **kwargs)

        return decorated_function
    return decorator
