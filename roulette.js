var self = {

	// technically we should be making a new Roulette() for every room; but because of the way the commands API works, this is just easier (boo)
	wagers: {},
	bet: function(room, who, amount, type) {
		// take the bet (which is room-specific)
		self.wagers[room] = self.wagers[room] || [];
		self.wagers[room].push([who, amount, type]);
	},
	hasWagers: function(room) {
		return self.wagers[room] && self.wagers[room].length > 0;
	},
	endGame: function(room) {
		var x = self.wagers[room];
		self.wagers[room] = [];
		return x;
	},


	// some static (non-room-based) functions
	ValidateWager: function(type) {
		var straight = parseInt(type, 10) || 0;

		return (type == 'red' || type == 'black' || type == 'lo' | type == 'hi' || type == 'even' || type == 'odd' || type == '0' || (straight >= 1 && straight <= 36));

	},
	CalculatePayout: function(type, amount) {
		var straight = parseInt(type, 10) || 0;

		return (type == '0' || (straight > 0 && straight < 36)) ? amount * 35 : amount;
	},

	// TODO: refactor this to actually calculate the winners and just return the winners+result so we don't need to expose wagers publicly.
	spin: function() {
		return Math.floor(Math.random() * 37);
	},
	winners: function(result) {
		return {
			red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].indexOf(result) != -1,
			black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].indexOf(result) != -1,
			even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36].indexOf(result) != -1,
			odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35].indexOf(result) != -1,
			lo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].indexOf(result) != -1,
			hi: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36].indexOf(result) != -1
		};
	},
};

module.exports = self;
