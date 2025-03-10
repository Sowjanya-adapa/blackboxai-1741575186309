from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
import random
from datetime import datetime, timedelta
import time
import threading

# Configure Flask app
app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Simulated database of donors and blood supplies
donors_db = {
    'A+': ['John Doe', 'Jane Smith', 'Mike Wilson'],
    'B+': ['Sarah Johnson', 'David Brown', 'Emma Davis'],
    'O-': ['Chris Lee', 'Lisa Anderson', 'Tom White'],
    'AB+': ['Mark Taylor', 'Anna Martinez', 'James Wilson']
}

blood_supply = {
    'A+': {'units': 100, 'trend': 'stable'},
    'B+': {'units': 50, 'trend': 'decreasing'},
    'O-': {'units': 30, 'trend': 'critical'},
    'AB+': {'units': 80, 'trend': 'increasing'}
}

# Configure static folder
app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)

@socketio.on('search_donors')
def handle_donor_search(data):
    blood_type = data.get('bloodType')
    location = data.get('location')
    
    if blood_type in donors_db:
        # Simulate real-time donor search with distances
        available_donors = [
            {'name': donor, 'distance': round(random.uniform(0.5, 10.0), 1)}
            for donor in donors_db[blood_type]
        ]
        emit('donor_results', {'donors': available_donors})

@socketio.on('check_supply')
def handle_supply_check():
    emit('supply_update', blood_supply)

def update_supply_periodically():
    while True:
        # Simulate real-time changes in blood supply
        for blood_type in blood_supply:
            change = random.randint(-5, 5)
            blood_supply[blood_type]['units'] += change
            if blood_supply[blood_type]['units'] < 40:
                blood_supply[blood_type]['trend'] = 'critical'
            elif blood_supply[blood_type]['units'] < 60:
                blood_supply[blood_type]['trend'] = 'decreasing'
            elif blood_supply[blood_type]['units'] > 90:
                blood_supply[blood_type]['trend'] = 'stable'
            else:
                blood_supply[blood_type]['trend'] = 'increasing'
        
        socketio.emit('supply_update', blood_supply)
        time.sleep(5)  # Update every 5 seconds

@socketio.on('schedule_appointment')
def handle_scheduling(data):
    # Simulate appointment scheduling
    appointment_id = ''.join(random.choices('0123456789ABCDEF', k=8))
    response = {
        'success': True,
        'appointment_id': appointment_id,
        'date': data.get('date'),
        'time': data.get('time'),
        'location': data.get('location')
    }
    emit('appointment_confirmed', response)

if __name__ == '__main__':
    # Start the supply update thread
    supply_thread = threading.Thread(target=update_supply_periodically)
    supply_thread.daemon = True
    supply_thread.start()
    
    socketio.run(app, debug=True, port=5000)
