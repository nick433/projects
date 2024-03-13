//idea: you-player can be monitored for children changing, which happens when new cards are dealt or when it becomes my turn.
//can check if I have a call $1 (in 1/2) this will denote it being my turn to open SB

//add list of hands at SB which can be NOT hitting fold until the call value in the call button goes from $1 to $x
//TODO
//TODO: FIRST, framework to handle limpers

//TODO: make the script on by default and you need to open the extension to stop it from running. 
// reasoning for this: sometimes pokernow has it's own issues that resolve themselves by quickly reloading the webpage. this will make it so that
// if you are playing on mobile you will no longer be able to run the script as the browser version of pokernow is 

//TODO: // Having a button to quickly change modes from nitty mode to whale-full table mode would be nice, 
// then hands like Fives can be included in the CO flat to 3bet range

var customRangeAddress
var stopWhenRoomPaused
var stopWhenBpMentioned
var testingMode

var scriptsRunning = 0 //this is to make sure we don't have 2 scripts running concurrently
var scriptRunning = true
var lastPosition
var isStraddle = false
var playerAwayGlobal = false
var killScript = false
var finalResult = true
var playerName = "1234567"
var totalActivePlayers = 0;

var consecutiveTankFolds = 0
var saveConsecutiveFolds = 0

var BB_facing_3bet_txt
var SB_facing_2bet_txt
var SB_facing_3bet_txt
var BU_facing_2bet_txt
var BU_facing_3bet_short_txt
var BU_facing_3bet_med_txt
var BU_facing_3bet_deep_txt

var BB_defend_txt
var BB_defend_SB_open_txt
var SB_open_txt
var BU_open_txt
var position4_open_txt
var position5_over175_open_txt
var position6_over175_open_txt
var position7_open_txt
var position8_open_txt
var position9_open_txt
var position10_open_txt
var testing_ranges_txt
// TODO: we should have a handRanges table that takes betnum, stack depth, position, isLimp, tightness. these 5 attributes help find the corresponding file dynamically
// tightness could be standard(which would be kinda loose), demo, loose, tight, mega-nit
var SB_continue_facing_limp_standard
var BU_continue_facing_limp_standard
var MP_continue_facing_limp_standard

var CO_facing_3bet_deep
var CO_facing_2bet
var MP_facing_3bet_deep
var MP_facing_2bet

var playableHands;

var arrayOfLinks
var blinds
var blindsArrayFull
var betNum = 0
var SB
var BB

// TODO: BUG- if you are in BB with 78s it is a hand that would flat to an open but
// might fold when multiple players call in a row. go to the call observer and make the threshold of
// pot increase to be considered a 3bet smaller

// TODO: make it so the observer to find out if the pot size increases without it counting as a 2bet or 3bet
// will still fold most hands from SB. Will have to make a separate iso-at-SB range
main()

async function main() {

    customRangeAddress = await getFromStorage("customRangeAddress");

    userKey = await getFromStorage("texasFoldemuserKey");

    if (customRangeAddress && customRangeAddress != undefined) {
        customRangeAddress.replace(/\s/g, '')
    }
    if (userKey && userKey != undefined) {
        userKey.replace(/\s/g, '')
    }

    checkBoxAgreementValue = await getFromStorage("checkBoxAgreement");

    stopWhenRoomPaused = await getFromStorage("stopWhenRoomPaused");

    stopWhenBpMentioned = await getFromStorage("stopWhenBpMentioned");

    testingMode = await getFromStorage("testingMode");

    if (testingMode) {
        alert("Testing mode is currently enabled")
    }

    if (!checkBoxAgreementValue) {
        alert('You must first read and agree to the disclaimer in the options menu. Please go to this extension\'s options menu')
        return
    }
    if (userKey && userKey != '') {
        console.log('user key is: ' + userKey)
    }
    else {
        alert("User key is not set. Please go to this extension\'s options menu")
        return
    }

    if (customRangeAddress && customRangeAddress != '') {
        console.log('custom range address string: ' + customRangeAddress)
    }
    else {
        // use demo ranges
        console.log("using demo range address")
        customRangeAddress = "5c7f4608b7fc03bcd1900870b36c4026";
    }

    //TODO add a condition where custom range address (called custom range key) doesn't need to be filled in because we can always 

    var gistPage;
    site = new XMLHttpRequest()
    site.open("GET", "https://gist.github.com/dsmith1115/" + customRangeAddress, false)
    site.onreadystatechange = () => {
        if (site.readyState === 4) {
            if (site.status === 200 || site.status == 0) {
                gistPage = site.responseText
                return
            }
            else {
                return
            }
        }
    }
    site.send(null)
    // console.log(gistPage)
    if (gistPage == null || gistPage == undefined) {
        alert('The custom range ID may be invalid or the server hosting it is down. Or your access has expired. Check options for this extension and try again. \n\nIf issue persists contact the developer.')
        return;
    }
    // TODO: the names of the files could be dynamically generated to have a userKey that is unique to each user,
    // if the user key doesn't get entered properly then they will never find the custom ranges set for them
    // TODO: Have the user key set in the options section of the chrome extension, save it into cookies or somethin

    //to easily disable extension for a user, make every range just set to every hand 
    //   (easier than deleting all files so I dont need to remake it)

    // /(?<=[^\s]*?<a href.*=.*")\/dsmith1115\/.+(SB-facing-3bet\.txt|SB-open\.txt)/gim;

    // check if the userKey obtained from chrome storage matches the encryption from the get request

    var regexuserKey = new RegExp('(?<=<title>\s*).*(?=(·|Github))', 'gm');

    // TODO here should be the one and only get request which sends data to a server, we will need to generate
    // the userKey from the seed which should be secret

    //TODO: get options tab to actually work and recognize the tab was switched to

    tempArray = gistPage.match(regexuserKey)

    pre = tempArray[0].replace(/\s/g, '')
    // console.log(pre)

    cyph = CaesarCipher(pre, 3)

    hexCyph = cyph.hexEncode().toUpperCase()

    // binary = text2Binary(pre);
    // console.log(binary)
    // binary = binary.replace(/\s/g, '')

    console.log(hexCyph)
    console.log(userKey)
    if (userKey == hexCyph) {
        console.log('user key valid')
    }
    else {
        alert('User key no longer valid, please renew / contact developer')
        return;
    }

    //each block of 7 0s and 1s needs to have an extra 0 added to the beginning

    var regex = new RegExp(['(?<=[^\s]*?<a href.*=.*")\/dsmith1115\/.+(', //find initial url
        'BB-facing-3bet\.txt|BB-defend\.txt|BB-defend-SB-open\.txt|',
        'SB-open\.txt|SB-facing-3bet\.txt|SB-facing-2bet\.txt|',
        'BU-open\.txt|BUopen-BBdefendingfromCO\.txt|BU-facing-2bet\.txt|',
        'BU-facing-3bet-deep\.txt|BU-facing-3bet-med\.txt|',
        'BU-facing-3bet-short\.txt|CO-facing-2bet\.txt|CO-facing-3bet-deep\.txt|',
        'MP-facing-2bet\.txt|MP-facing-3bet-deep\.txt|',
        'position4-open\.txt|position5-over175-open\.txt|',
        'position6-over175-open\.txt|position7-open\.txt|',
        'position8-open\.txt|position9-open\.txt|position10-open\.txt|',
        'SB-continue-facing-limp-standard\.txt|BU-continue-facing-limp-standard\.txt|',
        'MP-continue-facing-limp-standard\.txt',
        ')'].join(''), 'gim');


    var preArrayOfLinks = gistPage.match(regex);

    preArrayOfLinks.forEach(link => link = 'https://gist.github.com' + link);
    arrayOfLinks = preArrayOfLinks.map(x => x.replace(/^/g, 'https://gist.github.com'));
    arrayOfLinks.shift();
    // console.log(arrayOfLinks)

    // regex to get all matching links to the current version of these ranges found after the hrefs. 
    // g = match all, i = ignoreCase, ^ = beggining of line, . = anything(except NL) * = 0 or more, + = 1 or more
    // m = multiline, might be able to be done without it if we can start at a certain index,
    // if git changes their gist format the skipping index method won't work

    //TODO: Add BB facing BU open and BB facing SB open as different ranges so we can fold hans like A6o to EP

    //TODO: it was easier to code such that pairs ALWAYS are considered preflop and never folded

    //TODO: add code to fix CORS issues so that CORS extension isn't needed

    loadRangeFiles();

    blinds = document.getElementsByClassName('blind-value')[0].innerText.replace(/\s/g, '')
    blindsArrayFull = blinds.split("~")
    blindsArray = blindsArrayFull[1].split("/")
    betNum = 0;
    SB = parseFloat(blindsArray[0]).toFixed(2)
    BB = parseFloat(blindsArray[1]).toFixed(2)

    console.log(+SB + +BB)
    // +SB + +BB == 3){

    if (scriptsRunning <= 1) {
        mainObserver()
    }
    else {
        console.log("exiting script")
    }
}

function getFromStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, resolve);
    })
    .then(result => {
        if (key == null) return result;
        else return result[key];
    });
}

function mainObserver() {
    try {
        if (document.getElementsByClassName('you-player').length == 0) {
            alert("you need to be seated first")
            return
        }

        var y = document.getElementsByClassName('dealer-button-ctn') //also check if this had live-straddle
        //class included

        if (y.length == 0) {
            alert("dealer button needs to be on table, please restart")
            return
        }
        var targetNode = y[0]

        var config = { attributes: true, childList: true }

        if (stopWhenRoomPaused || stopWhenBpMentioned) {
            const observerNodes = new MutationObserver(function (mutations_list) {
                mutations_list.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (added_node) {
                        // console.log(added_node) // delete this line it makes the console go nuts
                        try {
                            if (stopWhenRoomPaused && (added_node.classList[0] == 'room-owner-paused' && added_node.innerText.indexOf('Waiting for run it twice decisions') == -1 && added_node.innerText.indexOf('players are seeing the') == -1)) {
                                console.log('child has been added');
                                killScript = true
                                observerNodes.disconnect();
                                return
                            }

                            if (stopWhenBpMentioned && (added_node.classList[0] == 'chat-message-container' || added_node.classList[0] == 'table-player-chat-message')) {
                                console.log('child has been added');
                                console.log(added_node.innerText.toLowerCase())
                                if (added_node.innerText.toLowerCase().indexOf('bp ') != -1 || added_node.innerText.toLowerCase().indexOf(' bp') != -1 ||
                                    added_node.innerText.toLowerCase().indexOf('bomb pot') != -1 || added_node.innerText.toLowerCase().indexOf('bombpot') != -1) {
                                    console.log("bombpot mentioned")
                                    // TODO this isn't triggering when bp is typed
                                    killScript = true
                                    observerNodes.disconnect();
                                    return
                                }

                            }

                            // return
                            // need to be able to check midhand 
                        }
                        catch (e) {
                            console.log("no node to read classes from")
                        }

                    });
                });
            });

            observerNodes.observe(document.querySelector("#canvas"), { subtree: true, childList: true });
        }


        var callback = function (mutationsList, observer) {
            for (var mutation of mutationsList) {
                if (mutation.type == 'childList') {
                    console.log('A child node has been added or removed.')
                }
                else if (mutation.type == 'attributes') {

                    // TODO if the script gets killed run another observer, call a function that duplicates
                    // the call observer which checks for the BP mentioned, except check for if the current user (name sat in the primary seat)
                    // says in chat "." if the message contains one single period then it means to restart the bot. Practical for when on mobile
                    // and running the script from home and you can't manually restart the script once it is killed from pause/bp

                    console.log("consecutive tankfolds: " + consecutiveTankFolds)
                    if (consecutiveTankFolds > 5) {
                        consecutiveTankFolds = 0
                        document.getElementsByClassName('stand-up')[0].click()
                        killScript = true
                    }

                    scriptRunning = true
                    if (killScript) { // we set up an observer for if the current player wants to manually restart (if on mobile and running the extension)
                        console.log("killing script")
                        scriptRunning = false

                        const observerNodes2 = new MutationObserver(function (mutations_list) {
                            mutations_list.forEach(function (mutation) {
                                mutation.addedNodes.forEach(function (added_node) {
                                    // console.log(added_node) // delete this line it makes the console go nuts
                                    try {
                                        if (scriptRunning) {
                                            observerNodes2.disconnect();
                                            return
                                        }
                                        //TODO: if you start the program again manually by hitting run, this observer needs to know that and SD

                                        if (added_node.classList[0] == 'chat-message-container') {
                                            console.log('child has been added');
                                            // console.log(added_node.innerText.toLowerCase())
                                            // console.log(added_node.children[1].innerText)

                                            var you = document.getElementsByClassName('you-player');

                                            if (you.length > 0 && you[0].children[you[0].children.length - 1]) {
                                                playerName = you[0].children[you[0].children.length - 1].children[0].innerText
                                            }
                                            console.log(playerName)
                                            // if the player is on mobile and the script stopped from killswitch (pause, bp) then we can manually restart
                                            // the script on mobile by typing and sending . in chat. only works if current player does this
                                            if (added_node.innerText.indexOf('. ') == 0 && added_node.children[1].innerText == playerName) {
                                                console.log("restart script")
                                                mainObserver();
                                                observerNodes2.disconnect();
                                                return
                                            }
                                            if (added_node.innerText.indexOf('restart_') != -1) {
                                                console.log("restart script")
                                                mainObserver();
                                                observerNodes2.disconnect();
                                                return
                                            }

                                        }

                                        // return
                                        // need to be able to check midhand 
                                    }
                                    catch (e) {
                                        console.log("no node to read classes from" + e)
                                    }

                                });
                            });
                        });

                        observerNodes2.observe(document.querySelector("#canvas"), { characterData: true, subtree: true, childList: true });

                        observer.disconnect()
                        return
                    }

                    let pos = getYourPosition()

                    if(totalActivePlayers < 3){
                        return
                    }
                    // TODO: be able to detect how often you are tank folding preflop. (be able to detect if the timer turns red AND you fold after) 
                    // if it happens with every non-autofolded hand (like 7 within 1 hour) it means you are afk and should hit away.

                    // if (pos != 0) { // this is to check if the user makes an action. if they do we can see 
                    //     let callButton = document.querySelector('.call');

                    //     callButton.addEventListener('click', () => {
                    //         console.log("called")
                    //     })

                    // }
                    if (checkCards(pos + 1) == true) {
                        //this is only done if we have a hand that is playable and would require manual fold/action
                        console.log("checking to see if a tank fold will happen")
                        if (document.querySelector(".action-signal")) {
                            saveConsecutiveFolds = consecutiveTankFolds
                            consecutiveTankFolds = 0 //by default we will reset the tankfolds,
                            // but if the width of the timebank goes to 0 we increment with the saved consec value
                            const observerNodes2 = new MutationObserver(function (mutations_list) {
                                mutations_list.forEach(function (mutation) {

                                    try { //we need to keep checking for the action signal, when we get an action signal we will observe our own timebank

                                        if (document.querySelector(".action-signal")) {

                                            let widthString = mutation.target.attributes['style'].nodeValue
                                            let thenum = widthString.match(/\d+/)[0];
                                            console.log(thenum)
                                            if (thenum == 0) {
                                                console.log("tank folded")
                                                consecutiveTankFolds = saveConsecutiveFolds + 1
                                                observerNodes2.disconnect()
                                                return
                                            }

                                        }

                                    }
                                    catch (e) {
                                        console.log("no node to read classes from" + e)
                                    }

                                });
                            });


                            observerNodes2.observe(document.querySelector(".time-to-talk"), { subtree: true, childList: true, attributes: true });
                        }

                        else {
                            const observerNodes2 = new MutationObserver(function (mutations_list) {
                                mutations_list.forEach(function (mutation) {
                                    mutation.addedNodes.forEach(function (added_node) {
                                        // console.log(added_node) // delete this line it makes the console go nuts
                                        try {


                                            if (added_node.classList[0] == 'action-signal') {
                                                observerNodes2.disconnect();

                                                saveConsecutiveFolds = consecutiveTankFolds
                                                consecutiveTankFolds = 0 //by default we will reset the tankfolds,
                                                // but if the width of the timebank goes to 0 we increment with the saved consec value
                                                const observerNodes3 = new MutationObserver(function (mutations_list) {
                                                    mutations_list.forEach(function (mutation) {

                                                        try { //we need to keep checking for the action signal, when we get an action signal we will observe our own timebank


                                                            if (document.querySelector(".action-signal")) {

                                                                let widthString = mutation.target.attributes['style'].nodeValue
                                                                let thenum = widthString.match(/\d+/)[0];
                                                                // console.log(thenum)
                                                                if (thenum == 0) {
                                                                    console.log("tank folded")
                                                                    consecutiveTankFolds = saveConsecutiveFolds + 1
                                                                    observerNodes3.disconnect()
                                                                    return
                                                                }

                                                                // return

                                                            }

                                                        }
                                                        catch (e) {
                                                            console.log("no node to read classes from" + e)
                                                        }

                                                    });
                                                });


                                                observerNodes3.observe(document.querySelector(".time-to-talk"), { subtree: true, childList: true, attributes: true });

                                            }

                                            return
                                        }
                                        catch (e) {
                                            console.log("no node to read classes from" + e)
                                        }

                                    });
                                });
                            });

                            observerNodes2.observe(document.querySelector("#canvas"), { characterData: true, subtree: true, childList: true });

                        }
                    }

                }
            }
        }
        // Create an observer instance linked to the callback function
        var observer = new MutationObserver(callback)
        // Start observing the target node for configured mutations
        observer.observe(targetNode, config)

    } catch (e) {
        console.log("caught somehtin: " + e)
    }

    killScript = false //dont think this is neccessary
}

function checkCards(position) {

    try {
        if (position == 3 && lastPosition > 3) {
            console.log('button bug workaround')
            postion = lastPosition + 2
            if (position > 10) {
                position = 10
                alert("weird edgecase")
            }
        }

        console.log("postion: " + position)
        var x = document.getElementsByClassName('table-player-cards')
        var cardsRaw = x[0].innerText.replace(/\n|\r/g, "")
        // console.log(cardsRaw)
        cardsRaw = cardsRaw.replace("10", "T")
        cardsRaw = cardsRaw.replace("10", "T") // in case of pocket tens
        if (cardsRaw.length != 4 && cardsRaw.length != 6) {
            console.log("probably away or not seated")
            playerAwayGlobal = true;
            return
        }
        else {
            playerAwayGlobal = false;
        }
        // console.log(cardsRaw)
        var suited
        var pair = false
        var cards
        if (cardsRaw.length == 6) {
            if (cardsRaw[1] === cardsRaw[4]) {
                suited = 's'
            }
            else {
                suited = 'o'
            }
            if (cardsRaw[0] === cardsRaw[3]) {
                pair = true
            }
            if (pair) {
                cards = cardsRaw[0] + cardsRaw[3]
            }
            else {
                cards = cardsRaw[0] + cardsRaw[3] + suited
            }
        }
        else {
            if (cardsRaw[1] === cardsRaw[3]) {
                suited = 's'
            }
            else {
                suited = 'o'
            }
            if (cardsRaw[0] === cardsRaw[2]) {
                pair = true
            }
            if (pair) {
                cards = cardsRaw[0] + cardsRaw[2]
            }
            else {
                cards = cardsRaw[0] + cardsRaw[2] + suited
            }
        }

        console.log(cards)
        var result1 = isPlayable(cards, position)
        var result2
        var cardsFlipped
        if (!pair) {
            cardsFlipped = cards[1] + cards[0] + cards[2]

            result2 = isPlayable(cardsFlipped, position)
        }

        finalResult = result1 || result2
        console.log(finalResult)
        if (finalResult == undefined || finalResult == null) {
            finalResult = true
        } //this is a workaround for if the range charts arent readable
        // implement this later, it should start the mutationObserver once it is your turn only
        // idea: check for premium hands and automatically hit timebank
        if (isPremium(cards)) {
            console.log('extra time because premium or pp')
            extraTime()
        }

        setTimeout(() => {
            var k = document.getElementsByClassName('check-fold')
            var f = document.getElementsByClassName('fold')
            // console.log(f)
            if (k[0] && !finalResult) {
                console.log('k/f BB')
                if (!k[0].classList.contains('highlighted')) {
                    document.getElementsByClassName('check-fold')[0].click()
                    return
                }
                else {
                    console.log("already selected fold")
                    return
                }

            }
            else if (!k[0] && !finalResult && f[f.length - 1]) {

                //TD RESOLVED, added the check for red: if we fold early before the hand can be folded by the script the player element
                // will end up having a class containing 'fold' string which will be found by the getElementByClass function,
                // which causes the bot to click the player which pops up the little menu to edit or mute a player

                if (!f[f.length - 1].classList.contains('highlighted') && f[f.length - 1].classList.contains('red')) {
                    document.getElementsByClassName('fold')[f.length - 1].click()
                    return
                }
                else {
                    console.log("already selected fold")
                    return
                }

                // if player seated to the direct right it still clicks them.
                // this makes sure we click the last fold element on the page. other elements have the class 'fold' class,
                // as a bug fix I added a check for the class 'red' being contained in the element which is only on the fold button, not player element which will contain a 'fold' class
            }
            else {
                if ([1, 2, 3, 4, 5, 6, 7, 8, 9].includes(position)) { //only for BB SB BU and CO so far
                    if (!pair) {  //we are always considering pairs anyway, and this way we know we are getting flipped version
                        //TODO: sometimes small pairs will be folded so remove the if !pair check
                        decideAgainstOpen(position, cards, cardsFlipped)
                    }
                }
            }
        },
            randomNumber(840, 2000, 1.2, false))
        // TODO make it so only one third of the times that the delay is between 450-

        lastPosition = position

        return finalResult

    } catch (e) {
        console.log("caught somehtin: " + e)
    }

}

function isPremium(cards) {
    if ((cards[0] == cards[1]) && cards[0] != '2' && cards[0] != '3') { //pocketpairs higher than 33
        return true;
    }
    if ((cards[0] == 'A' && cards[1] == 'K') || (cards[0] == 'K' && cards[1] == 'A'))
        return true
    if ((cards[0] == 'A' && cards[1] == 'Q') || (cards[0] == 'Q' && cards[1] == 'A'))
        return true

    if (cards.length > 2) { //not pocketpairs
        if ((cards[0] == 'K' && cards[1] == 'Q' && cards[2] == 's') || (cards[0] == 'Q' && cards[1] == 'K' && cards[2] == 's'))
            return true
        if ((cards[0] == 'Q' && cards[1] == 'J' && cards[2] == 's') || (cards[0] == 'J' && cards[1] == 'Q' && cards[2] == 's'))
            return true
        if ((cards[0] == 'J' && cards[1] == 'T' && cards[2] == 's') || (cards[0] == 'T' && cards[1] == 'J' && cards[2] == 's'))
            return true
        if ((cards[0] == 'T' && cards[1] == '9' && cards[2] == 's') || (cards[0] == '9' && cards[1] == 'T' && cards[2] == 's'))
            return true
        if ((cards[0] == 'A' && cards[1] == 'J' && cards[2] == 's') || (cards[0] == 'J' && cards[1] == 'A' && cards[2] == 's'))
            return true
        if ((cards[0] == 'Q' && cards[1] == 'T' && cards[2] == 's') || (cards[0] == 'T' && cards[1] == 'Q' && cards[2] == 's'))
            return true
        if ((cards[0] == 'A' && cards[1] == 'T' && cards[2] == 's') || (cards[0] == 'T' && cards[1] == 'A' && cards[2] == 's'))
            return true
        if ((cards[0] == 'A' && cards[1] == '9' && cards[2] == 's') || (cards[0] == '9' && cards[1] == 'A' && cards[2] == 's'))
            return true
        if ((cards[0] == 'A' && cards[1] == '9' && cards[2] == 's') || (cards[0] == '9' && cards[1] == 'A' && cards[2] == 's'))
            return true
        if ((cards[0] == 'K' && cards[1] == 'J' && cards[2] == 's') || (cards[0] == 'J' && cards[1] == 'K' && cards[2] == 's'))
            return true
    }

    return false;
}

function isPlayable(cards, position) {
    try {
        //console.log(playableHands)
        if (testingMode)
            return true;
        if (position == 1) { //BB
            playableHands = BB_defend_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 2) { //SB
            playableHands = SB_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 3) { //BU
            playableHands = BU_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 4) { //CO
            playableHands = position4_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 5) { //HJ
            playableHands = position5_over175_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 6) { //LJ
            playableHands = position6_over175_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 7) { //UTG+2
            playableHands = position7_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 8) { //UTG+1
            playableHands = position8_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 9) { //UTG
            playableHands = position9_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (position == 10) { //position 10, yuck 10 handed
            playableHands = position10_open_txt;
            if (playableHands.includes(cards)) {
                return true;
            }
            else {
                return false;
            }
        }
    } catch (e) {
        console.log("caught somethin: " + e);
    }
}

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest()
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = () => {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                playableHands = rawFile.responseText;
                return;
            }
        }
    }
    rawFile.send(null);
}

//     random = Math.random() * (max - min) + min;
//     return random

function randomNumber(min, max, skew, rerolled) {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-400.0 * Math.log(u)) * Math.cos(20.0 * Math.PI * v)
    //the first negative value within the sqrt affects std dev, same with matching number after cosine. maybe im not sure should get a plotted graph with large sample size
    num = num / 10.0 + 0.5 // Translate to 0 -> 1
    if (num > 1 || num < 0)
        num = randomNumber(min, max, skew, false) // resample between 0 and 1 if out of range

    else {
        num = Math.pow(num, skew) // Skew
        num *= max - min // Stretch to fill range
        num += min // offset to min
    }
    if (!rerolled && num > 1950) {
        if (num % 2 == 0) {
            console.log("REROLL")
            num = randomNumber(min, max, skew, true)
        }
    }
    return num
}


function getYourPosition() {

    //TODO: find if we are in a straddled pot. Partly-implemented
    var s = document.getElementsByClassName('live-straddle');
    console.log('straddle stuff');
    if (s == undefined) {
        alert("straddle undefined");
    }
    console.log(s[0])
    if (s[0]) {
        isStraddle = true;
    }
    else {
        isStraddle = false;
    }
    console.log("straddled: " + isStraddle);

    var you = document.getElementsByClassName('you-player');
    var initialBetValue = 0
    if (you.length > 0 && you[0].children[2]) {
        initialBetValue = you[0].children[2].innerText.replace(/\n|\r/g, "");
    }

    console.log("initialbetval = " + initialBetValue);

    if (you.length > 0 && you[0].children[you[0].children.length - 1]) {
        playerName = you[0].children[you[0].children.length - 1].children[0].innerText
    }

    console.log(playerName)
    if (initialBetValue === SB) {
        console.log('position is SB');
        return 1;
    }
    if (initialBetValue === BB) {
        console.log('position is BB');
        return 0;
    }
    //BU open
    var bu = document.getElementsByClassName('dealer-position-1');
    console.log(bu.length);
    if (bu.length == 1) {
        console.log('position is BU');
        return 2;
    }

    var y = document.getElementsByClassName('seats');
    var arr = Array.from(y[0].children);
    var buttonPosition = 0;
    buttonPosition = arr[0].classList[1].charAt(arr[0].classList[1].length - 1);
    if (arr[0].classList[1].charAt(arr[0].classList[1].length - 1) === '0') { //edge case that we have double digit number at end of string (10)
        buttonPosition = 10;
    }
    console.log(buttonPosition);
    var array = [];
    var i;
    // console.log(arr)
    for (i = 0; i < arr.length - 1; i++) {
        // this shows the HTML of the players   
        // console.log(arr[i + 1].children[3])
        if (arr[i + 1].children[3] == undefined) {
            console.log("the straddle thing happened");
        }
        if (arr[i + 1].children[3] != undefined && arr[i + 1].children[3].classList.length > 1) {
            if (arr[i + 1].children[3].classList[0] !== 'table-player-status-icon' && arr[i + 1].children[3].innerText !== 'AWAY') {  //denotes quitting or in-next-hand or standing
                //the actual status of standing is arr[i + 1].children[3].classList[1] === 'standing-up'
                //can also check for arr[i + 1].children[3].innerText == 'AWAY'. But if they are AWAY (OFFLINE) it might miss it
                array.push(arr[i + 1]);
            }
        }
        else {
            array.push(arr[i + 1]);
        }
    }
    for (i = 0; i < array.length; i++) {
        if (array[i].classList[1].includes(buttonPosition.toString())) {
            console.log(array[i].classList[1]);
            console.log('found');
            break;
        }
        //we find which of the player elements contain the buttonPosition number, then have the list start with them and find where we are relative to them
        //array[i].innerText contains chip amount and name of player
    }

    var first = array.slice(0, i);
    var second = array.slice(i);
    var result = second.concat(first);
    var finalList = [];

    first = result.slice(0, 2);
    second = result.slice(2);
    result = second.concat(first);
    finalList[0] = result[0];

    for (i = 1; i < result.length; i++) {
        finalList[i] = result[result.length - i];
    }
    totalActivePlayers = finalList.length
    var currentPlayerIndex;
    var currentPlayerChipCount;

    // console.log(finalList)
    for (i = 0; i < finalList.length; i++) {
        if (finalList[i].classList[1] === 'table-player-1') {
            console.log('exists');
            currentPlayerIndex = i;
            let currentPlayerNode = finalList[i];
            var split = currentPlayerNode.innerText.split("\n");
            currentPlayerChipCount = split[split.length - 1] / BB;
            //console.log(split[split.length - 1] / BB)
            //count not accurate, needs debugging
            //console.log(currentPlayerNode.innerText)
            break
        }
    }
    console.log('current index: ' + currentPlayerIndex);
    //do element.classList.contains(class) to find if a player is away or quitting or in next hand. check for 'table-player-status-icon standing-up'
    return currentPlayerIndex;
}


function decideAgainstOpen(position, cards, cardsFlipped) {

    let totalLimps = 0
    betNum = 0
    if (document.getElementsByClassName('table-cards')[0].innerText) {
        console.log(document.getElementsByClassName('table-cards')[0].innerText)
    }
    // if an action happens preflop it counts as a mutation to the total pot size (or your total to-call size)
    // and this function will be triggered

    //we cannot check the call-button html as it does not exist for BB
    console.log("position: " + position)
    console.log("position: " + lastPosition)
    if (position != 1) {
        // set limp observer

        y4 = document.getElementsByClassName('add-on')

        targetNodeLimpPot = y4[0]
        console.log(targetNodeLimpPot)
        lastPotValue = parseFloat(targetNodeLimpPot.getElementsByClassName("normal-value")[0].innerText).toFixed(2)
        console.log("last pot value: " + lastPotValue)
        if (!isStraddle) {
            if (lastPotValue == SB + BB * 2) {
                console.log("limp has occured due to first pot value being 2BB+1SB")
                totalLimps = handleLimp(totalLimps, position, cards, cardsFlipped)
            }
        } else {
            if (lastPotValue == SB + BB * 5) {
                console.log("straddle limp has occured due to first pot value being 2BB+1SB")
                totalLimps = handleLimp(totalLimps, position, cards, cardsFlipped)
            }
        }

        configLimpPot = { characterData: true, subtree: true, attributes: false, childList: true }

        callbackLimp = function (mutationsList, observer) {
            try {
                console.log(betNum)
                console.log("last pot value - premutation observer: " + lastPotValue)
                for (var mutation of mutationsList) {

                    if (position !== lastPosition || playerAwayGlobal) {
                        //TODO: Add ability to see if the user put out any chips higher than the BB amount, signifying a call or raise. This should also trigger this
                        // block of code which kills the observer
                        console.log("killing limp potsize observer")
                        observer.disconnect()
                        //TODO: BUG:  need to know if the initial pot size is only equal to one BB, if so then we might have an error with figuring out our position for the next hand,
                        // detecting that the issue might happen is one thing, figuring out how and where it changes our percieved position to when it happens is another
                        return
                    }
                    // since this observer will keep going after a hand ends, we need to make sure that once the current hand changes we kill this observer
                    // at first I wanna gonna have a global cards variable for the current hand but in the edge case we get the same exact hand again
                    // the observer will continue and make a BB position's decision in the BU instead

                    //TODO future feature would be to detect if the user themselves were the 2better or 3better so that this code can't instant fold your hand
                    // because a shortstack decided to jam for 2x ontop of your A8o 3bet squeeze. Gotta consider all the edge-cases

                    console.log(document.getElementsByClassName('add-on'))
                    if (mutation.type == 'childList') {
                        console.log('A child node has been added or removed.')
                    }
                    else if (mutation.type == 'attributes') {
                        console.log('The ' + mutation.attributeName + ' attribute was modified.')
                    }
                    else {

                        if (document.getElementsByClassName('table-cards')[0].innerText != '') {
                            console.log(document.getElementsByClassName('table-cards')[0].innerText)
                            console.log("killing limp observer because table cards are out")
                            observer.disconnect()
                            return
                        }
                        //handle the size of pot changing
                        // console.log(mutation)
                        console.log("last pot value, betnum: " + lastPotValue + ", " + betNum)
                        let newPotValue = parseFloat(targetNodeLimpPot.getElementsByClassName("normal-value")[0].innerText).toFixed(2)
                        console.log("new pot value: " + newPotValue)
                        console.log(BB)
                        console.log(+BB + +lastPotValue) // THIS ADDS 2 STRING TOGETHER

                        if (!isStraddle) {
                            if (+newPotValue == (+lastPotValue + +BB)) {
                                console.log("limp #" + totalLimps + 1 + " has occured")
                                totalLimps = handleLimp(totalLimps, position, cards, cardsFlipped)
                            }
                        }
                        else {
                            if (+newPotValue == +lastPotValue + +BB * 2) {
                                console.log("straddle limp has occured")
                                totalLimps = handleLimp(totalLimps, position, cards, cardsFlipped)
                            }
                        }
                        // TODO: figure out some odds stuff so we can un-fold hands that become callable as pot odds get better 
                        // (with or without someone isoing, some people iso to tiny/bad sizings)

                        lastPotValue = parseFloat(targetNodeLimpPot.getElementsByClassName("normal-value")[0].innerText).toFixed(2)
                        // we need to update the lastPotValue after

                        //ENHANCE: more betNum logic here for determining if we fold the hand or not due to the 2bet/3bet etc
                    }
                }
            } catch (e) {
                console.log("caught something in limp observer: " + e)
                console.log("something broke, pls ping me on discord")
                console.log(document.getElementsByClassName('call'))
            }
        }
        observerLimpPot = new MutationObserver(callbackLimp)
        observerLimpPot.observe(targetNodeLimpPot, configLimpPot)


        console.log('setting call observer, non-BB')
        y2 = document.getElementsByClassName('call') //BB will not have the call field to observe when the hand starts
        targetNode2 = y2[0]

        if (targetNode2) {
            
            config2 = { characterData: true, subtree: true, attributes: false, childList: false }

            callback = function (mutationsList, observer) {
                try {
                    console.log(betNum)
                    for (var mutation of mutationsList) {
                        if (mutation.type == 'childList') {
                            console.log('A child node has been added or removed.')
                        }
                        else if (mutation.type == 'attributes') {
                            console.log('The ' + mutation.attributeName + ' attribute was modified.')
                            // checkCards()

                        }
                        else {
                            console.log(mutation)
                            betNum++
                            if (testingMode) //we don't want to fold we want to test stuff
                                return;

                            if (betNum == 1) {
                                if (position == 2) { //SB
                                    if (SB_facing_2bet_txt.includes(cards) || SB_facing_2bet_txt.includes(cardsFlipped)) {
                                        return
                                    }
                                    else {
                                        var f = document.getElementsByClassName('fold')

                                        if (f[f.length - 1]) {
                                            console.log('folding to 2bet')
                                            if (!f[f.length - 1].classList.contains('highlighted')) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }
                                        }
                                        //TODO: move all this to the pot size change mutation-observer. We can make the decision more dynamic if considering pot-odds
                                        // for example: KTo at the BU will be a fold to an open as of now. But if someone opens 2BB and 3 people flat before us on the BU we
                                        // easily can elect to call and play tight postflop
                                    }
                                }
                                if (position == 3) { //BU
                                    if (BU_facing_2bet_txt.includes(cards) || BU_facing_2bet_txt.includes(cardsFlipped)) {
                                        return
                                    }
                                    else {
                                        var f = document.getElementsByClassName('fold')

                                        if (f[f.length - 1]) {
                                            console.log('folding to 2bet')
                                            if (!f[f.length - 1].classList.contains('highlighted')) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }
                                        }

                                    }
                                }
                                if (position == 4) { //CO
                                    if (CO_facing_2bet.includes(cards) || CO_facing_2bet.includes(cardsFlipped)) {
                                        return
                                    }
                                    else {
                                        var f = document.getElementsByClassName('fold')

                                        if (f[f.length - 1]) {
                                            console.log('folding to 2bet')
                                            if (!f[f.length - 1].classList.contains('highlighted')) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }
                                        }

                                    }
                                }
                                if (position >= 5) { //MP+
                                    if (MP_facing_2bet.includes(cards) || MP_facing_2bet.includes(cardsFlipped)) {
                                        return
                                    }
                                    else {
                                        var f = document.getElementsByClassName('fold')

                                        if (f[f.length - 1]) {
                                            console.log('folding to 2bet')
                                            if (!f[f.length - 1].classList.contains('highlighted')) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }
                                        }

                                    }
                                }

                            }
                            else if (betNum == 2) {
                                //for now the SB and BU will have the same cards considered for facing 3bet,
                                //although SB should be folding much more
                                console.log('facing 3bet')
                                if (position == 2) { //SB or greater for now
                                    // TODO: if(getPlayerChips() > 500)
                                    if (SB_facing_3bet_txt.includes(cards) || SB_facing_2bet_txt.includes(cardsFlipped)) {
                                        return true
                                    }
                                    else {
                                        var f = document.getElementsByClassName('fold')
                                        //TD RESOLVED: sometimes we are at SB and hit fold with K6o when someone else opens, then someone else 3bets and we click fold again which unfolds it
                                        if (f[f.length - 1]) {
                                            console.log('folding ' + cards + ' to 3bet')

                                            if (!f[f.length - 1].classList.contains("highlighted")) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }

                                        }
                                    }
                                }
                                if (position == 3) { //BU                                
                                    // TODO: if(getPlayerChips() > 500)
                                    if (BU_facing_3bet_deep_txt.includes(cards) || BU_facing_3bet_deep_txt.includes(cardsFlipped)) {
                                        return true
                                    }
                                    else {
                                        var f = document.getElementsByClassName('fold')
                                        //TD RESOLVED: sometimes we are at SB and hit fold with K6o when someone else opens, then someone else 3bets and we click fold again which unfolds it
                                        if (f[f.length - 1]) {
                                            console.log('folding ' + cards + ' to 3bet')

                                            if (!f[f.length - 1].classList.contains("highlighted")) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }

                                        }
                                    }
                                }
                                if (position == 4) { //CO          
                                    console.log('facing 3bet as CO')
                                    if (CO_facing_3bet_deep.includes(cards) || CO_facing_3bet_deep.includes(cardsFlipped)) {
                                        return true
                                    }
                                    else {
                                        console.log("folding")
                                        var f = document.getElementsByClassName('fold')
                                        //TD RESOLVED: sometimes we are at SB and hit fold with K6o when someone else opens, then someone else 3bets and we click fold again which unfolds it
                                        if (f[f.length - 1]) {
                                            console.log('folding ' + cards + ' to 3bet')

                                            if (!f[f.length - 1].classList.contains("highlighted")) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }

                                        }
                                    }
                                }
                                if (position >= 5) { //MP+      
                                    //eventually a stack size checker will adjust what hands we auto-jam
                                    console.log('facing 3bet as MP')
                                    if (MP_facing_3bet_deep.includes(cards) || MP_facing_3bet_deep.includes(cardsFlipped)) {
                                        return true
                                    }
                                    else {
                                        console.log("folding")
                                        var f = document.getElementsByClassName('fold')
                                        //TD RESOLVED: sometimes we are at SB and hit fold with K6o when someone else opens, then someone else 3bets and we click fold again which unfolds it
                                        if (f[f.length - 1]) {
                                            console.log('folding ' + cards + ' to 3bet')

                                            if (!f[f.length - 1].classList.contains("highlighted")) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                                return
                                            }
                                            else {
                                                console.log("already selected fold")
                                                return
                                            }

                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log("caught something: " + e)
                    console.log("something broke, pls ping me on discord")
                    console.log(document.getElementsByClassName('call'))
                }
            }

            // Create an observer instance linked to the callback function
            observer = new MutationObserver(callback)
            observer.observe(targetNode2, config2)
        }

    }
    else {

        //TODO: solution for BB: if BB, we need to check for bets by the players which will need to have alot of
        // listeners for the changes in child elements by each player. a real pain in the ass to implement

        //TD RESOLVED: if we ourselves are 3betting a hand the code doesn't know it's us and will hit the fold
        // button and fold our AJo type hand. Which is honestly fine since AJo should be folding to any 4bet.
        // However we may call a 4bet with 99 as the 3better but not call a 3bet with it. It's still a 4bet bluff candidate
        // so just including the 99 in the defend against 3bet range everywhere is the best play. If we 3bet squeeze QJo from the BB
        // we will automatically have fold hit

        y3 = document.getElementsByClassName('add-on')

        targetNodePot = y3[0]
        console.log(targetNodePot)
        lastPotValue = targetNodePot.getElementsByClassName("normal-value")[0].innerText

        configPot = { characterData: true, subtree: true, attributes: false, childList: true }

        callbackBB = function (mutationsList, observer) {
            try {
                console.log(betNum)

                for (var mutation of mutationsList) {

                    if (position !== lastPosition || playerAwayGlobal) {
                        //TODO: Add ability to see if the user put out any chips higher than the BB amount, signifying a call or raise. This should also trigger this
                        // block of code which kills the observer
                        console.log("killing BB potsize observer")
                        observer.disconnect()
                        //TODO: BUG:  need to know if the initial pot size is only equal to one BB, if so then we might have an error with figuring out our position for the next hand,
                        // detecting that the issue might happen is one thing, figuring out how and where it changes our percieved position to when it happens is another
                        return
                    }
                    // since this observer will keep going after a hand ends, we need to make sure that once the current hand changes we kill this observer
                    // at first I wanna gonna have a global cards variable for the current hand but in the edge case we get the same exact hand again
                    // the observer will continue and make a BB position's decision in the BU instead

                    //TODO future feature would be to detect if the user themselves were the 2better or 3better so that this code can't instant fold your hand
                    // because a shortstack decided to jam for 2x ontop of your A8o 3bet squeeze. Gotta consider all the edge-cases

                    console.log(document.getElementsByClassName('add-on'))
                    if (mutation.type == 'childList') {
                        console.log('A child node has been added or removed.')
                    }
                    else if (mutation.type == 'attributes') {
                        console.log('The ' + mutation.attributeName + ' attribute was modified.')
                    }
                    else {
                        //handle the size of pot changing

                        // console.log(mutation)
                        console.log("last pot value: " + lastPotValue)

                        let newPotValue = targetNodePot.getElementsByClassName("normal-value")[0].innerText
                        // console.log("new pot value: " + newPotValue)
                        // console.log(BB)
                        // console.log(+BB + +lastPotValue)
                        // if (+newPotValue == +lastPotValue + +BB) { // TODO: to do this math properly see line 205. test with 1/2 as well
                        //     console.log("limp has occured")
                        //     // TODO: we could make it so hands that are folded by default in MP like QJo are unfolded once 2 limps have occured
                        // }

                        // if (+lastPotValue == +SB + +BB * 2 || +newPotValue == +SB + +BB * 2) {
                        //     console.log("limp has occured due to first pot value being 2BB+1SB")
                        // }
                        // theres no reason to know if we limped while at the BB

                        if (targetNodePot.getElementsByClassName("normal-value")[0].innerText >= lastPotValue * 2) {
                            // if this condition is met it means that the pot was raising enough to be not considered a limp or limp-along
                            lastPotValue = targetNodePot.getElementsByClassName("normal-value")[0].innerText
                            betNum++;
                            console.log(lastPotValue)
                            console.log(betNum)
                            if (betNum == 2) {
                                console.log(document.getElementsByClassName('table-cards')[0].innerText)
                                console.log(cards)
                                console.log(cardsFlipped)
                                //if the preflop action ended with a single raise pot, a more than pot sized bet results in auto-fold
                                if (BB_facing_3bet_txt.includes(cards) || BB_facing_3bet_txt.includes(cardsFlipped)) {
                                    return
                                }
                                else {
                                    //only folds once we make sure that we are still in preflop action. This bug made me auto-fold postflop D:
                                    console.log("checking if cards are on board first..")
                                    if (document.getElementsByClassName('table-cards')[0].innerText == '') {
                                        var f = document.getElementsByClassName('fold')

                                        if (f[f.length - 1]) {
                                            console.log('folding to 3bet')
                                            if (!f[f.length - 1].classList.contains('highlighted')) {
                                                document.getElementsByClassName('fold')[f.length - 1].click()
                                            }
                                            else {
                                                console.log("already selected fold")
                                            }
                                            observer.disconnect()
                                            return

                                        }
                                    } else {
                                        console.log(document.getElementsByClassName('table-cards')[0].innerText)
                                    }

                                }
                            }
                            if (betNum == 3) {

                                //might implement this eventually
                            }
                            if (betNum == 4) {
                                // so weird edgecase, this observer DOESN'T STOP post-flop, so if someone bets pot or more it triggers a fold
                                // from hands that are not able to call 3bets preflop
                            }

                        }
                        else {
                            // console.log(document.getElementsByClassName('table-cards') )
                            // we need to set the the lastpotvalue to whatever the new one is whether we act or not
                            lastPotValue = targetNodePot.getElementsByClassName("normal-value")[0].innerText
                            if (document.getElementsByClassName('table-cards')[0].innerText) {
                                console.log(document.getElementsByClassName('table-cards')[0].innerText)
                            }
                            //TODO: make an extension that only checks for limps then makes a boiiyoyoyiing noise lmao

                            //check for cards being out then kill the observer
                        }

                        //ENHANCE: more betNum logic here for determining if we fold the hand or not due to the 2bet/3bet etc
                    }
                }
            } catch (e) {
                console.log("caught something: " + e)
                console.log("something broke, pls ping me on discord")
                console.log(document.getElementsByClassName('call'))
            }
        }
        observerPot = new MutationObserver(callbackBB)
        observerPot.observe(targetNodePot, configPot)
        // because the pot total always remains on the page this observer will stay active to the next hand utilizing the same cards
        // we need a way to know when the pot has gone to the next hand
        // the solution is to have 
    }



}

function handleLimp(totalLimps, position, cards, cardsFlipped) {
    // TODO: innovation, make it so there is a lookup table with keyvalue pairs so we can just get the textfile needed given a tuple input
    // for example: handRange[position, short] // with the keys being position and stack-depth which will have the value of the textfile so we don't
    // don't need to do if position X. This could also include a third input betNum, or 4th input isLimp 

    if (position == 2) {
        if (SB_continue_facing_limp_standard.includes(cards) || SB_continue_facing_limp_standard.includes(cardsFlipped)) {
            return totalLimps++
        }
    }
    else if (position == 3) {
        if (BU_continue_facing_limp_standard.includes(cards) || BU_continue_facing_limp_standard.includes(cardsFlipped)) {
            return totalLimps++
        }
    }
    else if (position == 4 || position == 5 || position == 6) { //MP
        if (MP_continue_facing_limp_standard.includes(cards) || MP_continue_facing_limp_standard.includes(cardsFlipped)) {
            return totalLimps++
        }
    }
    else if (position > 6 || position == 1) {
        return totalLimps++
    }

    //only folds once we make sure that we are still in preflop action. This bug made me auto-fold postflop D:
    console.log("checking if cards are on board first..")
    if (document.getElementsByClassName('table-cards')[0].innerText == '') {
        var f = document.getElementsByClassName('fold')

        if (f[f.length - 1]) {
            console.log('folding to limp')
            if (!f[f.length - 1].classList.contains('highlighted')) {
                document.getElementsByClassName('fold')[f.length - 1].click()
            }
            else {
                console.log("already selected fold")
            }
            return totalLimps++

        }
    }

    return totalLimps++
}

function extraTime() {
    // if we have a premium, we want to be able to still hear the warning noise before folding, but when that happens
    // we want to then click extra-time


    //TODO: we need to check for bets by the players which will need to have alot of
    // listeners for the changes in child elements by each player. a real pain in the ass to implement. depending on the position of player openning
    // will determine if we fold or not. 
    // ** We also might automatically unfold if the pot odds become favorable? Hands like 87s would want autotime if we are priced in

    if (document.querySelector(".action-signal")) {
        console.log("extra time function")

        // but if the width of the timebank goes to 0 we increment with the saved consec value
        const observerNodes2 = new MutationObserver(function (mutations_list) {
            mutations_list.forEach(function (mutation) {

                try { //we need to keep checking for the action signal, when we get an action signal we will observe our own timebank

                    if (document.querySelector(".action-signal")) {

                        let widthString = mutation.target.attributes['style'].nodeValue
                        let thenum = widthString.match(/\d+/)[0];
                        console.log(thenum)
                        if (thenum == 1) {
                            console.log("activating timebank")
                            var tb = document.getElementsByClassName('time-bank')[1] //the 0st one is the actual time meter

                            console.log(tb)
                            if (tb) {
                                if (!tb.classList.contains('highlighted')) {
                                    // find the correct element that has multiple classes
                                    document.getElementsByClassName('time-bank')[1].click()
                                }
                                else {
                                    console.log("already selected tb")
                                }

                            }
                            observerNodes3.disconnect()
                            return
                        }

                    }

                }
                catch (e) {
                    console.log("no node to read classes from" + e)
                }

            });
        });


        observerNodes2.observe(document.querySelector(".time-to-talk"), { subtree: true, childList: true, attributes: true });
    }

    else {
        const observerNodes2 = new MutationObserver(function (mutations_list) {
            mutations_list.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (added_node) {
                    // console.log(added_node) // delete this line it makes the console go nuts
                    try {


                        if (added_node.classList[0] == 'action-signal') {
                            observerNodes2.disconnect();

                            saveConsecutiveFolds = consecutiveTankFolds
                            consecutiveTankFolds = 0 //by default we will reset the tankfolds,
                            // but if the width of the timebank goes to 0 we increment with the saved consec value
                            const observerNodes3 = new MutationObserver(function (mutations_list) {
                                mutations_list.forEach(function (mutation) {

                                    try { //we need to keep checking for the action signal, when we get an action signal we will observe our own timebank


                                        if (document.querySelector(".action-signal")) {

                                            let widthString = mutation.target.attributes['style'].nodeValue
                                            let thenum = widthString.match(/\d+/)[0];
                                            // console.log(thenum)
                                            if (thenum == 1) {
                                                console.log("activating timebank")
                                                var tb = document.getElementsByClassName('time-bank')[1] //the 0st one is the actual time meter

                                                console.log(tb)
                                                if (tb) {
                                                    if (!tb.classList.contains('highlighted')) {
                                                        // find the correct element that has multiple classes
                                                        document.getElementsByClassName('time-bank')[1].click()
                                                    }
                                                    else {
                                                        console.log("already selected tb")
                                                    }

                                                }
                                                observerNodes3.disconnect()
                                                return
                                            }

                                        }

                                    }
                                    catch (e) {
                                        console.log("no node to read classes from" + e)
                                    }

                                });
                            });


                            observerNodes3.observe(document.querySelector(".time-to-talk"), { subtree: true, childList: true, attributes: true });

                        }

                        return
                    }
                    catch (e) {
                        console.log("no node to read classes from" + e)
                    }

                });
            });
        });

        observerNodes2.observe(document.querySelector("#canvas"), { characterData: true, subtree: true, childList: true });

    }


}


function loadRangeFiles() {
    try {

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BB-facing-3bet/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BB_facing_3bet_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /SB-facing-2bet/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    SB_facing_2bet_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)
        console.log(SB_facing_2bet_txt)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BU-facing-2bet/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BU_facing_2bet_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BU-facing-3bet-short/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BU_facing_3bet_short_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BU-facing-3bet-med/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BU_facing_3bet_med_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BU-facing-3bet-deep/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BU_facing_3bet_deep_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BB-defend/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BB_defend_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BB-defend-SB-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BB_defend_SB_open_txt = rawFile.responseText // this is still not used. Should probably be used for HU
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /SB-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    SB_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BU-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BU_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position4-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position4_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position5-over175-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position5_over175_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position6-over175-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position6_over175_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position7-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position7_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position8-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position8_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position9-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position9_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /position10-open/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    position10_open_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /testing-ranges/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    testing_ranges_txt = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /SB-continue-facing-limp-standard/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    SB_continue_facing_limp_standard = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /BU-continue-facing-limp-standard/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    BU_continue_facing_limp_standard = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /MP-continue-facing-limp-standard/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    MP_continue_facing_limp_standard = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /CO-facing-2bet/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    CO_facing_2bet = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /CO-facing-3bet-deep/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    CO_facing_3bet_deep = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /MP-facing-2bet/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    MP_facing_2bet = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)

        var rawFile = new XMLHttpRequest()
        rawFile.open("GET", arrayOfLinks.find(value => /MP-facing-3bet-deep/gi.test(value)), false)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    MP_facing_3bet_deep = rawFile.responseText
                    return
                }
            }
        }
        rawFile.send(null)
    }
    catch (e) {
        console.log("error loading range files: " + e)
    }

}

function loadDemoRangeFiles() {
    try {
        // TODO: have different gist directory for range files so they can have the same name but so the retrieved backend data is different with same names for variables
        // and files. Just need to have custom range ID address change, and the default custom range ID will be set unless there is one written out

        // var rawFile = new XMLHttpRequest()
        // rawFile.open("GET", arrayOfLinks.find(value => /BB-facing-3bet-demo/gi.test(value)), false)
        // rawFile.onreadystatechange = () => {
        //     if (rawFile.readyState === 4) {
        //         if (rawFile.status === 200 || rawFile.status == 0) {
        //             BB_facing_3bet__demo_txt = rawFile.responseText /
        //             return
        //         }
        //     }
        // }
        // rawFile.send(null)

    } catch (e) {
        console.log("error loading range files: " + e)
    }
}
function text2Binary(string) {
    temp = string.split('').map(function (char) {
        return char.charCodeAt(0).toString(2);
    }).join(' ');
    // to insert into part of the string we need to use string slicing with substring
    for (i = 0; i < temp.length; i += n) {
        n = 8;
        temp = temp.slice(0, i) + '0' + temp.slice(i, temp.length);
        console.log(temp)
        n += 1; //as the string grows we need to take bigger leaps
    }
    return temp
}

String.prototype.hexEncode = function () {
    var hex, i;

    var result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        // result += ("000"+hex).slice(-4);
        result += (hex).slice(-4);
    }

    return result
}

function CaesarCipher(str, num) {
    // you can comment this line

    var result = '';
    var charcode = 0;

    for (var i = 0; i < str.length; i++) {
        charcode = (str[i].charCodeAt()) + num;
        result += String.fromCharCode(charcode);
    }
    return result;

}

function checkFirstVisit() {
    if (document.cookie.indexOf('mycookie') == -1) {
        // cookie doesn't exist, create it now
        document.cookie = 'mycookie=1'
        alert("first load")
    }
    else {
        // not first visit, so alert
        console.log('You refreshed!')
        scriptsRunning = 1
    }
}