var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    path = require('path');

app.listen(process.env.PORT);

function handler(req, res) {

    console.log('request starting...');

    var filePath = __dirname + req.url;
    if (req.url == '/') filePath = __dirname + '/index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
    case '.js':
        contentType = 'text/javascript';
        break;
    case '.css':
        contentType = 'text/css';
        break;
    case '.png':
        contentType = 'image/png';
        break;
    }

    console.log("filePath:" + filePath);

    fs.readFile(filePath,

    function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading ' + req.url);
        }

        res.writeHead(200, {
            'Content-Type': contentType
        });
        res.end(data);
    });
}

//Storing all instances
var instances = {};
var locked = {};
var id = 0;

var types = {
    postit: {
        id: "postit",
        baseClass: "postit",
        view: "<div id='wity_{$id$}' class='postit'>" + "<div class='postit_header'>" + "<div class='removeButton'>X</div>" + "<div class='moveButton'>O</div>" + "</div>" + "<div class='postit_content'>{$content$}</div>" + "</div>",
        model: ["id", "x", "y", "content"],
        logic: ""
    }
};

//Sending all instances to the new entrants
//Receiving all add/remove/update commands on instances
//Broadcasting them

io.sockets.on('connection', function(socket) {

    for (var idStr in instances) {
        if (instances[idStr] !== undefined) {
            socket.emit('boxAdded', instances[idStr]);
        }
    }

    socket.on('add box', function(data) {

        var postit = data;
        postit.id = id;

        var idStr = id + "";
        instances[idStr] = postit;

        socket.emit('boxAdded', postit);
        socket.broadcast.emit('boxAdded', postit);

        id++;
    });

    socket.on('remove box', function(data) {
        var idToRemove = data.id + "";
        delete instances[idToRemove];

        socket.emit('boxRemoved', data);
        socket.broadcast.emit('boxRemoved', data);
    });

    socket.on('change box', function(data) {
        console.log("Request changing postit: " + data);

        var idStr = data.id + "";

        if (typeof instances[idStr] !== "undefined") {
            for (var property in data) {
                instances[idStr][property] = data[property];
            }

            var changedData = instances[idStr];

            socket.emit('boxChanged', changedData);
            socket.broadcast.emit('boxChanged', changedData);
        }
    });

    socket.on('request lock', function(data) {
        var idStr = data.id + "";
        var socketId = socket.id;

        console.log(idStr + " will be locked by " + socketId);

        if (typeof locked[idStr] == "undefined") {
            locked[idStr] = socketId;
            socket.emit('lockedForYou', data);
            socket.broadcast.emit('locked', data);
        }
        else {
            socket.emit('locked', data);
        }
    });

    socket.on('release lock', function(data) {
        var idStr = data.id + "";
        var socketId = socket.id;

        console.log(idStr + " will be released by " + socketId);

        if (locked[idStr] == socketId) {
            delete locked[idStr];
            socket.emit('released', data);
            socket.broadcast.emit('released', data);
        }
        else {
            socket.emit('locked', data);
        }
    });

    socket.on('request type', function(data) {
        console.log("TYPES: " + types);
        socket.emit("typeSent", types[data.type]);
    });
});