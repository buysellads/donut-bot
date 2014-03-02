// set up our data store
var config = require('./config'),
	data = require('./data'),
	ucfirst = function (str) { return str.charAt(0).toUpperCase() + str.substr(1); },
	roulette = require('./roulette');

exports.commands = [

// basics:

// !help
	['help', function (room) {
		room.paste("Hello! I'm a Donut Bot! Some commands you may find useful:\n\n"
			+ "\t!give N who\n\t\tGive N donuts to the user specified, e.g. !give 100 Nathan\n"
			+ "\t!donuts\n\t\tSee how many donuts you have\n"
			+ "\t!leaderboard\n\t\tSee how many donuts everyone has\n"
			+ "\t!roulette N bet\n\t\tBet N donuts on the roulette table, e.g. !roulette 10 red or !roulette 5 14\n"
			+ "\t!spin\n\t\tOnce all bets are in, spin the roulette wheel\n"
			+ "\t!m who msg\n\t\tLeave a message for someone.\n"
			+ "\t!w\n\t\tPull up your messages (w, as-in what'd I miss?) - this will clear your messages\n"
			+ "\t!status msg\n\t\tSet your current status (leave blank to clear)\n"
			+ "\t!team\n\t\tList everyone's current status\n"
			+ "\nDo not expect real donuts out of this.");
	} ],

// !give N touser
	['give', function (room, sender, give) {
		var amount = parseInt(give[1], 10) || 0,
			who = give[2];

		if (amount == 0)
			;
		else if (!data.validUser(who))
			room.speak('I\'m sorry, I don\'t recognize ' + ucfirst(who));
		else
		{
			if (!data.transfer(sender, who, amount))
				room.speak(ucfirst(sender) + ', you do not have ' + amount + ' donuts to give');
			else
				room.speak(ucfirst(sender) + ' has given ' + amount + ' donuts to ' + ucfirst(who));
		}
	} ],

// !donuts
	['donuts', function (room, sender) {

		var n = data.donuts(sender);
		room.speak(ucfirst(sender) + ': You have ' + n + ' donuts');
	} ],

// !leaderboard
	['leaderboard', function (room) {
		var donuts = data.allDonuts(),
			users = [];
		
		for(var user in donuts)
			users.push([user, donuts[user]]);

		users.sort(function(a,b) { return b[1] - a[1]; });

		var ret = "Current Leaderboard:\n";
		for(var user in users)
			ret += "\t" + ucfirst(users[user][0]) + ': ' + users[user][1] + "\n";
		
		room.paste(ret);
	} ],

// gambling:
	// !roulette N [red|black|even|odd|hi|lo|#]
	['roulette', function(room, sender, bet) {

		var amount = parseInt(bet[1], 10) || 0,
			type = bet[2] || 'none';

		if (!roulette.ValidateWager(type)) {
			room.speak(ucfirst(sender) + ': The only wagers I take are even/odd, lo/hi, red/black, or straight-up');
		} else {
			if (!data.take(sender, amount)) {
				room.speak(ucfirst(sender) + ', you do not have ' + amount + ' donuts to give');
			} else {
				roulette.bet(room.id, sender, amount, type);

				room.speak(ucfirst(sender) + ' has placed a ' + amount + ' donut wager on ' + type + ' to win ' + roulette.CalculatePayout(type, amount) + ' donuts. Type !spin to spin the wheel!');
			}
		}

	}],
	// !spin
	['spin', function(room) {

		// grab a number between 0 to 36 inclusive, and then test (explicitly!) for what bets win
		var result = roulette.spin(),
			winners = roulette.winners(result);

		// only do this if there are wagers
		if (roulette.hasWagers(room.id)) {
			room.speak('The roulette wheel has spoken! The result: ' + result + (result > 0 ? (winners.red ? ' red' : ' black') : ''));

			var wagers = roulette.endGame(room.id);
			for (var i = 0; i < wagers.length; i++) {
				var wager = wagers[i],
					sender = wager[0],
					amount = wager[1],
					type = wager[2];

				// handle the non-int version first to avoid everyone winning when result == 0
				if (winners[type]) {
					data.give(sender, amount + amount * 1);
					room.speak('    ' + ucfirst(sender) + ' wins ' + amount + ' donuts!');
				} else if (parseInt(type, 10) == result) {
					data.give(sender, amount + amount * 35);
					room.speak('    ' + ucfirst(sender) + ' wins ' + (amount * 35) + ' donuts!!');
				}
			}
		}
	}],

	// messaging
	// !m who msg
	['m', function(room, sender, give) {
		var who = give[1],
			msg = give.slice(2).join(' ');

		if (msg.length == 0);
		else if (!data.validUser(who)) room.speak('I\'m sorry, I don\'t recognize ' + ucfirst(who));
		else {
			data.leaveMessage(sender, who, msg);
			if (data.getStatus(who)) room.speak('Message saved. ' + ucfirst(who) + '\'s current status is: ' + data.getStatus(who));
		}
	}],
	// !w
	['w', function(room, sender, give) {

		var msgs = data.getMessages(sender);
		if (!msgs.length) room.speak('You do not have any messages at this time, ' + ucfirst(sender));
		else {
			data.clearMessages(sender);

			room.paste('Messages for ' + ucfirst(sender) + "\n\t" + msgs.join("\n\t"));
		}
	}],

	// !team
	['team', function(room) {
		var statuses = data.allStatuses(),
			users = [];

		for (var user in statuses)
			users.push([user, statuses[user]]);

		users.sort(function(a, b) {
			return b[1] - a[1];
		});

		var ret = "Current Statuses:\n";
		for (var user in users)
			if (users[user][1].length) ret += "\t" + ucfirst(users[user][0]) + ': ' + users[user][1] + "\n";

		room.paste(ret);
	}],

	// !status what
	['status', function(room, sender, give) {
		var st = give.slice(1).join(' ') || '';

		data.setStatus(sender, st);
	}],
];
