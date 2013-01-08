var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , path = require('path')

app.listen(1337);

function handler (req, res) {
  /*fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });*/
  
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
var boxes = [];

//Sending all boxes to the new entrants
//Receiving all add/remove/update commands on boxes
//Broadcasting them

io.sockets.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
	
	for(var i = 0;i < boxes.length;i++) {
		socket.emit('boxAdded', { id: i+1, color: boxes[i] });
	}
  
	socket.on('add box', function () {
		var boxColor = "#111111";
		boxes.push(boxColor);
		console.log("box "+boxes.length+" added");
		socket.emit('boxAdded', { id: boxes.length, color: boxColor });
		socket.broadcast.emit('boxAdded', { id: boxes.length, color: boxColor });
	});
	
	socket.on('remove box', function () {
		if(boxes.length > 0) {
			boxes.pop();
			console.log("box "+(boxes.length+1)+" removed");
			socket.emit('boxRemoved', { id: boxes.length+1 });
			socket.broadcast.emit('boxRemoved', { id: boxes.length+1 });
		}
	});
	
	socket.on('change box', function (data) {
		console.log("Request changing box: "+data);
		if(data.id <= boxes.length) {
			boxes[data.id-1] = data.color;
			socket.emit('boxChanged', data);
			socket.broadcast.emit('boxChanged', data);
		}
	});
});