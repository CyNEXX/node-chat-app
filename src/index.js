const express = require('express')
const path = require('path')
const http = require('http')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const port = process.env.PORT || 3000
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
let lastMessageInfo = {
    id: 0
};
const timeDifferenceInMillis = 3 * 60 * 1000

// Define paths Express config

const publicDirectory = path.join(__dirname, '../public')
app.use(express.static(publicDirectory))



io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('personal-system_message', { message: generateMessage(user.displayname, `Welcome, ${user.displayname}!`) })

        socket.broadcast.to(user.room).emit('system_message', {
            message: generateMessage(user.displayname, `${user.displayname} has joined the chat.`)
        })

        io.to(user.room).emit('roomdata', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        try {
            message = generateMessage(user.displayname, msg)
            if (msg.isProfane) {
                return callback('Profanity is not allowed')
            }
        }
        catch (e) {
            console.log('Something went wrong')
            console.log(e)
            render('index')
        }

        if (lastMessageInfo.id === socket.id) {
            message.isNameVisible = (socket.id === lastMessageInfo.id) ? 'hidden' : ''
            message.isTimeVisible = (new Date().getTime() - lastMessageInfo.createdAt < timeDifferenceInMillis) ? 'hidden' : '';
        }
        socket.emit('personalBroadcastMessage', { message })
        socket.broadcast.to(user.room).emit('message', { message })
        lastMessageInfo = { id: socket.id, createdAt: message.createdAt };
        callback();
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        let message = generateLocationMessage(user.displayname, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`);

        socket.emit('personalLocationMessage', { message })

        socket.broadcast.to(user.room).emit('locationMessage', { message })

        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('system_message', { message: generateMessage(user.displayname, `${user.displayname} has left.`) })
            io.to(user.room).emit('roomdata', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

});

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

app.get(['', '/index'], (req, res) => {
    render('index')
})

function firstCapital(str) {
    var arrOfStr = str.split(' ')
    var finalStr = ''
    for (var i = 0; i < arrOfStr.length; i++) {
        finalStr += arrOfStr[i].charAt(0).toUpperCase() + arrOfStr[i].slice(1).toLowerCase() + ' '
    }
    return finalStr.trim()
}