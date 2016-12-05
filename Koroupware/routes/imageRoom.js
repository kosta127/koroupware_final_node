exports.lobby = function(req, res){
	req.session.emp_no = req.query.emp_no;
	
	res.render('lobby',{
		"emp_no": req.session.emp_no
	});
};

exports.canvas = function(req, res){
	res.render('canvas',{
		"emp_no": req.session.emp_no,
		"image_room_no": req.query.image_room_no
	});
}


/*
exports.login = function(req, res){
	res.render('login');
}

exports.test = function(req, res){
	res.render('test', {
		"emp_no": req.session.emp_no,
		"image_room_no": req.query.image_room_no
	});
}
*/



















