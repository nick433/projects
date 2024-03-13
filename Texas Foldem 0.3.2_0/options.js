var customRangeAddressValue
var userKeyValue
var checkBoxAgreementValue
var pauseOnPauseValue
var pauseOnBpValue

loadConfigData()

console.log(customRangeAddressValue)

document.addEventListener("focus", function(){
    alert('page clicked')
  })
  //TODO: get this to actually work and recognize the tab was switched to

async function loadConfigData(){
    //show text data 
    customRangeAddressValue = await getFromStorage("customRangeAddress");
    console.log(customRangeAddressValue)
    if(customRangeAddressValue){
        document.getElementById("customRangeAddress").value = customRangeAddressValue;
    }

    userKeyValue = await getFromStorage("texasFoldemuserKey");
    console.log(userKeyValue)
    if(userKeyValue){
        document.getElementById("userKey").value = userKeyValue;
    }

    checkBoxAgreementValue = await getFromStorage("checkBoxAgreement");
    console.log(checkBoxAgreementValue)
    if(checkBoxAgreementValue){
        document.getElementById("checkbox-agreement").checked = checkBoxAgreementValue;
    }

    pauseOnPauseValue = await getFromStorage("stopWhenRoomPaused");
    console.log(pauseOnPauseValue)
    if(pauseOnPauseValue){
        document.getElementById("stop-when-room-paused").checked = pauseOnPauseValue;
    }

    pauseOnBpValue = await getFromStorage("stopWhenBpMentioned");
    console.log(pauseOnBpValue)
    if(pauseOnBpValue){
        document.getElementById("stop-when-bp-mentioned").checked = pauseOnBpValue;
    }

    testingModeValue = await getFromStorage("testingMode");
    console.log(testingModeValue)
    if(testingModeValue){
        document.getElementById("testing-mode").checked = testingModeValue;
    }

}



let saveRangeAddressButton = document.querySelector('#save-range-address');

saveRangeAddressButton.addEventListener('click', () => {
    saveRangeAddressButton.style.backgroundColor = 'black';
    saveRangeAddressButton.style.color = 'green';

    //disable editting?
    try {
        console.log(document.getElementById("customRangeAddress").value)
        chrome.storage.sync.set({ customRangeAddress: document.getElementById("customRangeAddress").value });
    } catch (e) {
    }
})

let saveuserKeyButton = document.querySelector('#save-user-key');

saveuserKeyButton.addEventListener('click', () => {
    saveuserKeyButton.style.backgroundColor = 'black';
    saveuserKeyButton.style.color = 'green';

    //disable editting?
    try {
        console.log(document.getElementById("userKey").value)
        chrome.storage.sync.set({ texasFoldemuserKey: document.getElementById("userKey").value });
    } catch (e) {
    }
})

let checkBoxAgreement = document.querySelector('#checkbox-agreement');

checkBoxAgreement.addEventListener('click', () => {

    try {
        console.log(document.getElementById("checkbox-agreement").checked)
        chrome.storage.sync.set({ checkBoxAgreement: document.getElementById("checkbox-agreement").checked });
    } catch (e) {
    }
})

let stopWhenBpMentioned = document.querySelector('#stop-when-bp-mentioned');

stopWhenBpMentioned.addEventListener('click', () => {

    try {
        console.log(document.getElementById("stop-when-bp-mentioned").checked)
        chrome.storage.sync.set({ stopWhenBpMentioned: document.getElementById("stop-when-bp-mentioned").checked });
    } catch (e) {
    }
})
let stopWhenRoomPaused = document.querySelector('#stop-when-room-paused');

stopWhenRoomPaused.addEventListener('click', () => {

    try {
        console.log(document.getElementById("stop-when-room-paused").checked)
        chrome.storage.sync.set({ stopWhenRoomPaused: document.getElementById("stop-when-room-paused").checked });
    } catch (e) {
    }
})

let testingMode = document.querySelector('#testing-mode');

testingMode.addEventListener('click', () => {

    try {
        console.log(document.getElementById("testing-mode").checked)
        chrome.storage.sync.set({ testingMode: document.getElementById("testing-mode").checked });
    } catch (e) {
    }
})

//keep this function at very bottom of page
function getFromStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, resolve);
    })
        .then(result => {
            if (key == null) return result;
            else return result[key];
        });
}


