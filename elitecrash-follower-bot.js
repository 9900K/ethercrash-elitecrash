/*
	Follower Bot for elitecrash.io
	Developed by Darksoul
	Reselling or sharing of this script is strictly prohibited... If found, you'd be blacklisted from any of my services...
*/

var userBalance = engine.getBalance();
var tofollow = "-DarkSoul-"; //User to follow
var betperc = "100"; //Percentage to bet from following users bet.. 100 means it bets same amount as the user following...
var autocashout = "100" //Target multiplier to cashout automatically if following user doesn't cash out.
var constant = false; //If set to true, it bets constant amount.
var constant_bet = 1; //Amount to bet if constant bet is on
var lowbet = 1; //Amount to bet if bet is less than 1 bits.
var profit = 0;
var currentbalance = userBalance;
var username = engine.getUsername();

engine.on('player_bet', function(data) {
	if(data.username == tofollow) {
	if(constant) {
		engine.placeBet(Math.round(constant_bet*100), Math.round(autocashout*100));
	}
	else {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
					result = xhttp.responseText;
					result = result.split("<h5>");
					result = result[4].split("Satoshi");
					result = result[0].replace(/,/g , "");
					var bet = balance - result;
					console.log(tofollow, "is betting", bet, "Satoshi");
					bet = parseInt(bet*(betperc/100));
					console.log("Your current bet:", bet*(betperc/100), "Satoshi");
				if(bet < 1){
					engine.placeBet(Math.round(lowbet*100), Math.round(autocashout*100));
				}
				else {
					engine.placeBet(Math.round(bet*100), Math.round(autocashout*100));
				}
			}
		}
		xhttp.open("GET", "user/" + tofollow, true);
		xhttp.send();
	}
};
});

engine.on('game_crash', function(data) {
currentbalance = engine.getBalance();
profit = currentbalance - userBalance;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		balance = xhttp.responseText;
		balance = balance.split("<h5>");
		balance = balance[4].split("Satoshi");
		balance = balance[0].replace(/,/g , "");
		console.log("Game crashed at", data.game_crash / 100 + "x");
		console.log("Profit this session:", profit / 100, "Satoshi");
	}
};
xhttp.open("GET", "user/" + tofollow, true);
xhttp.send();
});

engine.on('cashed_out', function(data) {
var user = data.username;
if(user == tofollow) {
	engine.cashOut();
	console.log("User", tofollow, "cashed out at", data.stopped_at/100 + "x");
}
if(user == username) {
	console.log("You cashed out at", data.stopped_at/100 + "x");
}
});

engine.on('msg', function(data) {
	var msg = data.message;
	var sender = data.username;
	if(msg == ".profit") {
		engine.chat("Your profit this session: " + profit / 100 + " Satoshi");
	}
});