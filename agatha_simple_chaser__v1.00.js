/****  Agatha Simple Chaser ****

    Author:  Agatha#5815 
	Started: 2019/01/23
	Updated: 2019/01/24
	
    Description:    Wait, Bet, Pause. Rinse & Repeat.
                    A flexible script that allows many combinations, 
                    from playing Low Crashes to Hunting Nyan.

    Guarantee:  I guarantee that you will lose all the BankRoll.

    Exception:  The fortuitous case may occur that accidentally does not lose the BankRoll and even the risk of obtaining some Profit. 
                If that were to happen, I accept the total or partial refund of the Profit.

    Usage Examples:
    
    Wait 100 games < Nyan, then start chasing Nyan with a Base Bet of 1 Ethos during 1600 games in a Simple Martingale
        BaseBet = 1;
        CashOut = 1000;
        onLossMultiplier = (1 / (CashOut - 1) + 1);
        gamePaused = true;
        pauseCrash = CashOut;
        pausedGames = 100;
        pauseWinStreak = 1;
        pauseLossStreak = 1600;

    Wait 7 < 2x then Chase 1.33x for 5 rounds with x1.25 onLoss and 100 Ethos Bet.     
    Do it until win 3 times in a row, and Pause. (Wait again)
    After 5 Losses in a row, take the losses, Pause (wait) and Start again with 100 Ethos
        BaseBet = 100;
        CashOut = 1.33;
        onLossMultiplier = 1.25;
        gamePaused = true;
        pauseCrash = 2.00;
        pausedGames = 7;
        pauseWinStreak = 3;
        pauseLossStreak = 5;


    Stop the Bot if Net Profit is 2000 Ethos    
    Stop the Bot if Losses are 30% of the ATH BankRoll (Max Session Balance)

 */

var ScriptName = `Agatha Simple Chaser`;
var Version = `1.00`;

// Config Variables
var BaseBet = 1;            // Base Bet 1 = 1 Ethos
var CashOut = 1000;         // CashOut 1000 = 1000.00x  (1.25 = 1.25x)
var onLossMultiplier = (1 / (CashOut - 1) + 1);     // Automatic Exact Multiplier for a Simple Martingale.
//var onLossMultiplier = 1.00;                     // Manual Multiplier on Loss x1.00 for a Fixed Bet 

// Wait 
var gamePaused = true; 		// Wait for pausedGames < pauseCrash, and start Betting. True to Start the Script in a paused mode.
var pauseCrash = CashOut;   // Wait pausedGames < 1000.00x (It can be same CashOut, or another diff X)
var pausedGames = 100;      // Wait 100 < pauseCrash

// Pause
var pauseWinStreak = 1;      // Consecutive Games to Win to force a Pause. (Useful when chasing low X as 1.15x)
var pauseLossStreak = 1600;  // Consecutive Lossings to force a Pause. (Pause Chasing after ... games)

// Stop
var StopProfit = 2000;      // 2000 = 2000 Ethos. Stop the bot if Profit is larger than this (Initial BankRoll + 2000)
var StopLoss = 30;          // 30 = 30% Stop the bot if Losses are larger than 30% of ATH BankRoll.








// ****************** Do not modify from here ********** ///
var UserName = engine.getUsername();
var InitBalance = CurrentBalance = MinBalance = MaxBalance = engine.getBalance();
var CurrentGameID = -1;
var d = new Date();
var StartTime = d.getTime();
var TimePlaying = 0;
var CurrentBet = BaseBet;
var TotalLoss = MaxLoss = 0;
var LastSeen = 0;
var lastGamePlay = 'NOT_PLAYED';
var numWins = numLosses = numMissed = 0;
var MaxWinStreak = MaxLossStreak = CurrentWinStreak = CurrentLossStreak = 0;
var Profit = ProfitPercent = 0;
var MaxBetPlaced = 0;
var CashOutProb = (9900 / (101 * (Math.ceil(100 * (CashOut * 100) / 100) - 1)) * 100);

console.log("Heating Engines...");
console.log('Balance:', engine.getBalance() / 100, 'Ethos');
console.log('Max Bet:', engine.getMaxBet() / 100, 'Ethos');
console.log('Max Profit:', engine.getMaxWin() / 100, 'Ethos');
var minBet = 1;
var maxBet = Math.trunc(engine.getMaxBet() / 100);   // Site Max Bet Limit. 


engine.on('game_starting', function (info) {

    if (LastSeen >= pausedGames) { gamePaused = false; }
    CurrentGameID = info.game_id;

    if (CurrentWinStreak >= pauseWinStreak) { gamePaused = true; CurrentWinStreak = 0; CurrentLossStreak = 0; LastSeen = 0; CurrentBet = BaseBet; }
    if (CurrentLossStreak >= pauseLossStreak) { gamePaused = true; CurrentWinStreak = 0; CurrentLossStreak = 0; LastSeen = 0; CurrentBet = BaseBet; }

    // Time Stats
    var newdate = new Date();
    TimePlaying = ((newdate.getTime() - StartTime) / 1000) / 60;

    console.clear()
    console.log('====== [', ScriptName, Version, '] ======');

    console.log('My username is: ' + engine.getUsername());
    console.log("Initial Balance:", (InitBalance / 100).toFixed(2), "Ethos");
    console.log("Current Balance:", (CurrentBalance / 100).toFixed(2), "Ethos", (CurrentBalance >= InitBalance ? '▲' : '▼'));
    console.log(' Min: ' + (MinBalance / 100).toFixed(2), "Ethos", '(' + ((InitBalance - MinBalance) / 100).toFixed(2) + ')');
    console.log(' Max: ' + (MaxBalance / 100).toFixed(2), "Ethos", '(' + ((MaxBalance - InitBalance) / 100).toFixed(2) + ') ' + (CurrentBalance >= MaxBalance ? '★' : ''));

    console.log('====== Strat ======');
    console.log('Chasing', CashOut + 'x Base Bet', Math.ceil(BaseBet) + ', x' + onLossMultiplier.toFixed(5) + ' onLoss');
    console.log('Wait', Math.ceil(pausedGames), "<", pauseCrash, "Reset after", pauseLossStreak, "losses");
    console.log('Probability:', (CashOutProb).toFixed(2) + '%');

    console.log("====== Profit ======");
    console.log("Session Profit:", Profit, "Ethos", "(" + ProfitPercent + "%)");
    console.log("Target Profit:", StopProfit, "Ethos");

    console.log("====== Loses ======");
    console.log("Total Loss:", Math.ceil(TotalLoss), "Ethos", "| Max:", Math.ceil(MaxLoss));
    console.log("Stop Loss:", StopLoss + "% " + (MaxBalance / 100 * StopLoss / 100).toFixed(2) + " (<" + (MaxBalance / 100 - (MaxBalance / 100 * StopLoss / 100)).toFixed(2) + ")");

    console.log("====== Stats ======");
    console.log('Wins:', numWins, '| Losses:', numLosses, '| Missed:', numMissed, '| ' + (numWins / numLosses >= Math.floor((1 / (CashOut - 1) + 1)) ? '▲' : '▼'));
    console.log("Win Streak:", MaxWinStreak, " | Loss Streak:", MaxLossStreak);
    console.log("Tot. Games:", (numWins + numLosses + numMissed), "in", Math.round(TimePlaying), "minutes.");

    console.log('====== * ======');
    console.log('Wins in a Row:', CurrentWinStreak, 'of', pauseWinStreak, 'to Pause');

    console.log('====== * ======');
    console.log("Game #", CurrentGameID, "| Max Bet Placed:", MaxBetPlaced);
    console.log('Last game Status: ' + lastGamePlay);


    // Pause (StopWinStreak or StopLossStreak)
    if (gamePaused) {
        console.warn('Paused: Waiting', (pausedGames - LastSeen), 'games <', pauseCrash + 'x');
        document.title = `Paused | ${ProfitPercent}% ` + (CurrentBalance >= InitBalance ? '▲ ' : '▼ ') + (CurrentBalance >= MaxBalance ? '★' : '');
    }


    if (!gamePaused) {

        // StopLoss
        if (((CurrentBalance / 100) - CurrentBet) <= MaxBalance / 100 - (MaxBalance / 100 * StopLoss / 100)) {
            console.warn("Current bet of", Math.floor(CurrentBet), "will break your Stop Loss on your balance", (MaxBalance / 100).toFixed(2));
            console.warn("Game Over ☠");
            document.title = (`Game Over ☠`);
            engine.stop();
        } else {


            // Check if the balance is high enough to place the bet.
            if (CurrentBet <= CurrentBalance) {
                var placeBet = Math.trunc(CurrentBet);

                console.log('--------------------');
                console.log("Betting", placeBet, "Ethos", ", CashOut", CashOut + 'x');
                console.log("Expected Profit", (placeBet * CashOut - placeBet - TotalLoss).toFixed(2), "Ethos");
                document.title = `Bet ${Math.trunc(placeBet)} @ ${CashOut}x | ${ProfitPercent}% ` + (CurrentBalance >= InitBalance ? '▲ ' : '▼ ') + (CurrentBalance >= MaxBalance ? '★' : '');

                MaxBetPlaced = Math.max(placeBet, MaxBetPlaced);

                // Place Bet **********************************************
                engine.placeBet(Math.trunc(placeBet * 100), Math.ceil(CashOut * 100), false);

            } else {
                // Not enough balance to place the bet.
                console.error("Your account balance is to low to place a bet....", ScriptName, "will close now.");
                engine.stop();
            }
        }
    }
});

engine.on('cashed_out', function (data) {
    if (data.username == engine.getUsername()) {
        console.log('Successfully cashed out at ' + (data.stopped_at / 100) + 'x');
    }
});

engine.on('game_crash', function (data) {
    // Update Max & Min Balance Stats
    CurrentBalance = engine.getBalance();
    MinBalance = Math.min(CurrentBalance, MinBalance);
    MaxBalance = Math.max(CurrentBalance, MaxBalance);
    Profit = ((CurrentBalance - InitBalance) / 100);
    ProfitPercent = (((CurrentBalance / InitBalance) - 1) * 100).toFixed(2);
    TotalLoss = (MaxBalance / 100 - CurrentBalance / 100);
    MaxLoss = (TotalLoss > MaxLoss) ? TotalLoss : MaxLoss;
    lastGamePlay = engine.lastGamePlay();

    var gameCrash = data.game_crash;

    console.log("Game crashed at", (gameCrash / 100) + 'x');
    console.log("Profit this session:", Profit, "Ethos", "(" + ProfitPercent + "%)");


    // WIN: Return to Normal conditions.
    if (lastGamePlay == 'WON') {

        // Stats
        numWins++;
        CurrentWinStreak++;
        CurrentLossStreak = 0;
        MaxWinStreak = (CurrentWinStreak > MaxWinStreak) ? CurrentWinStreak : MaxWinStreak;

        CurrentBet = BaseBet;
    }

    // LOST: Recovery routine.
    if (lastGamePlay == 'LOST') {
        // Stats
        numLosses++;
        CurrentLossStreak++;
        CurrentWinStreak = 0;
        MaxLossStreak = (CurrentLossStreak > MaxLossStreak) ? CurrentLossStreak : MaxLossStreak;

        console.log('Game Lost...');
        CurrentBet = CurrentBet * onLossMultiplier;
    }

    // Last Seen 
    if (gameCrash < pauseCrash * 100) { LastSeen++; }

    // NOT PLAYED: 
    if (lastGamePlay == "NOT_PLAYED") {
        // Target Missed
        if (gameCrash >= pauseCrash * 100) {
            console.log('Target Missed...');
            LastSeen = 0;
            numMissed++;
        }
    }

    // Fix Limits
    CurrentBet = (CurrentBet > maxBet) ? BaseBet : CurrentBet;
    CurrentBet = (CurrentBet < minBet) ? BaseBet : CurrentBet;
    //CurrentBet = Math.trunc(CurrentBet);


    //Target Profit Reached
    if (Profit > StopProfit) {
        console.log("Target Profit reached, bot is shutting down...");
        console.log("You have made", Profit, "Ethos", "(" + ProfitPercent + "%) profit this session.");
        document.title = (`Target Profit 🏆`);
        engine.stop();
    }


});