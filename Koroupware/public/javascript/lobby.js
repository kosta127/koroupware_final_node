$(document).ready(function(){
	var $hiddenDiv = $('#hiddenDiv');
	var emp;
	
	//emp 정보 셋팅
	$.ajax({
		type: 'get',
		url: 'http://192.168.0.164:8081/imageRoom/getEmp',
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
		url: 'http://192.168.0.164:8081/imageRoom/imageRoomLobby',
		success: function(data){
			$.each(data, function(index, item){
				$('<button></button>').attr({
					'data-room': item.image_room_no
				}).text('방이름: ' + item.image_room_name)
				.appendTo('#container');
			});
		}
	});
	
	//Socket 처리
	var socket = io.connect();
	
	socket.on('create_room', function(data){
		//문서 객체를 추가
		$('<button></button>').attr({
			'data-room': data.image_room_no
		}).text('방이름: ' + data.image_room_name)
		.appendTo('#container');
	});
	
	//이벤트 연결
	$('#container').on('click', 'button', function(){
		//방의 pk 변수 선언
		var room = $(this).attr('data-room');
		
		//방의 pk를 가지고 페이지 이동
		location = 'canvas?image_room_no=' + room;
	});
	
	$('#createButton').click(function(){
		$.ajax({
			type: 'get',
			url: 'http://localhost:8081/imageRoom/getRoomNo',
			success: function(image_room_no){
				//방 이름에 대한 변수 선언
				var image_room_name = $('#room').val();
				
				//ajax로 spring에 정보 보내기
				$.ajax({
					type: 'post',
					url: 'http://192.168.0.164:8081/imageRoom/imageRoomLobby',
					data: {
						image_room_name: image_room_name,
						emp_no: emp.emp_no
					},
					success: function(message){
						//Spring과 통신되어 db에 저장이 되면 소켓 이벤트 발생
						socket.emit('create_room', {
							image_room_name: image_room_name,
							image_room_no: image_room_no
						});
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