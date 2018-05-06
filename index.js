/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var usermodel = require('./user.js').getModel();
var crypto = require('crypto');
var Io = require('socket.io');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var fs = require('fs');

/* The http module is used to listen for requests from a web browser */
var http = require('http');

/* The path module is used to transform relative paths to absolute paths */
var path = require('path');

/* Creates an express application */
var app = express();

/* Creates the web server */
var server = http.createServer(app);

/* creates the socket server */
var io = Io(server);

/* Defines what port to use to listen to web requests */
var port =  process.env.PORT ? parseInt(process.env.PORT) : 8080;

var dbAddress = process.env.MONGODB_URI || 'mongodb://127.0.0.1/game';

function addSockets() {
	io.on('connection', (socket) => {
		//io.emit('new message', 'user connected')
		socket.on('disconnect', () => {
		//io.emit('new message', 'user disconnect');
		});
		socket.on('message', (message) => {
			io.emit('newMessage', message);
		})
	});
}

function startServer() {
	addSockets();

	function authenticateUser(username, password, callback) {
		if(!username) return callback('No username provided');
		if(!password) return callback('No password provided');
		usermodel.findOne({userName: username}, function(err, user) {
			if(err) return callback('Error in getting user from database');
			if(!user) return callback('Username does not exist');
			crypto.pbkdf2(password, user.salt, 10000, 256, 'sha256', function(err, hash) {
				if(err) return callback('Error hashing password');
				if(user.password !== hash.toString('base64')) return callback('Wrong Password');
				callback(null, user);
			});

		})
}

	app.use(bodyParser.json({ limit: '16mb' }));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(session({ secret: '🌸🦋🌸🦋🌸🦋🌸'}));
	app.use(passport.initialize());
	app.use(passport.session());

	passport.use(new LocalStrategy({usernameField: 'userName', passwordField: 'password'}, authenticateUser));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	})

	passport.deserializeUser(function(id, done) {
		usermodel.findById(id, function(err, user) {
			done(err, user);
		})
	})


	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080  _  */

	app.get('/game', (req, res, next) => {
		if(!req.user) return res.redirect('/login?error=You%20have%20to%20log%20in!');
		var filePath = path.join(__dirname, './game.html');
		var fileContents = fs.readFileSync(filePath, 'utf8');
		fileContents = fileContents.replace('{{USER}}', req.user.userName);
		res.send(fileContents);

	});

	app.get('/login', (req, res, next) => {
		var filePath = path.join(__dirname, './login.html')
		res.sendFile(filePath);
	})

	app.post('/login', (req, res, next) => {

			passport.authenticate('local', function(err, user) {
				if(err) return res.send({error: err});

				req.logIn(user, (err) => {
					if(err) return res.send({error: err});
					return res.send({error: null})
				})
			})(req, res, next);


		});

	app.get('/logout', (req, res, next) => {
		req.logOut();
		res.redirect('/login?error=You%20have%20logged%20out.')
	})

	app.get('/form', (req, res, next) => {

		var filePath = path.join(__dirname, './index.html')
		res.sendFile(filePath);
	});

	app.post('/form', (req, res, next) => {
	  var newuser = new usermodel(req.body);
		var password = req.body.password;
		var salt = crypto.randomBytes(128).toString('base64');
		newuser.salt = salt;
		var iterations = 10000;
		crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
			if(err) {
				return res.send({error: err});
			}
			newuser.password = hash.toString('base64');
			newuser.save(function(err) {
				// Handling the duplicate key errors from database
				if(err && err.message.includes('duplicate key error') && err.message.includes('userName')) {
					return res.send({error: 'Username, ' + req.body.userName + ' already taken'})
				}
				if(err) {
					return res.send({error: err.message})
				}

				passport.authenticate('local', function(err, user) {
					if(err) return res.send({error: err});

					req.logIn(user, (err) => {
						if(err) return res.send({error: err});
						return res.send({error: null})
					})
				})(req, res, next);
			});
		});
	});

	/* Defines what function to all when the server recieves any request from http://localhost:8080 */
	server.on('listening', () => {

		/* Determining what the server is listening for */
		var addr = server.address()
			, bind = typeof addr === 'string'
				? 'pipe ' + addr
				: 'port ' + addr.port
		;

		/* Outputs to the console that the webserver is ready to start listenting to requests */
		console.log('Listening on ' + bind);
	});

	/* Tells the server to start listening to requests from defined port */
	server.listen(port);
};

mongoose.connect(dbAddress, startServer)