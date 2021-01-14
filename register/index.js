var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var fs = require('fs');
const cookieParser = require('cookie-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS in case you need
app.use((req, res, next) => {
	res.set('Access-Control-Allow-Origin', 'https://chat.antentafm.ddnss.de'); // this is the rocket.chat URL
	res.set('Access-Control-Allow-Credentials', 'true');

	next();
});

// this is the endpoint configured as API URL
app.post('/sso', function (req, res) {

	axios.post('https://chat.antentafm.ddnss.de/api/v1/logout'
	).then(function() {
		console.log('sso logout');
	}).catch(function (error) {
		console.log('sso error');
	});

	// add your own app logic here to validate user session (check cookies, headers, etc)

	// if the user is not already logged in on your system, respond with a 401 status
	var notLoggedIn = true;
	if (notLoggedIn) {
		return res.sendStatus(401);
	}

	// you can save the token on your database as well, if so just return it
	// MongoDB - services.iframe.token
	var savedToken = null;
	if (savedToken) {
		return res.json({
			token: savedToken
		});
	}

	// if dont have the user created on rocket.chat end yet, you can now create it
	var currentUsername = null;
	if (!currentUsername) {
		axios.post('https://chat.antentafm.ddnss.de/api/v1/users.register', {
			username: 'new-user',
			email: 'mynewuser@email.com',
			pass: 'new-users-passw0rd',
			name: 'New User'
		}).then(function (response) {

			// after creation you need to log the user in to get the `authToken`
			if (response.data.success) {
				return axios.post('https://chat.antentafm.ddnss.de/api/v1/login', {
					username: 'new-user',
					password: 'new-users-passw0rd'
				});
			}
		}).then(function (response) {
			if (response.data.status === 'success') {
				res.json({
					loginToken: response.data.data.authToken
				});
			}
		}).catch(function (error) {
			res.sendStatus(401);
		});
	} else {

		// otherwise create a rocket.chat session using rocket.chat's API
		axios.post('https://chat.antentafm.ddnss.de/api/v1/login', {
			username: 'username-set-previously',
			password: 'password-set-previously'
		}).then(function (response) {
			if (response.data.status === 'success') {
				res.json({
					loginToken: response.data.data.authToken
				});
			}
		}).catch(function() {
			res.sendStatus(401);
		});
	}
});

// just render the form for the user authenticate with us
app.get('/login', function (req, res) {
	res.set('Content-Type', 'text/html');
	fs.createReadStream('login.html').pipe(res);
});

// receives login information
app.post('/login', function (req, res) {

	console.log('login');
	
	if ('body' in req){
		if ('username' in req['body']) {
			// all required input is available
		} else  {
			console.log('login data not parsed');
			res.sendStatus(401);
		}
	}
	
	const username_input = req['body']['username'];
	var password_input = '';
	if ('password' in req['body']) {
		password_input = req['body']['password'];
	}

	if (password_input == '') {
		password_input = 'radio'
	}
	
	console.log('login username: ', username_input);
	//console.log('login password: ', password_input);
	
	axios.post('https://chat.antentafm.ddnss.de/api/v1/users.register', {
		username: String(username_input),
		email: String(username_input) + '@no.email.com',
		pass: String(password_input),
		name: String(username_input)
	}).then(function(response) {
		console.log('login register new user: ', username_input);
	}).catch(function(response) {
		console.log('login user already exists: ', username_input);
	});
	
	axios.post('https://chat.antentafm.ddnss.de/api/v1/login', {
		username: String(username_input),
		password: String(password_input)
	}).then(function(response) {
		if (response.data.status === 'success') {
			console.log('login user: ', username_input);
			// since this endpoint is loaded within the iframe, we need to communicate back to rocket.chat using `postMessage` API
			res.set('Content-Type', 'text/html');
			res.send(`<script>
			window.parent.postMessage({
				event: 'login-with-token',
				loginToken: '${ response.data.data.authToken }'
			}, 'https://chat.antentafm.ddnss.de'); // rocket.chat's URL
			</script>`);
		}
	}).catch(function (error) {
		console.log('login user failed: ', username_input);
	});
});

app.listen(3030, function () {
  console.log('Example app listening on port 3030!');
});
