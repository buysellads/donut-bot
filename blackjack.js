var self = {

	// technically we should be making a new Blackjack() for every room; but because of the way the commands API works, this is just easier (boo)
	wagers: {},
	// the deck and dealer's shown card by room
	deck: {},
	housecard: {},

	bet: function(room, who, amount) {
		// take the bet (which is room-specific). unlike roulette, we ADD their bet instead of adding a new bet.
		var wagers = self.getWagers(),
			wager = self.getWager(room, who);
		if (wager >= 0) {
			self.wagers[room][wager][1] += amount;
		} else {
			self.wagers[room].push([who, amount, [], false]); // who, amount, cards, stand
		}
	},
	hasWagers: function(room) {
		return self.wagers[room] && self.wagers[room].length > 0;
	},
	getWagers: function(room) {
		return self.wagers[room] || [];
	},
	getWager: function(room, who) {
		self.wagers[room] = self.wagers[room] || [];

		for (var i = 0; i < self.wagers[room].length; i++) {
			if (self.wagers[room][i][0] == who) {
				return i;
			}
		}
		return -1;
	},
	endGame: function(room) {
		self.wagers[room] = [];
		self.deck[room] = null;
		self.housecard[room] = null;
	},

	inGame: function(room) {
		return self.deck[room] != null;
	},
	hasPlayer: function(room, who) {
		var i = self.getWager(room, who);
		return i >= 0 && self.getHandTotal(room, who) <= 21 && !self.wagers[room][i][3];
	},
	hasPlayersLeft: function(room) {
		var wagers = self.getWagers(room);
		for (var i = 0; i < wagers.length; i++) {
			if (self.getHandTotal(room, wagers[i][0]) <= 21 && !wagers[i][3]) {
				return true;
			}
		}
		return false;
	},

	// some static (non-room specific) deck-related functions 
	ChooseCard: function(deck, who) {
		var i;
		do {
			i = Math.floor(Math.random() * deck.length);
		} while (typeof(deck[i]) !== 'undefined');

		deck[i] = who; // mark it as taken
		return i;
	},
	ShowCard: function(cardnum) {
		var numeral = cardnum % 13,
			suit = Math.floor((cardnum / 13)) % 4;
		var suits = ['♠', '♥', '♣', '♦'],
			numerals = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 'T', 'J', 'Q', 'K'];

		return numerals[numeral] + suits[suit];
	},
	CalculateHandTotal: function(cards) {

		// since only ONE ace can be hard, we just need to detect the presence of one to be able optionally +10
		var hasace = false,
			total = 0;
		for (var i = 0; i < cards.length; i++) {
			var cardvalue = Math.min(cards[i] % 13 + 1, 10);

			total += cardvalue;
			if (cardvalue == 1) {
				hasace = true;
			}
		}

		// if we have an ace, we can add 10 as long as we don't go over (1 was already counted for the ace)
		return hasace && (total + 10) <= 21 ? total + 10 : total;
	},
	OutputHand: function(cards) {
		var names = [];
		for (var i = 0; i < cards.length; i++) {
			names.push(self.ShowCard(cards[i]));
		}
		return names.join(' ');
	},

	//
	initDeck: function(room) {

		if (self.inGame(room)) return;

		// initialize with an extremely favorable 1-deck shoe for now (if we run out of cards, make this 104)
		self.deck[room] = new Array(52);

		// choose a random card for the house (we'll pick the other one later... random is random), and two for each user
		self.housecard[room] = self.ChooseCard(self.deck[room], 'house');

		var wagers = self.getWagers(room);
		for (var i = 0; i < wagers.length; i++) {
			wagers[i][2] = [self.ChooseCard(self.deck[room], wagers[i][0]), self.ChooseCard(self.deck[room], wagers[i][0])];
			if (self.CalculateHandTotal(wagers[i][2]) == 21)
				wagers[i][3] = true; // auto-stand on blackjack
		}

		return self.housecard[room];
	},
	// return the best possible hand from the cards that who has in room
	getHandTotal: function(room, who) {
		var i = self.getWager(room, who),
			wager = self.getWagers(room)[i];
		return self.CalculateHandTotal(wager[2]);
	},
	showPlayerHand: function(room, who) {
		var i = self.getWager(room, who),
			wager = self.getWagers(room)[i];
		return self.OutputHand(wager[2]);
	},
	hit: function(room, who) {
		var i = self.getWager(room, who),
			wager = self.getWagers(room)[i];

		var newcard = self.ChooseCard(self.deck[room], wager[0]);
		wager[2].push(newcard);

		return newcard;
	},
	double: function(room, who) {
		var i = self.getWager(room, who),
			wager = self.getWagers(room)[i];

		wager[1] *= 2; // double the bet
		var newcard = self.ChooseCard(self.deck[room], wager[0]);
		wager[2].push(newcard);

		wager[3] = true; // force-stand
		return newcard;
	},
	stand: function(room, who) {
		var i = self.getWager(room, who),
			wager = self.getWagers(room)[i];

		wager[3] = true; // stand
	},

	dealOut: function(room) {
		var dealer = [self.housecard[room]];

		while (self.CalculateHandTotal(dealer) < 17) {
			dealer.push(self.ChooseCard(self.deck[room], 'house'));
		}

		return dealer;
	},
};

module.exports = self;