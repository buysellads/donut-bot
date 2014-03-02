// setup campfire module and specify the accounts
var Campfire = require('campfire').Campfire;

exports.campfire = new Campfire({
	ssl: true,
	token: '[API token]',
	account: '[account subdomain]'
});

exports.rooms = [123, 456, 789];

exports.users = {
	123: 'nathan',
	456: 'person2',
	789: 'person3'
};
exports.defaults = {
	'nathan': 1000,
	'person2': 1000,
	'person3': 1000
};
