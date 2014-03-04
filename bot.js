var config = require('./config');

process.on('uncaughtException', function (err) {
	console.error(err.stack);
	console.log('Node NOT Exiting...');
});

// join the rooms and handle our commands
var commands = require('./commands'),
	joinRoom = function (roomid) {
	
		config.campfire.join(roomid, function (error, room) {
			console.log('Joining room ' + roomid);

			room.listen(function (message) {
				if (!message.body)
					return;
				var msg = message.body.toLowerCase(),
					sentby = message.userId,
					sender = config.users[sentby],

					content = msg.split(' ');

				// find and spawn the relevant command
				for (var i = 0; i < commands.commands.length; i++)
				{
					if (msg.substr(0, commands.commands[i][0].length + 1) == ('!' + commands.commands[i][0]))
					{
						commands.commands[i][1](room, sender, content);
					}
				}
			
			}, function () {
				joinRoom(roomid); // re-join on fail
			});
		});
	};

// kick things off
for (var roomi = 0; roomi < config.rooms.length; roomi++)
	joinRoom(config.rooms[roomi]);
