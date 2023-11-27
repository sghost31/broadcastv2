from flask import Flask, request, jsonify, render_template
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import cross_origin
import pymysql.cursors
import datetime
import os
import random
import string

app = Flask(__name__, static_url_path='/static')
auth_namespace = '/auth'
stream_namespace = '/stream'
socketio = SocketIO(app, cors_allowed_origins="http://192.168.1.225:5123", async_mode='threading', namespace=stream_namespace)

socketio.init_app(app, cors_allowed_origins="http://192.168.1.225:5123", namespace=stream_namespace)
CORS(app, resources={r"/*": {"origins": "http://192.168.1.225:5123"}})
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Set the JWT secret key
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'sghost31')

# MySQL database connection
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='rtlab666',
    database='broadcasting',
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True  # Enable autocommit to automatically commit changes
)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'tomicokz@gmail.com'
app.config['MAIL_PASSWORD'] = 'dcazvpmklwunbjtm'
mail = Mail(app)

def generate_datetime_id():
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

###############
@socketio.on('message')
def handle_message(message):
    print('Received message:', message)

    if isinstance(message, dict):
        if message.get('type') == 'join_room':
            room_name = message['room']

            # Check if the room exists, and create it if not
            with connection.cursor() as cursor:
                check_room_query = 'SELECT * FROM room WHERE room_name = %s'
                cursor.execute(check_room_query, (room_name,))
                existing_room = cursor.fetchone()
<<<<<<< HEAD

                if not existing_room:
                    insert_room_query = 'INSERT INTO room (room_name) VALUES (%s)'
                    cursor.execute(insert_room_query, (room_name,))

                join_room(room_name)
                emit('message', {'type': 'chat', 'text': f'User {message["sender"]} has joined the room.'}, room=room_name)
        elif message.get('type') == 'start_stream':
            room_name = message['room']
            sender = message['sender']

            # Your logic for handling the 'start_stream' message
            print(f'Starting stream in room {room_name} initiated by {sender}')

            # You can add more logic here, for example, notifying other users in the room
            emit('message', {'type': 'stream_started', 'text': f'Stream started by {sender}'}, room=room_name)

@app.route('/index', methods=['POST'])
=======

                if not existing_room:
                    insert_room_query = 'INSERT INTO room (room_name) VALUES (%s)'
                    cursor.execute(insert_room_query, (room_name,))

                join_room(room_name)
                emit('message', {'type': 'chat', 'text': f'User {message["sender"]} has joined the room.'}, room=room_name)
        elif message.get('type') == 'start_stream':
            room_name = message['room']
            sender = message['sender']

            # Your logic for handling the 'start_stream' message
            print(f'Starting stream in room {room_name} initiated by {sender}')

            # You can add more logic here, for example, notifying other users in the room
            emit('message', {'type': 'stream_started', 'text': f'Stream started by {sender}'}, room=room_name)

@app.route('/signup', methods=['POST'])
>>>>>>> b218f96a3a9eb2ceae7f18fd88172dba233a5dc0
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def signup():
    try:
        data = request.get_json()
        print('Received data:', data)  # Add this line to check the received data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        phone = data.get('phone')

        # Basic server-side validation
        if not all([username, email, password, confirm_password, phone]):
            return jsonify({'error': 'Please fill in all fields.'}), 400

        if password != confirm_password:
            return jsonify({'error': 'Passwords do not match.'}), 400

        # Check if the email already exists
        with connection.cursor() as cursor:
            check_email_query = 'SELECT * FROM user WHERE email = %s'
            cursor.execute(check_email_query, (email,))
            existing_user = cursor.fetchone()

            if existing_user:
                return jsonify({'error': 'Email already exists'}), 400

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Insert a new user into the broadcasting table
        with connection.cursor() as cursor:
            datetime_id = generate_datetime_id()
            insert_user_query = 'INSERT INTO user (id, username, email, password, phone) VALUES (%s, %s, %s, %s, %s)'
            cursor.execute(insert_user_query, (datetime_id, username, email, hashed_password, phone))
            print('User inserted successfully:', username)

        # Commit the user insertion changes
        connection.commit()

        # Generate a random verification code
        verification_code = generate_verification_code()

        # Store the verification code in the database
        with connection.cursor() as cursor:
            insert_verification_code_query = 'INSERT INTO verification (email, code, created_at) VALUES (%s, %s, %s)'
            cursor.execute(insert_verification_code_query, (email, verification_code, datetime.datetime.now()))

        # Commit the verification code insertion changes
        connection.commit()

        # Send verification email
        msg = Message('Verification Code', sender='tomicokz@gmail.com', recipients=[email])
        msg.body = f'Your verification code is: {verification_code}'
        mail.send(msg)

        # Create a JWT token
        secret_key = os.getenv('JWT_SECRET', 'defaultSecretKey')
        token = create_access_token(identity={'username': username, 'id': datetime_id})
#####
        # Emit a message to all clients about the new user signup
        socketio.emit('message', {'type': 'signup', 'username': username}, namespace=stream_namespace)

#####
        # Respond with the token
        return jsonify({'token': token})

    except Exception as e:
        print(str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/verify', methods=['POST'])
@cross_origin()
def verify():
    try:
        data = request.get_json()
        verification_code = data.get('verificationCode')

        if not verification_code:
            return jsonify({'error': 'Please provide the verification code.'}), 400

        # Check if the verification code is valid
        with connection.cursor() as cursor:
            check_verification_code_query = 'SELECT * FROM verification WHERE code = %s'
            cursor.execute(check_verification_code_query, (verification_code,))
            matching_code = cursor.fetchone()

            if not matching_code:
                return jsonify({'error': 'Invalid verification code.'}), 401

        # Check if the verification code is submitted within 3 minutes
        created_at = matching_code['created_at']
        current_time = datetime.datetime.now()
        minutes_diff = (current_time - created_at).total_seconds() / 60

        if minutes_diff > 3:
            # Delete the user and verification code
            with connection.cursor() as cursor:
                delete_query = 'DELETE FROM user WHERE email = %s'
                cursor.execute(delete_query, (matching_code['email'],))

                # Delete the verification code
                delete_verification_code_query = 'DELETE FROM verification WHERE code = %s'
                cursor.execute(delete_verification_code_query, (verification_code,))

            return jsonify({'error': 'Verification code expired. Please sign up again.'}), 401

        # Delete the verification code after successful verification
        with connection.cursor() as cursor:
            delete_verification_code_query = 'DELETE FROM verification WHERE code = %s'
            cursor.execute(delete_verification_code_query, (verification_code,))

        return jsonify({'message': 'Verification successful'})

    except Exception as e:
        print(str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/login', methods=['POST'])
@cross_origin()
def login():
    try:
        print('Login request received!')
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Basic server-side validation
        if not email or not password:
            return jsonify({'error': 'Please provide email and password.'}), 400

        # Check if the email exists
        with connection.cursor() as cursor:
            check_email_query = 'SELECT * FROM user WHERE email = %s'
            cursor.execute(check_email_query, (email,))
            existing_user = cursor.fetchone()

            if not existing_user:
                return jsonify({'error': 'Invalid email or password.'}), 401

        # Check if the password is correct
        is_password_valid = bcrypt.check_password_hash(existing_user['password'], password)

        if not is_password_valid:
            return jsonify({'error': 'Invalid email or password.'}), 401

        # Create a JWT token
        secret_key = os.getenv('JWT_SECRET', 'defaultSecretKey')
        token = create_access_token(identity={'username': existing_user['username'], 'id': existing_user['id']})

        # Respond with the token
        return jsonify({'token': token})

    except Exception as e:
        print(str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

@socketio.on('join_lobby')
def handle_join_lobby():
    available_rooms = get_available_rooms()  # Implement a function to get available rooms
    socketio.emit('update_lobby', {'rooms': available_rooms}, namespace='/lobby')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/verification.html')
def verification():
    return render_template('verification.html')

@app.route('/login.html')
def render_login():
    return render_template('login.html')
###
@app.route('/lobby.html')
def render_index():
    return render_template('lobby.html')
###

def update_lobby():
    rooms = get_rooms()
    socketio.emit('update_lobby', {'rooms': rooms}, namespace='/lobby')


@app.route('/room.html')
def render_room():
    return render_template('room.html')

def get_available_rooms():
    try:
        with connection.cursor() as cursor:
            get_rooms_query = 'SELECT room_name FROM room'
            cursor.execute(get_rooms_query)
            rooms = cursor.fetchall()
            return [room['room_name'] for room in rooms]
    except Exception as e:
        print(str(e))
        return []


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5123, debug=True)
