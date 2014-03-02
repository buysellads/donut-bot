// set up our data store
var config = require('./config'),
	data = require('./data'),
	ucfirst = function (str) { return str.charAt(0).toUpperCase() + str.substr(1); },
	wagers = {}; // roulette bets

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
	['roulette', function (room, sender, bet) {

		var amount = parseInt(bet[1], 10) || 0,
			type = bet[2] || 'none',
			straight = parseInt(type, 10) || 0;
		if (type != 'red' && type != 'black' && type != 'lo' && type != 'hi' && type != 'even' && type != 'odd'
			&& type != '0' && (straight < 1 || straight > 36))
			room.speak(ucfirst(sender) + ': The only wagers I take are even/odd, lo/hi, red/black, or straight-up');
		else
		{
			if (!data.take(sender, amount))
				room.speak(ucfirst(sender) + ', you do not have ' + amount + ' donuts to give');
			else
			{
				// take the bet (which is room-specific)
				wagers[room.id] = wagers[room.id] || [];
				wagers[room.id].push([sender, amount, type]);

				var payout = (type == '0' || (straight > 0 && straight < 36)) ? amount * 35 : amount;

				room.speak(ucfirst(sender) + ' has placed a ' + amount + ' donut wager on ' + type + ' to win '
					+ payout + ' donuts. Type !spin to spin the wheel!');
			}
		}

	} ],
// !spin
	['spin', function (room) {

		// grab a number between 0 to 36 inclusive, and then test (explicitly!) for what bets win
		var result = Math.floor(Math.random() * 37),
			winners = {
				red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].indexOf(result) != -1,
				black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].indexOf(result) != -1,
				even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36].indexOf(result) != -1,
				odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35].indexOf(result) != -1,
				lo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].indexOf(result) != -1,
				hi: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36].indexOf(result) != -1
			};

		// only do this if there are wagers
		if (wagers[room.id] && wagers[room.id].length > 0)
		{
			room.speak('The roulette wheel has spoken! The result: ' + result
					+ (result > 0 ? (winners.red ? ' red' : ' black') : ''));
			for (var i = 0; i < wagers[room.id].length; i++)
			{
				var wager = wagers[room.id][i],
					sender = wager[0],
					amount = wager[1],
					type = wager[2];

				// handle the non-int version first to avoid everyone winning when result == 0
				if (winners[type])
				{
					data.give(sender, amount + amount * 1);
					room.speak('    ' + ucfirst(sender) + ' wins ' + amount + ' donuts!');
				}
				else if (parseInt(type, 10) == result)
				{
					data.give(sender, amount + amount * 35);
					room.speak('    ' + ucfirst(sender) + ' wins ' + (amount * 35) + ' donuts!!');
				}
			}

			wagers[room.id] = []; // clear it
		}
	} ]
];
