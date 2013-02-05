$(document).ready( function() {

    /**
     * Global vars initialization
     */
    var socket = io.connect(document.URL);
    var locked = {};
    var access = {};
    var types = {};
    var instances = {};
    
    var datas_waiting_to_be_added = {};
	
    /**
     * Add an object in view
     */
    
    //Requesting add operation
    function sendAddBox(xPos,yPos,content) {
        var data = {"x":xPos,"y":yPos,"content":content,"type":"postit","where":"postit_container"};
        socket.emit('add box',data);
    }
    
    //Applying add operation
	socket.on('boxAdded', function (data) {
        console.log("type: "+types[data.type]);
        if(typeof types[data.type] === "undefined" ) {
            console.log("Type manquant, on l'appelle et on attend.");
            if(datas_waiting_to_be_added[data.type] === undefined) {
                datas_waiting_to_be_added[data.type] = {};
            }
            datas_waiting_to_be_added[data.type][data.id] = data;
            socket.emit('request type',{"type": data.type});
        } else {
            addObjectInView(data);
        }
	});
    
    function addObjectInView(data) {
        console.log("On ajoute: " + data);
        if (typeof instances[data.id] == "undefined") {
            instances[data.id] = data;
            var type = types[data.type];
            console.log("Avec la view: " + type.view);
            var object_content = types[data.type].view;
            var specific_content = object_content;
    
            var length = types[data.type].model.length,
                element = null;
            for (var i = 0; i < length; i++) {
                element = types[data.type].model[i];
                specific_content = specific_content.replace("{$" + element + "$}", data[element]);
                // Do something with element i.
            }
    
            console.log("specific content: " + specific_content);
    
            $("#" + data.where).append(specific_content);
            $("#wity_" + data.id).css('left', data.x);
            $("#wity_" + data.id).css('top', data.y);
            locked[data.id] = false;
        } else {
            console.log("Object already here.");
        }
    
        delete datas_waiting_to_be_added[data.id];
    }
    /**
     * Receiving type
     */
     
    socket.on('typeSent', function(type) {
        var newType = type;
        types[type.id] = newType;
        
        for(var data in datas_waiting_to_be_added[type.id]) {
            //Add a dependency treatment. Recursive ?
            addObjectInView(datas_waiting_to_be_added[type.id][data]);
        }
    });
    
    /**
     * Remove an object in view
     */
	
    //Requesting remove operation
    function sendRemoveBox(id) {
        var data = {"id": id};
        socket.emit('remove box',data);
	}
    
    //Applying remove operation
	socket.on('boxRemoved', function (data) {
        delete instances[data.id];
		$("#wity_"+data.id).remove();
	});
    
    /**
     * Update an object in view
     */
	
    //Requesting update operation
    function sendChangePostIt(data) {
		socket.emit('change box', data);
	}
    
    //Applying update operation
	socket.on('boxChanged', function (data) {
        instances[data.id] = data;
		$("#wity_"+data.id).css('left',data.x);
        $("#wity_"+data.id).css('top',data.y);
        $("#wity_"+data.id+" > .postit_content").html(data.content);
	});
    
    function lockObject(data) {
        console.log("Request lock on "+data.id);
        socket.emit('request lock',data);
    }
    
    function releaseObject(data) {
        console.log("Request release on "+data.id);
        socket.emit('release lock',data);
    }
    
    var allowUnlock = true;
    
    socket.on('lockedForYou', function(data) {
        console.log("Locked for me "+data.id);
        access[data.id] = data;
        //Allow dragging
        //Drag a post-it
        $( "#wity_"+data.id ).draggable({
            containment: "#postit_container",
            start: function( event, ui ) {
                allowUnlock = false;
                //lock();
            },
            stop: function( event, ui ) {
                var id = getId($(this));
                var instance = instances[id];
                
                allowUnlock = true;
                
                var xPos = $("#wity_"+instance.id).css('left');
                var yPos = $("#wity_"+instance.id).css('top');
                sendChangePostIt({"id":id, "x":xPos, "y":yPos});
            }
        });
    });
    
    socket.on('locked', function(data) {
        console.log("Locked "+data.id);
        locked[data.id] = data;
    });
    
    socket.on('released', function(data) {
        console.log("Released "+data.id);
        if(typeof locked[data.id] != "undefined") {
            delete locked[data.id];
        }
        
        if(typeof access[data.id] != "undefined") {
            delete access[data.id];
            //Disallow dragging
            $("#wity_"+data.id).draggable("destroy");
        }
    });
	
	//Change text
	$("#postit_container").on("click", ".postit_content", function () {
        var self = $(this).parents(".postit");
        var id = getId(self);
        console.log(id + " will be edited.");
        
        var data = instances[id];
        
        if(!locked[id]) {
            //sendLock(id);
            $("#postit_id").val(data.id);
            $("#postit_editor").val(data.content);
        }
	});
    
    //Save text
    $("#save_button").click(function () {
        if($("#postit_id").val()!=="" || $("#postit_id").val()!==undefined) {
            var id = $("#postit_id").val();
            var content = $("#postit_editor").val();
            console.log(content);
            sendChangePostIt({"id":id, "content":content});
            $("#postit_id").val("");
            $("#postit_editor").val("");
        }
    });
    
    $("#postit_container").on("mouseenter",".moveButton",function () {
        var postit = $(this).parents(".postit");
        var id = getId(postit);
        if((access[id] === undefined) && (locked[id] !== undefined)) {
            lockObject({"id":id});
        }        
    });
    
    $("#postit_container").on("mouseleave",".postit_header",function () {
        if(allowUnlock === true) {
            var postit = $(this).parents(".postit");
            var id = getId(postit);
            releaseObject({"id":id});
        }
    });
    
    $("#postit_container").on("click",".removeButton",function () {
        var postit = $(this).parents(".postit");
        var id = getId(postit);
        sendRemoveBox(id);
    });
    
    $("#postit_container").on("mouseenter",".postit",function() {
        preventAdd = true;
    });
    
    $("#postit_container").on("mouseleave",".postit",function() {
        preventAdd = false;
    });
    
    var preventAdd = false;
    
    //Add postit onClick
    $("#postit_container").click(function(event) {   
        if(preventAdd === false) {
            var xOffset = parseInt(nCss("width","postit"))/2;
            var yOffset = parseInt(nCss("height","postit"))/2;
            
            var maxXPos = parseInt($(this).css("width")) - xOffset*2;
            var maxYPos = parseInt($(this).css("height")) - yOffset*2;
            
            var x = event.pageX - $(this).offset().left - xOffset;
            var y = event.pageY - $(this).offset().top - yOffset; 
            
            console.log(xOffset + " " + yOffset + " " + maxXPos + " " + maxYPos + " " + x + " " + y + " ");
            
            x = x>maxXPos ? maxXPos : x;
            x = x<0 ? 0 : x;
            y = y>maxYPos ? maxYPos : y;
            y = y<0 ? 0 : y;
            
            sendAddBox(x,y,"");
        }
    });
    
    /**
     * Utils
     */
     
    //Get wity id
    function getId(object) {
        var idSubstr = object.attr('id').substring(5);
        return parseInt(idSubstr);
    }
    
    function nCss(prop, fromClass) {
        var $inspector = $("<div>").css('display', 'none').addClass(fromClass);
        $("body").append($inspector); // add to DOM, in order to read the CSS property
        try {
            return $inspector.css(prop);
        } finally {
            $inspector.remove(); // and remove from DOM
        }
    }
});