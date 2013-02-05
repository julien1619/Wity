var http = require('http'),
    socketio = require('socket.io'),
    fs = require('fs'),
    path = require('path');
	
var mime = require("./mime.js"),
	routes = require("./routes.js");

var Wity = (function() {

	var app = null;
	var io = null;
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

	function handler(req, res) {

		console.log('request starting...');
		
		if (req.method === "HEAD") { 
            res.write = function () {};
        }
        
        routes.route(req, res, [
            ["^/$", function() { serveFile(req, res, "/index.html"); }],
            ["^/upload$",                        uploadFile],
            ["[\w\W]*",                          serveStatic]
        ]);
	};
	
	function serveStatic(req, res, rest) { 
        serveFile(req, res, req.url);
    };
	
	function uploadFile(req, res) { 

        var content = '';
        
        req.setEncoding("binary");
        
        req.addListener('data', function(chunk) {
            content += chunk;
        });
        
        req.addListener('end', function() {
			id++;
            var name = id + "." + imgExt(content),
                dest = __dirname + "/files/" + name;

			var tempId = id;
			
            fs.writeFile(dest, content, "binary", function (err) {
                res.writeHead(200, {'content-type': 'text/plain'});
                res.end(id);
            });
        });
    };
	
	function serve404(req, res) { 
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("404 Not Found\n");
        res.end();
    };
    
    function serveFile(req, res, uri) { 
        var filename = __dirname +  uri;
        path.exists(filename, function (exists) {
            if (exists) { 
                fs.readFile(filename, "binary", function(err, file) {
                    var headers = {"Content-Type": mime.lookup(filename)};
                    res.writeHead(200, headers);
                    res.write(file, "binary");
                    res.end();
                });
            } else {
                serve404(req, res);
            }
        });               
    };

	function init() {
		app = http.createServer(handler);
		app.listen(process.env.PORT);
		io = socketio.listen(app);
		
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
	};
	
	return {"init": init};
});

Wity.init();
