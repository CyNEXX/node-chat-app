const Filter = require('bad-words')
const filter = new Filter()
const generateMessage = (displayname, text) => {
    return {
        displayname,
        text,
        createdAt: new Date().getTime(),
        isNameVisible: '',
        isTimeVisible: '',
        isProfane: filter.isProfane(text)
    }
}

const generateLocationMessage = (displayname, url) => {
    return {
        displayname,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}