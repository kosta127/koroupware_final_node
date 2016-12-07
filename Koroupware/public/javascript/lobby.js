$(document).ready(function(){
	var $hiddenDiv = $('#hiddenDiv');
	var emp;
	
	//emp 정보 셋팅
	$.ajax({
		type: 'get',
		url: 'http://192.168.0.13:8081/imageRoom/getEmp',
		data: {
			emp_no: $hiddenDiv.find('#emp_no').text()
		},
		success: function(data){
			emp = data;
		}
	});
	
	//맨 처음 페이지 접속시 db에 있는 방에 대한 정보 ajax 처리
	$.ajax({
		type: 'get',
		url: 'http://192.168.0.13:8081/imageRoom/imageRoomLobby',
		success: function(data){
			$.each(data, function(index, item){
				createRoom(item);
			});
		}
	});
	
	//Socket 처리
	var socket = io.connect();
	
	function createRoom(data){
		var divTag = $('<div></div>')
						.attr('data-index', data.image_room_no)
						.addClass('roomDiv');
		
		$('<span></span>')
		.text('방이름 : ' + data.image_room_name)
		.addClass('roomName')
		.appendTo(divTag)
		.after('</br>');
		
		$('<span></span>')
		.text('방장 : ' + data.dept_name + ' ' + data.emp_name + data.office_name)
		.addClass('creater')
		.appendTo(divTag)
		.after('</br>');

		$('<button></button>').attr({
			'data-room': data.image_room_no
		}).text('입장')
		.addClass('btn')
		.addClass('btn-default')
		.appendTo(divTag);
		
		var aTag = $('<a>방삭제</a>')
					.addClass('removeTag');
		
		divTag
		.append(aTag)
		.appendTo('#roomDiv');
	}
	
	socket.on('create_room', function(data){
		//문서 객체를 추가
		createRoom(data);
	});
	
	//이벤트 연결
	$('#roomDiv').on('click', 'button', function(){
		//방의 pk 변수 선언
		var room = $(this).attr('data-room');
		
		//방의 pk를 가지고 페이지 이동
		location = 'canvas?image_room_no=' + room;
	});
	
	$('#roomDiv').on('click', 'a', function(event){
		event.stopPropagation();
		var that = $(this);
		
		$.ajax({
			type : 'post',
			url : 'http://192.168.0.13:8081/imageRoom/imageRoomDelete',
			data: {
				image_room_no : that.parent().attr('data-index')
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
	
	$('#createButton').click(function(){
		$.ajax({
			type: 'get',
			url: 'http://192.168.0.13:8081/imageRoom/getRoomNo',
			success: function(image_room_no){
				//방 이름에 대한 변수 선언
				var image_room_name = $('#room').val();
				
				//ajax로 spring에 정보 보내기
				$.ajax({
					type: 'post',
					url: 'http://192.168.0.13:8081/imageRoom/imageRoomLobby',
					data: {
						image_room_name: image_room_name,
						emp_no: emp.emp_no,
						image_room_no: image_room_no
					},	
					success: function(message){
						//Spring과 통신되어 db에 저장이 되면 소켓 이벤트 발생
						socket.emit('create_room', {
							image_room_name: image_room_name,
							image_room_no: image_room_no,
							emp_name: emp.emp_name,
							dept_name: emp.dept_name,
							position_name: emp.position_name,
							office_name: emp.office_name
						});
						
						alert('방이 생성되었습니다.');
					}
				});
			}
		});
		
		/* 
		//페이지 이동
		location = '/canvas/' + room;
		 */
	});
});