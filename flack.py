from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_session import Session
import time
# I dont like tons of logs, add code to disable them
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

users=[]
channels = []
privateChannels = []
# The messages will be a dictionary
# Format
# Channel: <Channel_name>
# User   : <user_name>
# message: <actual_message>
# time   : <message_time>
messages = {}

@app.route("/", methods=['GET', 'POST'])
def index():
    if session.get('logged_in'):
        print("Username from session" + session.get('username'))
        return render_template('flack.html', username=session['username'])
    if(request.method == 'POST'):
        username=request.form['inputusername']
        print ("loggin in :" +username)
        if username in users:
            # This is error scenario, send it back
            error="Username taken, please enter another"
            return render_template ("flack.html", error=error)
        else:
            # Add new user and send back username
            users.append(username)
            session['username']=username
            session['logged_in']=True
            return render_template ("flack.html", username=username)
    return render_template ("flack.html")

@socketio.on("request-all-rooms")
def showrooms():
    # emit("connected", session['username'])
    emit("show-all-rooms", channels)

@socketio.on("create-channel")
def createChannel(channel):
    if channel in channels:
    # retund non- success
        emit("error", "Channel exists")
    else:
        channels.append(channel)
        messages[channel]=[]
        emit("message", "Channel '"+channel+"' created!", broadcast=True)
        emit("show-all-rooms", channels, broadcast=True)


@socketio.on("create-private-channel")
def createPrivateChannel(data):
    # message = {"username": session.get('username'), "msg" : data["msg"], "mtime": mtime}
    channel=data["to"]+"-"+data["from"]
    print("In create private channel " + channel)
    if channel in privateChannels:
    # retund non- success
        emit("error", "Channel exists")
    else:
        privateChannels.append(channel)
        messages[channel]=[]
        emit("add-private-room", data, broadcast=True)


# @socketio.on("join-self")
# def join_self(channel):
#     join_room(channel)
#     print("Joning Self " + channel)


@socketio.on("join-channel")
def join_channel(channel):
    #t = time.localtime()
    #current_time = time.strftime("%H:%M:%S", t)
    # TODO :: Only join if the channel existys in channels
    if channel in channels:
        join_room(channel)
        emit('join-accepted', channel)
    if channel in privateChannels:
        join_room(channel)
        emit('join-accepted', channel)


@socketio.on("send-all-messages")
def send_all_messages(channel):
    if channel in channels:
        for message in messages[channel]:
            emit("receive-message", message)


@socketio.on("leave-channel")
def leave_channel(channel):
    msgstr=session.get('username') + " has Left room"
    emit("broadcast-to-channels", msgstr, room=channel)
    leave_room(channel)
    print("Leave Channel Message string = " + msgstr)


@socketio.on("send-message")
def send_message(data):
    mtime = time.ctime(time.time())
    message = {"username": session.get('username'), "msg" : data["msg"], "mtime": mtime}
    messages[data["channel"]].append(message)
    print(data)
    # As per project requirements, store only 100 messages
    if len(messages[data["channel"]]) > 100:
        popped=messages[data["channel"]].pop(0)
        print("100 limit reached, popped :: " )
        print(popped)
    emit("receive-message", message, room=data["channel"])

@socketio.on("send-private-message")
def send_private_message(data):
    mtime = time.ctime(time.time())
    message = {"username": session.get('username'), "msg" : data["msg"], "mtime": mtime}
    emit("receive-private-message", message, room=data["channel"]) 

if __name__ == '__main__':
    socketio.run(app, debug=True)
