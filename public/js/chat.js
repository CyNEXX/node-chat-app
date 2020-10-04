/* const messages = require('../../src/utils/messages'); */

const socket = io()
let enableLanguageFilter = false;
const profaneText = 'Profane messages are not allowed'

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationSendButton = document.querySelector('#send-location');
const $leaveChatRoomButton = document.querySelector('#leave-chat');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const personalLocationTemplate = document.querySelector('#personal-location-template').innerHTML;
const systemTemplate = document.querySelector('#system-template').innerHTML;
const personalSystemTemplate = document.querySelector('#personal-system-template').innerHTML;
const personalBroadcast = document.querySelector('#personal-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {

    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageMarginTop = parseInt(newMessageStyles.marginTop)

    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin + newMessageMarginTop

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    // When height of messages container is less or equal to how far I have scrolled
    if (containerHeight - newMessageHeight <= Math.ceil(scrollOffset) + 1) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// There should be a better way
function doSomething(e) {
    e.checked? true : false
    enableLanguageFilter = e.checked
}

const displayMessage = (message, messageType) => {
    try {
        const messageSpace = {
            toSelf: personalBroadcast,
            fromOthers: messageTemplate
        }
        if (!(Object.keys(messageSpace).find((key) => {
            return key === messageType
        }))) {
            throw new Error('No such option')
        } else {
            if (enableLanguageFilter === true && message.isProfane === true) {

                switch (messageType) {
                    case 'toSelf': {
                        displayMessageFromSystem(message, { optionalText: profaneText, messageType: 'toSelf' })
                        break
                    }
                    case 'fromOthers': {
                        return;
                    }
                }
            } else {
                const html = Mustache.render(messageSpace[messageType],
                    {
                        displayname: message.displayname,
                        message: message.text,
                        createdAt: moment(message.createdAt).format('HH:mm:ss'),
                        isNameVisible: message.isNameVisible,
                        isTimeVisible: message.isTimeVisible
                    }
                );
                $messages.insertAdjacentHTML('beforeend', html);
            }
        }
    } catch (e) {
        console.log(e)
    }
}

const displayMessageFromSystem = (message, { optionalText, messageType }) => {
    const messageSpace = {
        toSelf: personalSystemTemplate,
        fromOthers: systemTemplate
    }
    if (!(Object.keys(messageSpace).find((key) => {
        return key === messageType
    }))) {
        throw new Error('No such option')
    } else {
        const html = Mustache.render(messageSpace[messageType], {
            displayname: 'Admin',
            message: optionalText || message.text,
            createdAt: moment(message.createdAt).format('HH:mm:ss')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    }


}

socket.on('message', ({ message }) => {
    displayMessage(message, 'fromOthers')
    autoscroll()
});

socket.on('personalBroadcastMessage', ({ message }) => {
    displayMessage(message, 'toSelf')
    autoscroll()
});

socket.on('locationMessage', ({ message }) => {
    const html = Mustache.render(locationTemplate, {
        displayname: message.displayname,
        url: message.url,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('personalLocationMessage', ({ message }) => {
    const html = Mustache.render(personalLocationTemplate, {
        displayname: message.displayname,
        url: message.url,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('system_message', ({ message }) => {
    displayMessageFromSystem(message, { messageType: 'fromOthers' });
    autoscroll()
})

socket.on('personal-system_message', ({ message }) => {
    displayMessageFromSystem(message, { messageType: 'toSelf' });
    autoscroll()
})


socket.on('roomdata', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    if (e.target.elements.personalTextArea.value == '') return;
    $messageFormButton.setAttribute('disabled', 'disabled');
    sendText(e.target.elements.personalTextArea.value);

})

function sendText(txt) {
    socket.emit('sendMessage', txt, (error) => {

        $messageFormButton.removeAttribute('disabled');
        if (error) {
            return console.log(error)
        }
    });

    clearInputAndFocusIt();
}

function clearInputAndFocusIt() {
    $messageFormInput.value = '';
    $messageFormInput.focus();
}

$locationSendButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $locationSendButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
            $locationSendButton.removeAttribute('disabled');
        })
    })
})

$leaveChatRoomButton.addEventListener('click', () => { location.href = '/' });

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})


