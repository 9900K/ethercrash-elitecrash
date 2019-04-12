// GAME SETTINGS
var cashout = 425; //WILL AUTO CASHOUT AT THIS NUMBER IF HASNT DONE ALREADY
var basebet = 75; //FIRST BET WILL BE IN THIS RANGE
var maxbet = 250; //WILL NOT EXEED THIS BET
var divide = 15; //BET IS PREVIOUS GAMES TOTAL BETS DIVIDED BY THIS NUMBER
var lowbetthresh = 50000; //CASHOUT IF TOTAL BETS ARE LOWER THAN THIS AT THE START
var highestplayerpercent = 100; // CASHOUT IF HIGHEST PLAYERS BET IS X PERCENT OF THE TOTAL

var blacklist = ['Clip', 'vano27042'];

//WITHDRAW SETTINGS
var TargetBits = 3500; //WILL CASHOUT EVERYTHING OVER THIS AMOUNT
var password = ''; //PASSWORD FOR THE WITHDRAW
var vault = 'exchangebot'; //ACCOUNT TO WITHDRAW TO

// RANDOM BET MULTIPLIERS
var highmultiplyer = 0.4;
var lowmultiplyer = 1.4;

// GAME VARIABLES
var playerbets = [];
var cashedoutbets = 0;
var ingame = 0;
var withdrawn = Number(0);
var remaining = Number(0);
var currentBalance = (engine.getBalance() / 100) - withdrawn;
var firstGame = true;
var withdrawn = Number(0);
var currentBalance = (engine.getBalance() / 100) - withdrawn;

var totalethos = 0;
var highestbet = 0;
var lastmax = 0;
var first = 0;

function precisionRound(number, precision) {
	var factor = Math.pow(10, precision);
	return Math.round(number * factor) / factor;
}



engine.on('game_starting', function(data) {
	if (lastmax >= maxbet) {
		basebet = maxbet;
	} else {
		if (lastmax == 0) {

		} else {
			basebet = lastmax;
		}
	}
	currentBalance = (engine.getBalance() / 100) - withdrawn;
	betlow = Math.round(basebet / lowmultiplyer);
	bethigh = Math.round(basebet * highmultiplyer);
	bet = Math.floor((Math.random() * bethigh) + betlow);
	first = 1;
	bet = bet * 100;
	currentBalance = (engine.getBalance() / 100) - withdrawn;
	console.log("Current Balance :" + currentBalance);
	console.log("Withdrawn to " + vault + " :" + withdrawn);
	console.log("Bet Amount :" + bet / 100);
	firstGame = false;
	engine.placeBet(Math.round(bet), cashout, false);
});
engine.on('game_started', function(data) {
	highestbet = 0;
	remaining = Number(0);
	highestbetplayer = '';
	ingame = 0;
	cashedoutbets = 0;
	totalbet = 0;
	players = 0;
	playerbets = [];
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			if (data[key].bet / 100 > highestbet) {
				highestbet = data[key].bet / 100;
				highestbetplayer = key;
			}

			if (blacklist.includes(key) == false) {
				playerbets.push(key, data[key].bet / 100);
				totalbet += data[key].bet;
				players++;
			} else {
				console.log(key + " was not included");
			}

			var key = data[key].bet;
		}
	}
	cashedoutbets += bet / 100;
	target = (totalbet / 100) / 1.3;
	totalethos = totalbet / 100;
	highestpercent = Math.floor((highestbet / totalethos) * 100);
	lastmax = totalethos / divide;
	console.log("Total Players :" + players);
	console.log("Total Bet :" + totalethos);
	console.log("Target Cashout :" + target);
	console.log("Highest Bet : [" + highestbetplayer + "]:" + highestbet);
	console.log("Highest Bet %: [" + highestpercent + "%]");
	if (first == 1) {
		//console.log(playerbets);
		if (totalethos <= lowbetthresh) {
			engine.cashOut();
			ingame = 1;
			console.log("Cashing Out [Total Bet Too Low]");
		}
		if ((highestbet / totalethos) * 100 > highestplayerpercent) {
			engine.cashOut();
			ingame = 1;
			console.log("Cashing Out [Highest Better Too Big]");
		}
	}

});
engine.on('cashed_out', function(resp) {

	if (blacklist.includes(resp.username) == false) {
		//console.log(resp);
		//console.log(playerbets);
		player = playerbets.indexOf(resp.username);
		playerbet = player + 1;
		//console.log(playerbet);
		//console.log(playerbets[playerbet]);
		cashedoutbets += playerbets[playerbet];
	} else {
		console.log(resp.username + ' cashed out but i dont care');
	}

	

	if (cashedoutbets >= target) {

		if (ingame == 0) {
			console.log("Cashing out");
			engine.cashOut();
			ingame = 1;
		}

	} else {
		if (ingame == 0) {
			remaining = Math.round(target - cashedoutbets);
			console.clear();
			console.log("Current Balance :" + currentBalance);
			console.log("Withdrawn to " + vault + " :" + withdrawn);
			console.log("Bet Amount :" + bet / 100);
			console.log("Target Cashout :" + Math.round(target));
			console.log("Cashout Our So far :" + cashedoutbets);
			console.log("Remaining :" + remaining);
		}
	}

	
});
engine.on('game_crash', function(data) {
	console.log(cashedoutbets);
	console.clear();
	currentBalance = (engine.getBalance() / 100) - withdrawn;
	if (currentBalance > TargetBits) {
		excess = currentBalance - TargetBits;
		withdrawAmount = Number(0);
		withdrawAmount += Number(excess);
		withdrawAmount = (withdrawAmount).toFixed(2);
		console.log('[Bot] Attempting to withdraw ' + withdrawAmount + ' to ' + vault);
		cors = transferRequest('POST', 'https://www.ethcrash.io/transfer-request');
		withdrawn += Number(withdrawAmount);
		currentBalance = (engine.getBalance() / 100) - withdrawn;
	}

});
function transferRequest(method, url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		uuid = uuidv4();
		params = 'fakeusernameremembered=&fakepasswordremembered=&amount=' + withdrawAmount + '&to-user=' + vault + '&password=' + password + '&transfer-id=' + uuid;
		xhr.open(method, url, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {}
		}
		xhr.send(params);
	} else if (typeof XDomainRequest != "undefined") {
		xhr = new XDomainRequest();
		xhr.open(method, url);
		xhr.send();
	} else {
		xhr = null;
		xhr.send();
	}
	return xhr;
	xhr.send();
}

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0,
			v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}
