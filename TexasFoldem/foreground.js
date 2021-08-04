//idea: you-player can be monitored for children changing, which happens when new cards are dealt or when it becomes my turn.
//can check if I have a call $1 (in 1/2) this will denote it being my turn to open SB

//add list of hands at SB which can be NOT hitting fold until the call value in the call button goes from $1 to $x

var scriptRunning = 0 //this is to make sure we don't have 2 scripts running concurrently
var lastPosition
var isStraddle = false

var SB_facing_2bet_txt
var BU_facing_2bet_txt
var BU_facing_3bet_short_txt
var BU_facing_3bet_med_txt
var BU_facing_3bet_deep_txt
var playableHands;

loadRangeFiles();

var blinds = document.getElementsByClassName('blind-value')[0].innerText.replace(/\s/g, '')
var blindsArrayFull = blinds.split("~")
blindsArray = blindsArrayFull[1].split("/")
var betNum = 0;
var SB = blindsArray[0];
var BB = blindsArray[1];

if (scriptRunning <= 1) {
    mainObserver()
}
else {
    console.log("exiting script")
}

function mainObserver() {
    try {
        console.log(BU_facing_2bet_txt)

        var y = document.getElementsByClassName('dealer-button-ctn') //also check if this had live-straddle
        //class included

        var targetNode = y[0]

        var config = { attributes: true, childList: true }

        var callback = function (mutationsList) { //all this does is check for movement in the dealer-button-ctn element. it also includes movement of straddles
            for (var mutation of mutationsList) {
                if (mutation.type == 'childList') {
                    console.log('A child node has been added or removed.')
                }
                else if (mutation.type == 'attributes') {
                    console.log('The ' + mutation.attributeName + ' attribute was modified.')
                    let pos = getYourPosition()

                    checkCards(pos + 1)

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
            return
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

        var finalResult = result1 || result2
        console.log(finalResult)
        if (finalResult == undefined || finalResult == null) {
            finalResult = true
        } //this is a workaround for if the range charts arent readable
        // implement this later, it should start the mutationObserver once it is your turn only
        // idea: check for premium hands and automatically hit timebank
        // if (finalResult) {
        //     extraTime()
        // }

        setTimeout(() => {
            var k = document.getElementsByClassName('check-fold')
            var f = document.getElementsByClassName('fold')
            // console.log(f)
            if (k[0] && !finalResult) {
                console.log('k/f BB')
                document.getElementsByClassName('check-fold')[0].click()
            }
            else if (!k[0] && !finalResult && f[f.length - 1]) {
                console.log('fold!!!!')
                document.getElementsByClassName('fold')[f.length - 1].click()
                //if player seated to the direct right it clicks them still
                //this makes sure we click the last fold element on the page. other elements have the class 'fold'
            }
            else {
                if ([1, 2, 3, 4].includes(position)) {
                    if (!pair) {  //we are always considering pairs anyway, and this way we know we are getting flipped version
                        decideAgainstOpen(position, cards, cardsFlipped)
                    }
                }
            }
        },
            randomNumber(950, 1850))

        lastPosition = position
    } catch (e) {
        console.log("caught somehtin: " + e)
    }

}

function isPlayable(cards, position) {
    try {
        //console.log(playableHands)
        if (position == 1) { //BB
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/1-BB/BB-defend.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 2) { //SB
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/2-SB/SB-open.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 3) { //BU
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/3-BU/BU-open.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 4) { //CO
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/4-CO/position4-open.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 5) { //HJ
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/5-HJ/position5-over175.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 6) { //LJ
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/6-MP2/position6-over175.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 7) { //UTG+2
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/7-MP1/position7.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 8) { //UTG+1
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/8-UTG1/positions8-9.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 9) { //UTG
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/9-UTG/positions8-9.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
        if (position == 10) { //10
            var playable = setTimeout(readTextFile("http://127.0.0.1:8887/9-UTG/positions8-9.txt"), 500)
            if (playableHands.includes(cards)) {
                return true
            }
            else {
                return false
            }
        }
    } catch (e) {
        console.log("caught somehtin: " + e)
    }
}

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest()
    rawFile.open("GET", file, false)
    rawFile.onreadystatechange = () => {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                playableHands = rawFile.responseText
                return
            }
        }
    }
    rawFile.send(null)
}

function randomNumber(min, max) {
    return Math.random() * (max - min) + min
}

function getYourPosition() {

    //TODO: find if we are in a straddled pot. Partly-implemented
    var s = document.getElementsByClassName('live-straddle')
    console.log('straddle stuff')
    console.log(s[0])
    if (s[0]) {
        isStraddle = true
    }
    else {
        isStraddle = false
    }
    console.log(isStraddle)
    var you = document.getElementsByClassName('you-player')
    var initialBetValue = you[0].children[2].innerText.replace(/\n|\r/g, "")
    console.log(initialBetValue)

    if (initialBetValue === SB) {
        console.log('position is SB')
        return 1
    }
    if (initialBetValue === BB) {
        console.log('position is BB')
        return 0
    }
    //BU open
    var bu = document.getElementsByClassName('dealer-position-1')
    console.log(bu.length)
    if (bu.length == 1) {
        console.log('position is BU')
        return 2
    }

    var y = document.getElementsByClassName('seats')
    var arr = Array.from(y[0].children)
    var buttonPosition = 0
    buttonPosition = arr[0].classList[1].charAt(arr[0].classList[1].length - 1)
    if (arr[0].classList[1].charAt(arr[0].classList[1].length - 1) === '0') { //edge case that we have double digit number at end of string (10)
        buttonPosition = 10
    }
    console.log(buttonPosition)
    var array = []
    var i
    console.log(arr)
    for (i = 0; i < arr.length - 1; i++) {
        // this shows the HTML of the players   
        //console.log(arr[i + 1].children[3])
        if (arr[i + 1].children[3].classList.length > 1) {
            if (arr[i + 1].children[3].classList[0] !== 'table-player-status-icon' && arr[i + 1].children[3].innerText !== 'AWAY') {  //denotes quitting or in-next-hand or standing
                //the actual status of standing is arr[i + 1].children[3].classList[1] === 'standing-up'
                //can also check for arr[i + 1].children[3].innerText == 'AWAY'. But if they are AWAY (OFFLINE) it might miss it
                array.push(arr[i + 1])
            }
        }
        else {
            array.push(arr[i + 1])
        }
    }
    for (i = 0; i < array.length; i++) {
        if (array[i].classList[1].includes(buttonPosition.toString())) {
            console.log(array[i].classList[1])
            console.log('found')
            break
        }
        //we find which of the player elements contain the buttonPosition number, then have the list start with them and find where we are relative to them
        //array[i].innerText contains chip amount and name of player
    }

    var first = array.slice(0, i)
    var second = array.slice(i)
    var result = second.concat(first)
    var finalList = []

    first = result.slice(0, 2)
    second = result.slice(2)
    result = second.concat(first)
    finalList[0] = result[0]

    for (i = 1; i < result.length; i++) {
        finalList[i] = result[result.length - i]
    }
    var currentPlayerIndex
    var currentPlayerChipCount

    // console.log(finalList)
    for (i = 0; i < finalList.length; i++) {
        if (finalList[i].classList[1] === 'table-player-1') {
            console.log('exists')
            currentPlayerIndex = i
            let currentPlayerNode = finalList[i]
            var split = currentPlayerNode.innerText.split("\n")
            currentPlayerChipCount = split[split.length - 1] / BB
            //console.log(split[split.length - 1] / BB)
            //count not accurate, needs debugging
            //console.log(currentPlayerNode.innerText)
            break
        }
    }
    console.log('current index: ' + currentPlayerIndex)
    //do element.classList.contains(class) to find if a player is away or quitting or in next hand. check for 'table-player-status-icon standing-up'
    return currentPlayerIndex
}

function extraTime() {
    try {
        betNum = 0
        console.log('setting call observer')
        y2 = document.getElementsByClassName('normal-time')
        //TODO: solution for BB: if BB, we need to check for bets by the players which will need to have alot of
        // listeners for the changes in child elements by each player. a real pain in the ass to implement
        targetNode2 = y2[0]
        config2 = { characterData: true, subtree: true, attributesList: ["style"], attributeOldValue: true }
        callback = function (mutationsList) {
            for (var mutation of mutationsList) {
                if (mutation.type == 'childList') {
                    console.log('A child node has been added or removed.')
                    console.log(mutation)
                }
                else if (mutation.type == 'attributes') {
                    console.log('The ' + mutation.attributeName + ' attribute was modified.')
                }
                // else {
                //     console.log(mutation)
                // }
            }
        }
        observer = new MutationObserver(callback)
        observer.observe(targetNode2, config2)

    } catch (e) {
        console.log("caught somethin: " + e)
    }
}


function decideAgainstOpen(position, cards, cardsFlipped) {

    try {
        betNum = 0
        console.log('setting call observer')
        y2 = document.getElementsByClassName('call')

        //TODO: solution for BB: if BB, we need to check for bets by the players which will need to have alot of
        // listeners for the changes in child elements by each player. a real pain in the ass to implement
        targetNode2 = y2[0]

        config2 = { characterData: true, subtree: true, attributes: false, childList: false }

        callback = function (mutationsList) {
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
                    console.log(betNum)
                    if (betNum == 1) {
                        if (position == 2) { //SB
                            if (SB_facing_2bet_txt.includes(cards) || SB_facing_2bet_txt.includes(cardsFlipped)) {
                                return true
                            }
                            else {
                                var f = document.getElementsByClassName('fold')

                                if (f[f.length - 1]) {
                                    console.log('folding to 2bet')
                                    document.getElementsByClassName('fold')[f.length - 1].click()
                                    return false
                                }
                            }
                        }
                        if (position == 3) { //BU
                            if (BU_facing_2bet_txt.includes(cards) || BU_facing_2bet_txt.includes(cardsFlipped)) {
                                return true
                            }
                            else {
                                var f = document.getElementsByClassName('fold')

                                if (f[f.length - 1]) {
                                    console.log('folding to 2bet')
                                    document.getElementsByClassName('fold')[f.length - 1].click()
                                    return false
                                }
                            }
                        }

                    }
                    else if (betnum == 2) {
                        //for now the SB and BU will have the same cards considered for facing 3bet,
                        //although SB should be folding much more
                        console.log('facing 3bet')
                        if (position >= 1) { //SB or greater for now
                            // TODO: if(getPlayerChips() > 500)
                            if (BU_facing_3bet_deep_txt.includes(cards) || BU_facing_3bet_deep_txt.includes(cardsFlipped)) {
                                return true
                            }
                            else {
                                var f = document.getElementsByClassName('fold')

                                if (f[f.length - 1]) {
                                    console.log('folding to 3bet')
                                    alert("folded to 3bet")
                                    document.getElementsByClassName('fold')[f.length - 1].click()
                                    return false
                                }
                            }
                        }
                    }
                }
            }
        }

        // Create an observer instance linked to the callback function
        observer = new MutationObserver(callback)
        observer.observe(targetNode2, config2)

    } catch (e) {
        console.log("caught somehtin: " + e)
    }
}

function loadRangeFiles() {
    var rawFile = new XMLHttpRequest()
    rawFile.open("GET", "http://127.0.0.1:8887/2-SB/SB-facing-2bet.txt", false)
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
    rawFile.open("GET", "http://127.0.0.1:8887/3-BU/BU-facing-2bet.txt", false)
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
    rawFile.open("GET", "http://127.0.0.1:8887/3-BU/BU-facing-3bet-short.txt", false)
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
    rawFile.open("GET", "http://127.0.0.1:8887/3-BU/BU-facing-3bet-med.txt", false)
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
    rawFile.open("GET", "http://127.0.0.1:8887/3-BU/BU-facing-3bet-deep.txt", false)
    rawFile.onreadystatechange = () => {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                BU_facing_3bet_deep_txt = rawFile.responseText
                return
            }
        }
    }
    rawFile.send(null)
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
        scriptRunning = 1
    }
}