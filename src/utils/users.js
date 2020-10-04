const users = [];

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room }) => {
    // Polish the data
    displayname = username.trim();
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    // check data
    if (!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }
    // check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })
    // check User name
    if (existingUser) {
        return {
            error: 'Username is already in use'
        }
    }

    //save user
    const user = { id, username, room, displayname }
    users.push(user)

    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index >= 0) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room.trim().toLowerCase())
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}