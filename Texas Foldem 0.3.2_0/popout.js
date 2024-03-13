
var totalClicks = 0;

document.querySelector('#go-to-options').addEventListener('click', function() {
    console.log("go-to-options")
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
});

let startBtn = document.querySelector('#start-button');

startBtn.addEventListener('click', () => {
    startBtn.style.backgroundColor = 'black';
    startBtn.style.color = 'green';
})
document.querySelector('.start-script').addEventListener('click', function () {
    //background gets automatically executed

    try {
        totalClicks = sessionStorage.getItem('totalClicks')
    } catch (e) {

    }
    totalClicks++;
    console.log(totalClicks)
    sessionStorage.setItem('totalClicks', totalClicks)
    if (totalClicks > 1) {
        return 0
    }
    console.log('executing script')
    var currentTabId
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){   
        currentTabId = tabs[0].id;
        console.log(currentTabId)
        chrome.scripting.executeScript({
            target: {tabId: currentTabId, allFrames: true},
            files: ['foreground.js']
        });
    });


});

document.querySelector('.store-text').addEventListener('click', function () {
    chrome.storage.sync.set({ mytext: "yo" });
    newWin = window.open('range-select.html', 'range', 'width=800,height=500');
});

document.querySelector('.show-text').addEventListener('click', function () {
    var textdata
    chrome.storage.sync.get('mytext', function (data) {
        console.log(data.mytext)
    });
});

