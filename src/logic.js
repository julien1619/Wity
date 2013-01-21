$(document).ready( function() {

    /**
     * Global vars initialization
     */
    var socket = io.connect(document.URL);
    var locked = {};
	
    /**
     * Add an object in view
     */
    
    //Requesting add operation
    function sendAddBox(xPos,yPos,content) {
        var data = {"x":xPos,"y":yPos,"content":content};
        socket.emit('add box',data);
    }
    
    //Applying add operation
	socket.on('boxAdded', function (data) {
		$("#postit_container").append("<div id='wity_"+data.id+"' class='postit'><div class='postit_header'><div class='removeButton'>X</div><div class='moveButton'>O</div></div><div class='postit_content'>"+data.content+"</div></div>");
        $("#wity_"+data.id).css('left',data.x);
        $("#wity_"+data.id).css('top',data.y);
        locked[data.id] = false;
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
		$("#wity_"+data.id).remove();
	});
    
    /**
     * Update an object in view
     */
	
    //Requesting update operation
    function sendChangePostIt(id, xPos, yPos, content) {
        var data = {"id": id,"x":xPos,"y":yPos,"content":content};
		socket.emit('change box', data);
	}
    
    //Applying update operation
	socket.on('boxChanged', function (data) {
		$("#wity_"+data.id).css('left',data.x);
        $("#wity_"+data.id).css('top',data.y);
        $("#wity_"+data.id+" > .postit_content").html(data.content);
	});
	
	//Change text
	$("#postit_container").on("click", ".postit_content", function () {
        var self = $(this).parents(".postit");
        var id = getId(self);
        console.log(id + " will be edited.");
        
        if(!locked[id]) {
            //sendLock(id);
            $("#postit_id").val(id);
            $("#postit_editor").val($("#wity_"+id+" > .postit_content").html());
        }
	});
    
    //Save text
    $("#save_button").click(function () {
        if($("#postit_id").val()!=="" || $("#postit_id").val()!==undefined) {
            var id = $("#postit_id").val();
            var xPos = $("#wity_"+id).css('left');
            var yPos = $("#wity_"+id).css('top');
            var content = $("#postit_editor").val();
            console.log(content);
            sendChangePostIt(id, xPos, yPos, content);
        }
    });
    
    var disableDragging = true;
    
    $("#postit_container").on("mouseenter",".moveButton",function () {
        disableDragging = false;
        
        //Drag a post-it
        $( ".postit" ).draggable({
            containment: "#postit_container",
            start: function( event, ui ) {
                //lock();
            },
            stop: function( event, ui ) {
                var id = getId($(this));
                
                var xPos = $("#wity_"+id).css('left');
                var yPos = $("#wity_"+id).css('top');
                var content = $("#wity_"+id+" > .postit_content").html();
                sendChangePostIt(id, xPos, yPos, content);
            }
        });
        console.log("postits are now draggable");
    });
    
    $("#postit_container").on("mouseleave",".postit",function () {
        disableDragging = true;
        $(".postit").draggable("destroy");
        console.log("postits are fixed");
    });
    
    $("#postit_container").on("click",".removeButton",function () {
        var postit = $(this).parents(".postit");
        var id = getId(postit);
        sendRemoveBox(id);
    });
    
    //Add postit onClick
    $("#background_wrapper").click(function(event) {   
        if(disableDragging) {
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
        console.log(object);
        var idSubstr = object.attr('id').substring(5);
        console.log("idSubstr:"+idSubstr);
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