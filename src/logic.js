$(document).ready( function() {

	var colorList = ["#111111","#ffffff","#11ffff"];

	var socket = io.connect('http://creatiwity.net:1337');
	
	socket.on('boxAdded', function (data) {
		console.log(data);
		addBox(data.id,data.color);
	});
	
	socket.on('boxRemoved', function (data) {
		console.log(data);
		removeBox(data.id);
	});
	
	socket.on('boxChanged', function (data) {
		console.log(data);
		changeColorBox(data.id, data.color);
	});
	
	function sendAddBox() {
		socket.emit('add box');
	}
	
	function sendRemoveBox() {
		socket.emit('remove box');
	}
	
	function sendChangeColorBox(boxId, newColor) {
		console.log("Request changing box color");
		socket.emit('change box', {id: boxId, color: newColor});
	}

	//Add button
	$("#b_add").click( function () {
		sendAddBox();
	});
	
	//Remove button
	$("#b_rem").click( function () {
		sendRemoveBox();
	});
	
	//Change color button
	$(".color_box").live("click", function () {
		var idSubstr = $(this).attr('id').substring(5);
		console.log("idSubstr:"+idSubstr);
		var id = parseInt(idSubstr);
		
		var newColor = colorList[0];	

		var oldColor = colorToHex($(this).css('backgroundColor'));
		var colorId = colorList.indexOf(oldColor);
		console.log("oldColor:" + oldColor);
		if(colorId < colorList.length-1) {
			newColor = colorList[colorId+1];
		}
		
		sendChangeColorBox(id, newColor);
	});
	
	//Add logic
	function addBox(id,color) {
		$("#content_test").append("<div id='wity_"+id+"' class='color_box'></div>");
		$("#wity_"+id).css('backgroundColor',color);
	}
	
	//Remove logic
	function removeBox(id) {
		$("#wity_"+id).remove();
	}
	
	//Change color button
	function changeColorBox(id,newColor) {
		$("#wity_"+id).css('backgroundColor',newColor);;
	}
	
	/*********
	 * Tools
	 ********/
	
	function colorToHex(color) {
		if (color.substr(0, 1) === '#') {
			return color;
		}
		var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
		
		var red = parseInt(digits[2]);
		var green = parseInt(digits[3]);
		var blue = parseInt(digits[4]);
		
		var rgb = blue | (green << 8) | (red << 16);
		return digits[1] + '#' + rgb.toString(16);
	};
});