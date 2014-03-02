var config = require('./config'),
	donuts = {},
	messages = {},
	statuses = {},
	db = require('dirty')('data.db'),

	ucfirst = function (str) { return str.charAt(0).toUpperCase() + str.substr(1); };

// set it up
db.on('load', function () {
	donuts = db.get('donuts');
	messages = db.get('messages');
	statuses = db.get('statuses');

	if (!donuts)
	{
		db.set('donuts', config.defaults);
		donuts = config.defaults;
	}
	if (!messages)
	{
		db.set('messages', config.defaultmsgs);
		messages = config.defaultmsgs;
	}
	if (!statuses)
	{
		db.set('statuses', config.defaultstatuses);
		statuses = config.defaultstatuses;
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

//
exports.getMessages = function (who) {
	return messages[who];
};
exports.leaveMessage = function (from, to, msg) {
	var d = new Date(),
		hr = (d.getHours()%12);
	if (hr == 0)
		hr = 12;
	messages[to].push((d.getMonth()+1) + '/' + d.getDate() + ' @ ' + hr + ':' + d.getMinutes() + (d.getHours() >= 12 ? 'pm' : 'am') + ' from ' + ucfirst(from) + ': ' + msg);
	db.set('messages', messages);

	return true;
};
exports.clearMessages = function (who) {
	messages[who] = [];
	db.set('messages', messages);

	return true;
};

exports.allStatuses = function () {
	return statuses;
};
exports.getStatus = function (who) {
	return statuses[who];
};
exports.setStatus = function (who, st) {
	statuses[who] = st;
	db.set('statuses', statuses);

	return true;
};

// export
exports.validUser = function (who) {
	return who in donuts;
};
exports.donuts = function (who) {
	return donuts[who];
};
exports.allDonuts = function () {
	return donuts;
};
