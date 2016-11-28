var pageDefaultLeft;

//Point 생성자 함수를 생성
function Point(event, target){
	this.x = event.pageX - $(target).position().left - pageDefaultLeft;
	//화면 크기가 변하면 안맞음
	
	//this.x = event.pageX - $(target).position().left;
	this.y = event.pageY - $(target).position().top;
}

$(function(){
	var container = document.getElementById('container');
	var imageDiv = document.getElementById('imageDiv');
	//Canvas 객체 추출
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var $captureList = $('#caputreList');
	var $hiddenDiv = $('#hiddenDiv');

	//변수 선언
	//화면 크기
	pageDefaultLeft = parseInt($(container).css('margin-left')) 
						+ parseInt($(container).css('padding-left'))
						- parseInt($(canvas).css('margin-left')) 
						+ parseInt($(imageDiv).css('padding-left'));
	
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
		url: 'http://192.168.0.164:8081/canvas/imageCapture',
		data: {
			image_room_no: $hiddenDiv.find('#image_room_no').text(),
			emp_no: $hiddenDiv.find('#emp_no').text()
		},
		success: function(data){
			$.each(data, function(index, item){
				appendCapture(item);
			});
		}
	});
	
	//채팅 정보들 가져오기
	$.ajax({
		type: 'get',
		url: 'http://192.168.0.164:8081/chat/',
		data: {
			image_room_no: $hiddenDiv.find('#image_room_no').text()
		},
		success: function(data){
			$.each(data, function(index, item){
				appendChat(item);
			});
		}
	});
	
	function canvasMouseClickEvnet(event){
		isDown = true;
		oldPoint = new Point(event, this);
	}
	
	//이벤트 연결
	$(canvas).on('mousedown', canvasMouseClickEvnet);
	
	$(canvas).on('mouseup', function(){
		socket.emit('saveImage',{
			image_capture_contents: canvas.toDataURL(),
			image_room_no: $hiddenDiv.find('#image_room_no').text()
		});
		
		isDown = false;
	});
	
	$(canvas).on('mousemove', function(event){
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
	
	//두께 설정
	$('#widthSlider').change(function(){
		width = $(this).val();
	});
	
	//투명도 설정
	$('#opacitySlider').change(function(){
		opacity = $(this).val() / 100;
	});
	
	//색상 설정
	$('#colorSelecter').change(function(){
		color = $(this).val();
	});

	//펜 선택
	$('#penButton').click(function(){
		color = $('#colorSelecter').val();
		opacity = $('#opacitySlider').val() / 100;
		width = $('#widthSlider').val();
	});
	
	//지우개 선택
	$('#eraserButton').click(function(){
		color = '#FFFFFF';
		opacity = 1.0;
		
		$('#widthSlider').val(20);
		
		width = 20;
	});
	
	/*
	$('#imageFile').change(function(event){
		var fileObj = document.getElementById('imageFile'); 
		var filePath = fileObj.value;
		var fileName = filePath.substring(filePath.lastIndexOf("\\")+1);
		var fileKind = fileName.split(".")[1];
		
		if(fileKind != "jpg" && fileKind != "gif" && fileKind != "png"){
			alert("jpg, gif, png 확장자를 가진 이미지 파일만 올려주세요.");
			document.getElementById("image_file").value = "";
			document.getElementById("image_file").select();
			document.selection.clear();
		}
	});
	
	$('#testButton').click(function(){
		var imageFile = document.getElementById('').files[0];
		alert(imageFile);
		
		var filePath = imageFile.value;
		alert(filePath);
		
		var fileName = filePath.substring(filePath.lastIndexOf('\\' + 1));
		alert(fileName);
		
		var fileKind = fileName.split('.')[1];
		alert(fileKind);
		
		if(fileKind != 'jpg' && fileKind != 'gif' && fileKind != 'png'){
		    alert('jpg, gif, png 확장자를 가진 이미지 파일만 올려주세요.');
		}
	});
	*/
	
	
	//캡처 내용 추가
	function appendCapture(data){
		var aTag = $('<a>X</a>');
		
		var liTag = $('<li></li>')
					.attr('data-img', data.image_capture_contents)
					.attr('data-index', data.image_capture_no)
					.text(data.image_capture_explain)
					.append(aTag)
					.appendTo($captureList);
	}
	
	//날짜 형식 변환
	function toDateFormat(argDate){
		var date = new Date(argDate);
		
		return date.getFullYear() + '년 ' + (date.getMonth() + 1) + '월 ' 
				+ date.getDate() + '일 ' + date.getHours() + '시 ' + date.getMinutes() + '분 ' 
				+ date.getSeconds() + '초';
	}
	
	//채팅 내용 추가
	function appendChat(data){
		var divTag = $('<div></div>')
					.attr('data-index', data.image_room_his_no)
					.appendTo('.chat-area');
		
		if(isMyEmpNo(data.emp_no)){
			divTag.addClass('myChat');
		}

		$('<span></span>')
		.text(data.image_room_his_contents)
		.addClass('chatContents')
		.appendTo(divTag)
		.after('<br/>');

		$('<span></span>')
		.html(toDateFormat(data.image_room_his_regdate))
		.addClass('chatRegdate')
		.appendTo(divTag)
		.after('<br/>');
		
		$('<span></span>')
		.text(data.dept_name + ' ' + data.emp_name + data.office_name)
		.addClass('chatEmp')
		.appendTo(divTag);
	}
	
	//화면 캡쳐
	$('#captureButton').click(function(){
		var $captureExplain = $('#captureExplain');
		
		$.ajax({
			url: 'http://192.168.0.164:8081/canvas/getImageCaptureNo',
			type: 'get',
			success: function(image_capture_no){
				$.ajax({
					type: 'post',
					url: 'http://192.168.0.164:8081/canvas/imageCapture',
					data: {
						image_capture_contents: canvas.toDataURL(),
						image_capture_explain: $captureExplain.val(),
						image_room_no: $hiddenDiv.find('#image_room_no').text(),
						emp_no: $hiddenDiv.find('#emp_no').text()
					},
					success: function(message){
						alert(message);
						
						appendCapture({
							image_capture_contents: canvas.toDataURL(),
							image_capture_explain: $captureExplain.val(),
							image_capture_no: image_capture_no
						});
								
						$captureExplain.val('');
					}
				});
			}
		});
	});
	
	//그림판 내용 지우기
	$('#clearButton').click(function(){
		socket.emit('clean');
	});
	
	//캡쳐 정보 삭제하기
	$captureList.on('click', 'a', function(event){
		event.stopPropagation();
		
		var that = $(this);
		
		$.ajax({
			type : 'post',
			url : 'http://192.168.0.164:8081/canvas/imageCaptureDelete',
			data: {
				image_capture_no : that.parent().attr('data-index')
			},
			dataType : 'text',
			success : function(result) {
				if (result == 'SUCCESS') {
					alert('삭제되었습니다.');
					that.parent().remove();
				}
			}
		});
	});
	
	//그림 그리기
	$captureList.on('click', 'li', function(){
		socket.emit('drawImage', $(this).attr('data-img'));
	});
	
	//소켓 이벤트 연결
	var socket = io.connect();
	
	socket.emit('join',{
		image_room_no: $hiddenDiv.find('#image_room_no').text(),
		emp_no: $hiddenDiv.find('#emp_no').text()
	});
	
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
	
	socket.emit('loadImage');
	
	socket.on('joinList', function(joinList){
		$('.chat-people').html('');
		
		$.each(joinList, function(index, item){
			$.ajax({
				type: 'get',
				url: 'http://192.168.0.164:8081/imageRoom/getEmp',
				data: {
					emp_no: item
				},
				success: function(data){
					$('<span></span>')
					.attr('data-index', data.emp_no)
					.text(data.dept_name + ' ' + data.emp_name + data.office_name)
					.appendTo('.chat-people');
				}
			});
		});
	});
	
	$('.chat-people').on('click', 'span', function(){
		if($(this).hasClass('drawDisable')){
			socket.emit('removeDrawDisable', $(this).attr('data-index'));
		}else{
			socket.emit('addDrawDisable', $(this).attr('data-index'));
		}
	});
	
	function isMyEmpNo(emp_no){
		if($hiddenDiv.find('#emp_no').text() == emp_no){
			return true;
		}
		
		return false;
	}
	
	socket.on('addDrawDisable', function(data){
		if(isMyEmpNo(data)){
			$(canvas).off('mousedown');
		}
		
		$('.chat-people').find('span[data-index='+data+']').addClass('drawDisable');
	});
	
	socket.on('removeDrawDisable', function(data){
		if(isMyEmpNo(data)){
			$(canvas).on('mousedown', canvasMouseClickEvnet);
		}
		
		$('.chat-people').find('span[data-index='+data+']').removeClass('drawDisable');
	});

	
	//채팅
	$('#chatEnterButton').on('click', function(event){
		$.ajax({
			url: 'http://192.168.0.164:8081/chat/getImageRoomHisNo',
			type: 'get',
			success: function(imageRoomHisNo){
				var chatData = {
					image_room_his_contents: $('#chatText').val(),
					image_room_no: $hiddenDiv.find('#image_room_no').text(),
					emp_no: $hiddenDiv.find('#emp_no').text(),
					image_room_his_no: imageRoomHisNo,
					image_room_his_regdate: new Date()
				};
				
				$.ajax({
					url: 'http://192.168.0.164:8081/chat/',
					type: 'post',
					data: chatData,
					success: function(data){
						alert(data);
						
						socket.emit('chat', chatData);
						
						$('#chatText').val('');
					}
				});
			}
		});
	});
	
	socket.on('chat', function(data){
		appendChat(data);
	});
});