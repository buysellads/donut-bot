var config = require('./config'),
	donuts = {},
	db = require('dirty')('data.db');

// set it up
db.on('load', function () {
	donuts = db.get('donuts');

	if (!donuts)
	{
		db.set('donuts', config.defaults);
		donuts = config.defaults;
	}
});

// exchange
exports.transfer = function (from, to, n) {
	if (isNaN(n) || donuts[from] < n || n < 0)
		return false;

	donuts[from] -= n;
	donuts[to] += n;

	db.set('donuts', donuts);

	return true;
};
exports.take = function (from, n) {
	if (isNaN(n) || donuts[from] < n || n < 0)
		return false;

	donuts[from] -= n;
	db.set('donuts', donuts);

	return true;
};
exports.give = function (to, n) {
	if (isNaN(n) || n < 0)
		return false;

	donuts[to] += n;
	db.set('donuts', donuts);

	return true;
};

// exposure
exports.validUser = function (who) {
	return who in donuts;
};
exports.donuts = function (who) {
	return donuts[who];
};
exports.allDonuts = function () {
	return donuts;
};
