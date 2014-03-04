var config = require('./config'),
	readline = require('readline'),
	commands = require('./commands');

// use readline to provide a chat prompt, running the commands like bot.js does as they come in
var rl = readline.createInterface(process.stdin, process.stdout);

// stub the Campfire environment
var userid = 0,
	room = {
		id: 123,
		speak: function(d) {
			console.log("\n" + d);
			rl.prompt();
		},
		paste: function(d) {
			console.log("\n" + d);
			rl.prompt();
		},
	};

// let's go
rl.setPrompt('chat> ');
rl.prompt();
rl.on('line', function(line) {

	var msg = line.toLowerCase(),
		sentby = userid,
		sender = config.users[sentby],

		content = msg.split(' ');

	// handle a special !user command to set who is talking to allow multi-user interactions
	if (msg.substr(0, 5) == '!user') {
		userid = content[1];
		if (!config.users[userid]) {
			console.log('Invalid user specified');
		} else {
			rl.setPrompt(config.users[userid] + '> ');
		}
	} else if (!sender) {
		console.log('You must !user a user ID before chatting.');
	} else {
		for (var i = 0; i < commands.commands.length; i++) {
			if (msg.substr(0, commands.commands[i][0].length + 1) == ('!' + commands.commands[i][0])) {
				commands.commands[i][1](room, sender, content);
			}
		}
	}
	rl.prompt();
}).on('close', function() {
	process.exit(0);
});