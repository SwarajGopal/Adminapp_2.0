from flask import Flask, render_template, redirect, url_for, request, Response
import cv2
import pickle
import numpy as np
import struct
import socket
import time
from threading import Thread

app = Flask(__name__)
server_socket = None

PORT = 63333


def get_host_ip():
    # Create a temporary socket to get the local IP address
    temp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        temp_socket.connect(('8.8.8.8', 80))  # Connect to a public IP address
        host_ip = temp_socket.getsockname()[0]  # Get the local IP address
    finally:
        temp_socket.close()
    return host_ip


HOST = get_host_ip()


def receive_frames():
    global server_socket

    if server_socket is None:
        while True:
            try:
                server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                server_socket.bind((HOST, PORT))
                server_socket.listen(10)
                print('Socket now listening')
                break  # Break out of the loop if server socket is successfully created and listening
            except OSError:
                print('Failed to create server socket. Retrying in 5 seconds...')
                time.sleep(5)

    conn, addr = server_socket.accept()
    print('Client connected:', addr)

    try:
        data = b""
        payload_size = struct.calcsize(">L")
        print("payload_size: {}".format(payload_size))
        while True:
            while len(data) < payload_size:
                print("Recv: {}".format(len(data)))
                data += conn.recv(4096)

            print("Done Recv: {}".format(len(data)))
            packed_msg_size = data[:payload_size]
            data = data[payload_size:]
            msg_size = struct.unpack(">L", packed_msg_size)[0]
            print("msg_size: {}".format(msg_size))
            while len(data) < msg_size:
                data += conn.recv(4096)
            frame_data = data[:msg_size]
            data = data[msg_size:]

            frame = pickle.loads(frame_data, fix_imports=True, encoding="bytes")
            frame = cv2.imdecode(frame, cv2.IMREAD_COLOR)

            # Process the frame (if needed)

            # Convert the frame to JPEG image
            ret, jpeg = cv2.imencode('.jpg', frame)
            frame_data = jpeg.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
    except (ConnectionResetError, ConnectionAbortedError):
        print('Connection forcibly closed by the remote host. Restarting server...')
        conn.close()
        server_socket.close()
        server_socket = None
        yield from receive_frames()  # Restart the server
    finally:
        conn.close()


def start_receive_frames_thread():
    thread = Thread(target=receive_frames)
    thread.daemon = True
    thread.start()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    return Response(receive_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/adminlogin')
def adminlogin():
    return render_template('adminlogin.html')


@app.route('/adminsignup')
def adminsignup():
    return render_template('adminsignup.html')


@app.route('/admindashboard')
def admindashboard():
    clients = [
        {'id': 1, 'name': 'PC 1'},
        {'id': 2, 'name': 'PC 2'}, 
        {'id': 3, 'name': 'PC 3'},
         {'id': 4, 'name': 'PC 4'}
    ]  # Replace with your actual list of client objects

    return render_template('admindashboard.html', host=HOST, port=PORT, clients=clients)


if __name__ == '__main__':
    start_receive_frames_thread()  # Start the receive_frames() function in a separate thread
    app.run(debug=True, port=5001)
