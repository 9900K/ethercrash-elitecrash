//customizable variables;

////////////////////////////////
//
var stopLoss = 0;
var bonusPercentRequired = 1.1;
var BonusPredictionErrorThreshold = 0.2;
var cashout = 220;
var skipGamesWhereMaxBetIsOver = 2000000;
//so your bet size is calcualted by dividing the highest bet amount, below are the settings for this.

var minBetSizeDivider = 30;
var maxBetSizeDivider = 50;

//var minBetSizeDivider = 350;
//var maxBetSizeDivider = 550;

////////////////////////////////

var bets=[];
var highestBetUser=null;
var highestBetAmount=0;
var ManualTarget='';
var People={};
var TotalRecorderdUsers=0;
var NewUsersAddedThisRound=0;
var TotalPlayersLastGame=0;
var TotalPlayersPlaying=0;
var sumaveragebetamount=0;
var gameBonus=0;
var largestBet=0;
var Sumofbets=0;
var AverageBetSize=0;
var IncreaseArray={}
var ActualBonusSum=0;
var betSize=5;
var basebet=5;
var HighestBonusRecorded=0;
var cashedout=false;
var betPlaced=false;
var ActualgameBeta=0;
var TotalBonusEarned=0;
var emergencycashout=false;
var WonAmt=0;
var LostAmt=0;
var HighestBetCount=0;
var HighestBetUsers=[];
var lastgamestatus='';
var difference=0;
var lostcount=0;

var crashedat=0;

var highestBetUser=null;
var highestBetAmount=0;
var lost=0;

var PendingCashoutsValue=0;//so lets call the sum of all the bets that have not cashed out pending Cashouts

var ThisGamesUserInfo=[];
var CashedOutUsers=[];
var cashedoutat=0;
var ExpectedBonus=0;

var dontAdd=false;

engine.on('player_bet',function (data){
     
     TotalPlayersPlaying++;
     dontAdd=false;
     var target = data.username;
		
      if(target == engine.getUsername()){
          console.log("our bet confirmed");
       } else{

                    //console.log(GetAverageBetAmount(target));

		//if we have the user in our object,sum their bets.
		//Sum the average bet amount for each user to get this games total expected value in bits
		if(target in People){
		sumaveragebetamount+=GetAverageBetAmount(target);
		}
         }

	if((sumaveragebetamount/100) >= HighestBonusRecorded){
	HighestBonusRecorded = sumaveragebetamount/100;
	}

	if(TotalPlayersPlaying >= TotalPlayersLastGame-7){
	console.clear();
	var gameBonus = (sumaveragebetamount)/100;
	var gameBeta = gameBonus/(highestBetAmount*100);
			
	var estimatedbonus = (betSize*100)*gameBeta;
	//console.log("[Prediction-GameValue] " + numberWithCommas(parseInt(sumaveragebetamount)));
	//console.log("[GameBeta]" + gameBeta);
	console.log("[Prediction-HighestBet] " + numberWithCommas(parseInt(highestBetAmount)) +
	                        //   " [Prediction-Bonus-Pot] " + numberWithCommas(parseInt(gameBonus)) + 
	                           " [Estimated Bonus In Bits] " + parseFloat(estimatedbonus).toFixed(2) +
	                           " [Required to bet] " + parseFloat((bonusPercentRequired / 100) * betSize).toFixed(2));
          
	if(highestBetAmount < skipGamesWhereMaxBetIsOver){
		betSize = highestBetAmount / getRandomInt(minBetSizeDivider,maxBetSizeDivider);
		console.log("Bet " + betSize + " bits cash out at " + cashout);
		 
				 if(betPlaced != true && (estimatedbonus >= (bonusPercentRequired / 100) * betSize)){
					
							engine.placeBet(Math.round(betSize)*100,cashout,false);
							console.log("bet placed for " + betSize + " bits cash out at"+cashout);
							betPlaced=true;
				}else{
					console.log("[Skipping Game] Not enough bonus.");
				}

     }else{
		console.log("[Skipped Game] highestBetAmount is too great (skipGamesWhereMaxBetIsOver)");
		
	}
	}
});

engine.on('game_started',function (data){
	         cashedout = false;
	         emergencycashout = false;
		cashedOutUsersCount = 0;
		CashedOutUsers = [];
		RemaindingUsers = [];
		HighestBetUsers = [];
		ThisGamesUserInfo = data;
		
		//console.log("[GAME-STARTED]")
		GetTheHighestBetAmount(data);
		console.log("[GAME-STARTED] - Users betting the same betting amount " + HighestBetCount + " [User(S)] " + highestBetUser );
		//console.log("Highest Bet Users Array Below");
		//console.log(highestBetUser);
                   CleanUpvars();

                  var GameValueBits = CalculateGamesActualValueInBits(data);
                  pendingCashoutsValue = GameValueBits;
		
		//console.log("[CHECK!]" + pendingCashoutsValue);
		gameBonus = GameValueBits / 100;
		var gameBeta=gameBonus/(highestBetAmount*100);
		ActualgameBeta = gameBeta;
		ExpectedBonus=((betSize*100)) * gameBeta;
		//console.log("[ACTUAL-GameValue]  " + numberWithCommas(parseInt(GameValueBits)));
		console.log(   "[ACTUAL-HighestBet] " + numberWithCommas(parseInt(highestBetAmount)) +
		                              " [ACTUAL-BonusAmount] " + numberWithCommas(parseInt(gameBonus)) +
		                              " [Expected Bonus] " + parseFloat(ExpectedBonus).toFixed(2));
	         
			// if(ExpectedBonus < (1.6 / 100) * betSize){
				 
		if(ExpectedBonus < ((bonusPercentRequired - BonusPredictionErrorThreshold) / 100) * betSize){
			if(betPlaced == true){
					engine.cashOut();
					console.log("[Cashing Out Early] Prediction wrong.");
					dontAdd=true;
			                 }
				}
		
		ActualBonusSum = gameBonus;
		CreateUpdateUserHistory(data);
		console.log("Won " + WonAmt + " Lost " + LostAmt);
		
//People array has now been populated with all the bets that the user has made.

//loop through all the players that are playing this game and sum their average bet amount in an attempt to determine the games value.

sumaveragebetamount=0;
Sumofbets=0;

});

var tempBonusPot = 0;
var cashedOutUsersCount = 0;
var FinalUserBonusObject ={};
var CurrentPayout = 0;
var HighestBetUserCashedOut = false;

engine.on('cashed_out',function (data){
         
	cashedOutUsersCount++;

         var user = data.username;
	var index = HighestBetUsers.indexOf(user);
	if(index >- 1){
		HighestBetUsers.splice(index,1);
		console.log("A highest better cashed out, highest betters remainding -> " + HighestBetUsers);
         }

         if(user == highestBetUser){
			HighestBetUserCashedOut = true;
		}

	CashedOutUsers[CashedOutUsers.length]={
											name:user,
											bet:ThisGamesUserInfo[user].bet,
											bonus:ThisGamesUserInfo[user].bet*ActualgameBeta
										     };
	
	//console.clear();
	//console.log('LastCashoutbet'+CashedOutUsers[CashedOutUsers.length-1].bet);
	var i = CashedOutUsers.length;

	var UsersBonus=0;
	var TempBonusSum = ActualBonusSum;
	//console.log("[BonusTotal]"+ActualBonusSum);
	var thisbet=0;
	
	do{
	      i--;
	      thisbet=CashedOutUsers[i].bet;
	      
		  if(thisbet>0){
	                  UsersBonus=thisbet*ActualgameBeta;
	                  TempBonusSum-=UsersBonus;
	                }
	//console.log('[USER]'+CashedOutUsers[i].name+"[BET]"+CashedOutUsers[i].bet+"[BONUS]"+UsersBonus+"[ReminingBonus]"+TempBonusSum);
          
	//console.log("[ReminingBonus] " + TempBonusSum + " [Original] " + ActualBonusSum);
	}while(CashedOutUsers > 0);
	//console.log("[ReminingBonus] " + TempBonusSum + " [Original] " + ActualBonusSum);

	if(emergencycashout == false && betPlaced == true){
	//if(TempBonusSum < ExpectedBonus && HighestBetUsers.length <= 0){
	if(HighestBetUsers.length <= 0 && TempBonusSum < ExpectedBonus && betPlaced == true){
		
	                        console.log("[Highest Better CashedOut] Attempting Bonus Steal!")
	                        emergencycashout=true;
	                        setTimeout(function (){engine.cashOut();},10);
			
	}
			
	if(TempBonusSum < ExpectedBonus && betPlaced == true){
	                        console.log("[Optimum bonus Amount] Attempting Bonus Steal!")
	                        emergencycashout=true;
	                        setTimeout(function (){engine.cashOut();},10);
			
	}


	var remaindingUsers = document.getElementsByClassName("user-playing").length;
	if(remaindingUsers <= 10 && betPlaced==true){
			if(engine.getCurrentPayout()> 1.3){
				console.log("Emergency Cashout not enough users playing!!!!!")
				emergencycashout=true;
				engine.cashOut();
				}
	}
	}


	if(user == engine.getUsername()){
	cashedoutat=data.stopped_at;
	cashedout=true;
	}

	});

var won = 0;
var max = 20;

engine.on('game_crash',function (data){
	
	HighestBetUserCashedOut = false;
	HighestBetCount = 0;
	betPlaced = false;
	
var balance = engine.getBalance() / 100;
	console.log("balance is " + balance);
	if(balance - betSize <= stopLoss){
			engine.stop();
			console.log("Safety stop loss triggered");
			betSize=0;
		
	}
	if(engine.lastGamePlay()== "LOST"){
						lastgamestatus = "LOST";
						}else if(engine.lastGamePlay()== "WON"){
						lastgamestatus = "WON";
						}	
	
				if(lastgamestatus == "LOST"){
					LostAmt += betSize;
					difference += betSize;
					//betSize = calcBet(LostAmt,cashout);
					
					console.log("BetSize calculated to " + betSize);
					lostcount++;
						
			
				}else if(lastgamestatus == "WON"){
					
				var wonamtcalc = betSize*(cashedoutat / 100);
						wonamtcalc = wonamtcalc - betSize;
						
						if(LostAmt>0){
							difference -= wonamtcalc;
							WonAmt += wonamtcalc;
							
								
							if(WonAmt>=LostAmt){
								WonAmt = 0;
								LostAmt = 0;
								betSize = basebet;
								basebet += 0.25;
								lostcount = 0;
								minBetSizeDivider-=1;
								minBetSizeDivider-=1;
							}
						}else{
							  betSize = basebet;
						}
				}else{
					betSize=5;
				}
				
	console.log("[PLAYED]["+engine.lastGamePlay()+"][LOSS_AMT] " + LostAmt + " [WON_AMT] " + WonAmt + " [Differnce] " + difference);

	console.log("[WonAmt] " + WonAmt + " [Lost Amt] " + LostAmt);
         remaindingUsers=0;

         crashedat = data.game_crash;
         console.log("[GAME-CRASHED]" + crashedat);
          ActualBonusSum = 0;

var lastbonus = data.bonuses;
var ourbonus = parseFloat(lastbonus[engine.getUsername()] / 100);
		console.log("OurBonus " + ourbonus);
		if(LostAmt > 0 && ourbonus > 0){
			WonAmt += ourbonus;
		}

for(var key in lastbonus){
lastbonus[key] = lastbonus[key]/100;
ActualBonusSum += lastbonus[key];
}

if(emergencycashout == true){
console.log("EMERGENCY CASHOUT");
}
//console.log(lastbonus);
//console.log("[CONFIRM]ActualBonusSumwas"+numberWithCommas(parseInt(ActualBonusSum)));

});


function  CleanUpvars(){
	NewUsersAddedThisRound=0;
	TotalPlayersLastGame=0;
	//TotalPlayersPlaying=0;
	gameBonus=0;
	//console.clear();
}

//Get the average bet amount for the user that is passed to this function 
function GetAverageBetAmount(user){

	Sumofbets = 0;
	Averagebetincrease = 0;
	averagebetdecrease = 0;
	AverageBetSize = 0;
	var userbetcount = Object.keys(People[user]).length;

	//loop through the bets the user has made
	for(i=0;i<userbetcount;i++){

	//Sumallthebets-
		if(People[user][i]>0){
			  Sumofbets+=People[user][i];
		}
	}

	//calculatethemeanaveragebetsizeforthisuserinbits
	AverageBetSize=Sumofbets/userbetcount;

	return AverageBetSize;
}

function CreateUpdateUserHistory(data){

//TODO be able to set to history to last N bets.

//Loop through the data from bustabit
var i = 0;
for(i = 0; i < Object.keys(data).length; i++){

//Check that the user is already in our object
if(data[Object.keys(data)[i]].username in People){
//The userisinourobject,findthelenngthoftheobject,incrementitandaddthebettotheendofthelist
People[data[Object.keys(data)[i]].username][Object.keys(People[data[Object.keys(data)[i]].username]).length]=data[Object.keys(data)[i]].bet/100;
}else{
//Theuserisnotinourobjectlist,initaliseanewobjectwiththeusernameasthekey
People[data[Object.keys(data)[i]].username]={};

//addthebetamountdividedby100tothenewlyinitiatedusernameobject
People[data[Object.keys(data)[i]].username][Object.keys(People[data[Object.keys(data)[i]].username]).length]=data[Object.keys(data)[i]].bet/100;

NewUsersAddedThisRound++;
}

}
TotalPlayersLastGame=i;

//console.log(People);
//console.log('LastPlayerCount'+TotalPlayersLastGame);
//console.log('ThisPlayerCount'+TotalPlayersPlaying);
//console.log('TotalRecordedusers'+Object.keys(People).length);
//console.log('Newusersaddedthisround'+NewUsersAddedThisRound);

}

//Post game starting
function CalculateGamesActualValueInBits(data){
	var ActualGameValue=0;
	
	for(i=0;i<Object.keys(data).length;i++){
	        ActualGameValue+=data[Object.keys(data)[i]].bet/100;
	}

        return ActualGameValue;
}

function GetTheHighestBetAmount(data){

		bets=[];//Resetbets
		for(var i=0;i<Object.keys(data).length;i++){
		bets.push(data[Object.keys(data)[i]].bet);//Getallbets
}

for(var i=0;i<Object.keys(data).length;i++){
  if(data[Object.keys(data)[i]].bet==bets.max()){
        HighestBetCount++; 
        highestBetUser=data[Object.keys(data)[i]].username;
        highestBetAmount=data[Object.keys(data)[i]].bet/100;
        HighestBetUsers.push(highestBetUser);
     }
}

}

function numberWithCommas(x){
 return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
}

function calcBet(LostAmt,cashout){
	var bet=0;
	var lost;
	 if(lostcount >= 2){
		lost = lostcount;
	}else{
		lost = 2;
	}
	do{ bet++;
		var wonamtcalc=bet*(cashout/100);
			wonamtcalc=wonamtcalc-bet;
		
}while(wonamtcalc<=LostAmt/lost);
			
return bet;
}


//Someuselessfunction :
Array.prototype.max=function (){
 return Math.max.apply(null,this);
};

function getRandomInt(min,max){
 return Math.floor(Math.random()*(max-min+1))+min;
}