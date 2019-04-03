let socket;
let world;
//var socketPath;

let myPlayer = {
    playerId: "232B7156C144AD65",
    sessionTicket: "232B7156C144AD65-0-0-5417-8D6953D9E0DCACE-VSf4syrAZSdwZpGdbxQauOev2dTzSYvp76zKNXm7eo8=",
    isNewPlayer: false,
}

let socketPath = 'https://pingu-matheuschimelli.c9users.io';


hamster_data.images = ['/media/critters/penguin.png'];

var cheerioPath = '/play/cheerio.html';

var artwork = {
    character: hamster_data,
    roomPath: '/media/rooms/'
}

if (myPlayer.sessionTicket) {
    socket = io(socketPath, {
        autoConnect: false,
        transports: ['websocket']
    });

    world = new World(socket, artwork, 'stage');

    world.login(myPlayer.sessionTicket);

    $('.chat-btn').click(sendMessage);

    socket.on('login', function(data) {
        if (data.error) {
            document.location.href = '/';
        }
        else {
            $('inputMessage').click(sendMessage);
            $(document).unbind('keypress');
            $(document).keypress(handleKeypress);
        }
    });

    socket.on('connect', function() {
        console.log('connected');
    });

    socket.on('disconnect', function() {
        console.log('disconnected');
        $('#modal').modal({
            backdrop: 'static'
        });
        $('#modal').modal('show');
        $('#modal .modal-body').text('Disconnect');
        $('#buttonLogin').click(function() {
            document.location.reload();
        });
    });

    socket.on('error', function(data) {
        console.log('error', data);
    });

}
else {
    document.location.href = '/';
}

// Fit stage to container
window.onresize = function() {
    var body = $('#stage').parent();
    $('#stage').width(body.width()).height(body.width() * .54);
}
window.onresize();


function handleKeypress(e) {
    if (e.which == 13) {
        sendMessage();
    }
}

function sendMessage() {
    var message = $('#inputMessage').val();
    if (message.length > 0) {
        world.sendMessage(message);
        $('#inputMessage').val('');
        $('#inputMessage').focus();
    }
    else {
        $('#inputMessage').focus();
    }
}
