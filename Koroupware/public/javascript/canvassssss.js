//Point 생성자 함수를 생성
function Point(event, target){
	this.x = event.pageX - $(target).position().left;
	this.y = event.pageY - $(target).position().top;
}

$(function(){
	//Canvas 객체 추출
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var $captureList = $('#caputreList');
	var $hiddenDiv = $('#hiddenDiv');
	
	//변수 선언
	var width = 5;
	var opacity = 1.0;
	var pressure = 1.0;
	var color = '#000000';
	var isDown = false;
	var newPoint;
	var oldPoint;
	
	//이미지 캡쳐 정보들 가져오기
	$.ajax({
		type: 'get',
		url: 'http://localhost:8081/canvas/imageCapture',
		data: {
			image_room_no : $hiddenDiv.find('#image_room_no').text()
		},
		success: function(data){
			$.each(data, function(index, item){
				var li = $('<li></li>')
							.attr('data-img', item.image_capture_contents)
							.text(item.image_capture_explain)
							.appendTo($captureList);
			});
		}
	});
	
	//이벤트 연결
	canvas.addEventListener('mousedown', function(event){
		isDown = true;
		oldPoint = new Point(event, this);
	});
	
	canvas.addEventListener('mouseup', function(){
		socket.emit('saveImage',{
			image_capture_contents: canvas.toDataURL(),
			image_room_no: $hiddenDiv.find('#image_room_no').text()
		});
		
		isDown = false;
	});
	
	canvas.addEventListener('mousemove', function(event){
		if(isDown){
			newPoint = new Point(event, this);
			socket.emit('draw', {
				width: width,
				color: color,
				x1: oldPoint.x,
				y1: oldPoint.y,
				x2: newPoint.x,
				y2: newPoint.y
			});
			
			oldPoint = newPoint;
		}
	});
	
	$('#widthSlider').change(function(){
		width = $(this).val();
	});
	
	$('#opacitySlider').change(function(){
		opacity = $(this).val() / 100;
	});
	
	$('#colorSelecter').change(function(){
		color = $(this).val();
	});
	
	$('#eraserButton').click(function(){
		color = '#FFFFFF';
		opacity = 1.0;
		width = 20;
	});
	
	$('#captureButton').click(function(){
		var $captureExplain = $('#captureExplain');
		
		$.ajax({
			type: 'post',
			url: 'http://localhost:8081/canvas/imageCapture',
			data: {
				image_capture_contents: canvas.toDataURL(),
				image_capture_explain: $captureExplain.val(),
				image_room_no: $hiddenDiv.find('#image_room_no').text(),
				emp_no: 5
			},
			success: function(message){
				alert(message);
				
				var li = $('<li></li>')
						.attr('data-img', canvas.toDataURL())
						.text($captureExplain.val())
						.appendTo($captureList);
						
				$captureExplain.val('');
			}
		});
	});
	
	$('#clearButton').click(function(){
		socket.emit('clean');
	});
	
	$captureList.on('click', 'li', function(){
		socket.emit('drawImage', $(this).attr('data-img'));
	});
	
	//소켓 이벤트 연결
	var socket = io.connect();
	
	socket.emit('join', $hiddenDiv.find('#image_room_no').text());
	
	socket.on('line', function(data){
		context.lineWidth = data.width;
		context.strokeStyle = data.color;
		context.globalAlpha = opacity * pressure;
		context.beginPath();
		context.moveTo(data.x1, data.y1);
		context.lineTo(data.x2, data.y2);
		context.stroke();
	});
	
	socket.on('clean', function(){
		context.clearRect(0,0,canvas.width, canvas.height);
	});
	
	socket.on('drawImage', function(data){
		var image = new Image();
		
		image.src = data;
		
		context.drawImage(image, 0, 0);
	});
	
	socket.emit('loadImage', $hiddenDiv.find('#image_room_no').text());
});