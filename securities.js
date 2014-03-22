var secdb = require('dirty')('securities.db');

/*
	All stocks have exactly 100 shares available.

	DB Schema:
	db = {
		securities: {
			41: {
				name: 'PureCSS', earnings: 1500,
				lastprice: 200,
				holdings: { 'nathan': [180, 50], 'todd': [200, 25] },
				orders: { 'nathan': [190, 10, 'buy'] }
			}
		],
 */

var self = {

	DIVRATE: 0.25,

	//
	data: null,
	_securities: null,
	get: function(force) {
		if (!self._securities || force) {
			self._securities = secdb.get('securities') || {};
		}
		return self._securities;
	},
	save: function() {
		secdb.set('securities', self._securities);
	},

	placeOrder: function(who, id, type, price, shares) {
		var sec = self.get();

		if (!sec[id]) return false;
		if (sec[id].orders[who]) return false;

		sec[id].orders[who] = [shares, price, type];

		self.save();

		return true;
	},
	cancelOrder: function(who, id) {
		var sec = self.get();

		if (!sec[id]) return false;
		if (!sec[id].orders[who]) return false;

		delete sec[id].orders[who];
		self.save();

		return true;
	},
	fulfillOrder: function(id, who, type, shares, price) {
		var sec = self.get();
		
		if (type == 'buy') {
			if (!self.data.take(who, shares * price)) {
				delete sec[id].orders[who];
				return false;
			}
			if (!sec[id].holdings[who]) {
				sec[id].holdings[who] = [shares, price];
			} else {
				// weighted average the price
				var curshares = sec[id].holdings[who][0],
					curprice = sec[id].holdings[who][1];
				sec[id].holdings[who] = [curshares + shares, Math.floor((price * shares + curshares * curprice) / (curshares + shares))];
			}
		} else if (type == 'sell') {
			self.data.give(who, shares * price);
			sec[id].holdings[who][0] -= shares;
			if (sec[id].holdings[who][0] == 0) delete sec[id].holdings[who];
		}

		var sec = self.get();

		if (!sec[id].orders[who]) return false;
		sec[id].orders[who][0] -= shares;
		sec[id].lastprice = price;
		if (sec[id].orders[who][0] == 0) delete sec[id].orders[who];

		return who + ' had an order executed for #' + id + ': ' + type + ' ' + shares + ' at ' + price;
	},
	fulfillOrders: function(id, ret) {
		ret = ret || []; // we run this recursively so it doesn't "double match" orders. as in, when an order matches, process it and start over.
		var sec = self.get();

		if (sec[id]) {
			for (var orderer in sec[id].orders) {
				var shares = sec[id].orders[orderer][0],
					askingprice = sec[id].orders[orderer][1],
					trantype = sec[id].orders[orderer][2],
					dividend = Math.round(sec[id].earnings * self.DIVRATE);

				// go through other orders and see if anyone has a matching price
				for (var matcher in sec[id].orders) {
					if (matcher == orderer) continue;
					var matchshares = sec[id].orders[matcher][0],
						matchprice = sec[id].orders[matcher][1],
						matchtype = sec[id].orders[matcher][2];

					if (trantype == matchtype) continue;

					// match if buying for MORE than someone is selling for, or selling for LESS than someone is buying for.
					if ((trantype == 'buy' && askingprice >= matchprice) || (trantype == 'sell' && askingprice <= matchprice)) {
						// now transact at the lesser of the two shares, at the median price
						var actualshares = Math.min(matchshares, shares),
							actualprice = Math.floor((askingprice + matchprice) / 2);

						// MUST check the seller's shares first, but then handle the "buy" first in case they can't afford it.
						var buyer, seller;
						if (trantype == 'buy') {
							buyer = orderer;
							seller = matcher;
						} else {
							buyer = matcher;
							seller = orderer;
						}

						//
						var sellerholdings = sec[id].holdings[seller] || [0, 0];
						if (sellerholdings[0] < actualshares) {
							ret.push(seller + ', you do not have ' + actualshares + ' shares to execute on #' + id + ' - order cancelled!');
							delete sec[id].orders[seller];
							return self.fulfillOrders(id, ret);
						}

						// 
						var bought = self.fulfillOrder(id, buyer, 'buy', actualshares, actualprice);
						if (bought === false) {
							ret.push(buyer + ', you do not have ' + (actualshares * actualprice) + ' donuts to execute on #' + id + ' - order cancelled!');
							return self.fulfillOrders(id, ret);
						}

						// all good? log it and let's keep going
						ret.push(bought);
						ret.push(self.fulfillOrder(id, seller, 'sell', actualshares, actualprice));

						return self.fulfillOrders(id, ret);
					}
				}

				// now donut bot gets the scraps. donut bot will always sell at prices BELOW 5% yield, and buy ABOVE 20% yield.
				// example: a security has 1500 in earnings, so the divdiend is 225 donuts for the total cap
				// if someone tries to SELL shares at LESS than 11 (225/0.20/100) donuts per share, donut bot will gladly buy them from them.
				// similarly, if someone tries to BUY shares at MORE than 45 (225/0.05/100), donut bot will gladly sell what shares it can to them.
				if (trantype == 'buy' && askingprice >= (dividend / 0.05 / 100)) {
					var inst = 100;
					for (var holder in sec[id].holdings) {
						inst -= sec[id].holdings[holder][0];
					}
					shares = Math.min(shares, inst);
					if (shares > 0) {
						var bought = self.fulfillOrder(id, orderer, trantype, shares, askingprice);
						if (bought === false) {
							ret.push(orderer + ', you do not have ' + (shares * askingprice) + ' donuts to execute on #' + id + ' - order cancelled!');
						} else {
							ret.push('Donut Bot has sold ' + orderer + ' shares in #' + id + ' for ' + askingprice);
							ret.push(bought);
						}

						return self.fulfillOrders(id, ret);
					}
				} else if (trantype == 'sell' && askingprice <= (dividend / 0.20 / 100)) {
					var sellerholdings = sec[id].holdings[orderer] || [0, 0];
					if (sellerholdings[0] < shares) {
						ret.push(orderer + ', you do not have ' + shares + ' shares to execute on #' + id + ' - order cancelled!');
						delete sec[id].orders[orderer];
					} else {
						ret.push('Donut Bot has bought ' + orderer + '\'s shares in #' + id + ' at ' + askingprice);
						ret.push(self.fulfillOrder(id, orderer, trantype, shares, askingprice));
					}
					return self.fulfillOrders(id, ret);
				}
			}
		}
		// if something happened, save it to disk.
		if (ret.length) self.save();
		return ret;
	},

	//
	setEarnings: function(data) {
		var ret = [];

		var sec = self.get(true);

		// expecting data = [[41,'purecss',1500],[123,'fake',20000]]
		for (var i = 0; i < data.length; i++) {
			if (data[i].length < 3) continue;

			if (!sec[data[i][0]]) sec[data[i][0]] = {
				name: '',
				earnings: 0,
				orders: {},
				holdings: {},
			};
			sec[data[i][0]].name = data[i][1];
			sec[data[i][0]].earnings = data[i][2];

			ret.push(data[i][0]);
		}
		self.save();

		return ret;
	},
	payDividends: function(multiple) {
		var ret = [];
		var sec = self.get(true);
		for (var id in sec) {
			for (var holder in sec[id].holdings) {
				var shares = sec[id].holdings[holder][0],
					div = Math.round(sec[id].earnings * self.DIVRATE * multiple * (shares / 100));

				self.data.give(holder, div);
				ret.push(holder + ' has received a ' + div + ' donut dividend for #' + id);
			}
		}
		return ret.join("\n");
	},

	//
	listAll: function() {
		var ret = [];

		var sec = self.get();
		for (var id in sec) {
			ret.push('#' + id + ': ' + sec[id].name);
		}

		return ret.join("\n");
	},
	listHoldings: function(who, worthref) {
		var ret = [];

		worthref = worthref || {};
		worthref.value = 0;

		var sec = self.get();
		for (var id in sec) {
			for (var holder in sec[id].holdings) {
				if (holder == who) {
					var shares = sec[id].holdings[holder][0],
						bookprice = sec[id].holdings[holder][1],
						marketprice = sec[id].lastprice,
						bookvalue = bookprice * shares,
						marketvalue = marketprice * shares,
						pl = marketvalue - bookvalue;
					ret.push('#' + id + ': ' + shares + ' shares in ' + sec[id].name + ' (book value: ' + bookvalue + ', market value: ' + marketvalue + ', unrealized gain/loss: ' + pl + ')');
					worthref.value += marketvalue;
					break;
				}
			}
		}

		return ret.join("\n");
	},
	listOrders: function(who) {
		var ret = [];

		var sec = self.get();
		for (var id in sec) {
			for (var orderer in sec[id].orders) {
				if (orderer == who) {
					var shares = sec[id].orders[orderer][0],
						askingprice = sec[id].orders[orderer][1],
						trantype = sec[id].orders[orderer][2]; // buy/sell
					ret.push('#' + id + ': ' + sec[id].name + ' (' + trantype + ' ' + shares + ' at ' + askingprice + ')');
					break;
				}
			}
		}

		return ret.join("\n");
	},

	getQuote: function(id) {
		var ret = [];

		var sec = self.get(),
			security = sec[id] || {},
			price = security.lastprice || 0,
			cap = price * 100,
			inst = 100,
			eps = Math.floor(security.earnings / 100),
			pe = Math.floor(10 * price / eps) / 10,
			dividends = Math.round(security.earnings * self.DIVRATE) / 100,
			divyield = Math.floor(1000 * dividends / price) / 10;

		for (var holder in security.holdings) {
			inst -= security.holdings[holder][0];
		}

		ret.push('#' + id + ': ' + security.name);
		ret.push("\t" + 'Last Trade: ' + price + ', Market Cap: ' + cap + ', Institutional Ownership: ' + inst + '%');
		ret.push("\t" + 'Earnings: ' + security.earnings + ', EPS: ' + eps + ', PE: ' + pe);
		ret.push("\t" + 'Dividends: ' + dividends + ', Dividend Yield: ' + divyield + '%');
		ret.push("\t" + 'Open Orders:');
		for (var orderer in security.orders) {
			var shares = security.orders[orderer][0],
				askingprice = security.orders[orderer][1],
				trantype = security.orders[orderer][2];
			ret.push("\t\t" + trantype + ' ' + shares + ' at ' + askingprice);
		}

		return ret.join("\n");
	},

};

module.exports = self;