var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs')
, path = require('path');

app.listen(process.env.PORT);

function handler (req, res) {

	console.log('request starting...');

	var filePath = __dirname + req.url;
	if (req.url == '/')
		filePath = __dirname + '/index.html';

	var extname = path.extname(filePath);
	var contentType = 'text/html';
	switch (extname) {
	case '.js':
		contentType = 'text/javascript';
		break;
	case '.css':
		contentType = 'text/css';
		break;
	}

	console.log("filePath:"+filePath);

	fs.readFile(filePath,
			function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading '+ req.url);
		}

		res.writeHead(200, { 'Content-Type': contentType });
		res.end(data);
	});
}

//Storing all boxes
var boxes = {};
var id = 0;

//Sending all boxes to the new entrants
//Receiving all add/remove/update commands on boxes
//Broadcasting them

io.sockets.on('connection', function (socket) {
	//socket.emit('news', { hello: 'world' });

    for(var idStr in boxes){
        if(boxes[idStr] !== undefined) {
            socket.emit('boxAdded', boxes[idStr]);
        }
    }
	for(var i = 0;i < boxes.length;i++) {
		socket.emit('boxAdded', { id: i+1, color: boxes[i] });
	}

	socket.on('add box', function (data) {
        
        var postit = {"id":id,"x":data.x,"y":data.y,"content":data.content};
        
        var idStr = id+"";
		boxes[idStr] = postit;
        
		console.log("postit added");
		socket.emit('boxAdded', { "id": id, "x":data.x, "y":data.y, "content":data.content});
		socket.broadcast.emit('boxAdded', { "id": id, "x":data.x, "y":data.y, "content":data.content});
        
        id++;
	});

	socket.on('remove box', function (data) {
        var idToRemove = data.id+"";
        boxes[idToRemove] = undefined;
        socket.emit('boxRemoved', data);
        socket.broadcast.emit('boxRemoved', data);
	});

	socket.on('change box', function (data) {
		console.log("Request changing postit: "+data);
        
        var idStr = data.id+"";
        boxes[idStr] = data;
        socket.emit('boxChanged', data);
        socket.broadcast.emit('boxChanged', data);
	});
});