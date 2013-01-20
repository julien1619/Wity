$(document).ready( function() {

	var socket = io.connect(document.URL);
    var locked = {};
	
	socket.on('boxAdded', function (data) {
		console.log(data);
		addBox(data.id,data.x,data.y,data.content);
        locked[data.id] = false;
	});
	
	socket.on('boxRemoved', function (data) {
		console.log(data);
		removeBox(data.id);
	});
	
	socket.on('boxChanged', function (data) {
		console.log(data);
		changePostIt(data.id,data.x,data.y,data.content);
	});
	
	function sendAddBox(xPos,yPos,content) {
        var data = {"x":xPos,"y":yPos,"content":content};
        socket.emit('add box',data);
	}
	
	function sendRemoveBox() {
		socket.emit('remove box');
	}
	
	function sendChangePostIt(id, xPos, yPos, content) {
		console.log("Request changing post it");
        var data = {"id": id,"x":xPos,"y":yPos,"content":content};
		socket.emit('change box', data);
	}
	
	//Change color button
	$(".postit").live("click", function (event) {
        var idSubstr = $(this).attr('id').substring(5);
        console.log("idSubstr:"+idSubstr);
		var id = parseInt(idSubstr);
        
        if(!locked[id]) {
            //sendLock(id);
            editContent(id);
        }
	});
    
    function editContent(id) {
        $("#postit_id").val(id);
        $("#postit_editor").val($("#wity_"+id+" > .postit_content").html());
    }
    
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
	
	//Add logic
	function addBox(id, xPos, yPos, content) {
        console.log("Add box! x:"+xPos+" y:"+yPos+" id:"+id);
		$("#postit_container").append("<div id='wity_"+id+"' class='postit'><div class='postit_header'></div><div class='postit_content'>"+content+"</div></div>");
		$("#wity_"+id).css('left',xPos);
        $("#wity_"+id).css('top',yPos);
	}
	
	//Remove logic
	function removeBox(id) {
		$("#wity_"+id).remove();
	}
	
	//Change color button
	function changePostIt(id, xPos, yPos, content) {
		$("#wity_"+id).css('left',xPos);
        $("#wity_"+id).css('top',yPos);
        $("#wity_"+id+" > .postit_content").html(content);
	}
    
    $("#background_wrapper").click(function(event) {        
        var x = event.pageX - $(this).offset().left;
        var y = event.pageY - $(this).offset().top; 
        
        sendAddBox(x,y,"");
    });
	
	//Drag a post-it
	/*$( ".postit" ).draggable({
        containment: "#postit_container",
        start: function( event, ui ) {
            //lock();
        },
        stop: function( event, ui ) {
            var idSubstr = $(this).attr('id').substring(5);
            console.log("idSubstr:"+idSubstr);
            var id = parseInt(idSubstr);
            
            var xPos = $("#wity_"+id).css('left');
            var yPos = $("#wity_"+id).css('top');
            var content = $("#wity_"+id+" > .postit_content").html();
            sendChangePostIt(id, xPos, yPos, content);
        }
    });*/
});