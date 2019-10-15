var myWindowId;

// Get message strings from locale-specific messages.json file
let getMessage = browser.i18n.getMessage;
let sidebarTitle = getMessage("sidebarTitle");
let titleLabel = getMessage("contentTitle");
let urlLabel = getMessage("contentURL");
let protocolNotSupported = getMessage("protocolNotSupported");

/*
*   When the sidebar loads, store the ID of its window, and update its content.
*/
browser.windows.getCurrent({ populate: true }).then( (windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});

/*
*   getFormattedData: Convert the contentInfo data into an HTML string with
*   internationalized labels.
*/
function getFormattedData (info) {
  return `<h3>${titleLabel}</h3>
          <p>${info.title}</p>
          <h3>${urlLabel}</h3>
          <p>${info.url}</p>`;
}

function displayInfo (infoList) {
  for (let i = 0; i < infoList.length; i++)
    console.log(`${infoList[i].name}: ${infoList[i].text}`);
}

/*
*   Display the content generated by the content script.
*/
function updateSidebar (info) {
  let content = document.getElementById('content');

  // sidebar title
  document.getElementById('title').textContent = sidebarTitle;

  // sidebar content
  if (typeof info === 'object') {
    content.innerHTML = getFormattedData(info);
    displayInfo(info.infoList);
  }
  else {
    content.textContent = info;
  }
}

/*
*   Generic error handler
*/
function onError (error) {
  console.log(`Error: ${error}`);
}

/*
*   React to browser.tabs.onUpdated only when status is 'complete'
*/
let timeoutID;
function handleTabUpdate (tabId, changeInfo, tab) {
  clearTimeout(timeoutID);
  if (changeInfo.status === "complete") {
    updateContent();
  }
  else {
    timeoutID = setTimeout(function () {
      updateSidebar(changeInfo.status + '...');
    }, 250);
  }
}

/*
*   Update sidebar content by running the content script and then
*   referencing the contentInfo variable in the background script.
*/
function updateContent () {

  function onGotPage (page) {
    updateSidebar(page.contentInfo);
  }

  function onExecuted (result) {
    let gettingPage = browser.runtime.getBackgroundPage();
    gettingPage.then(onGotPage, onError);
  }

  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    let tab = tabs[0];
    if (tab.url.indexOf('http:') != 0 && tab.url.indexOf('https:') != 0) {
      updateSidebar (protocolNotSupported);
    }
    else {
      let executing = browser.tabs.executeScript({
        file: '../content.js'
      });
      executing.then(onExecuted, onError);
    }
  });
}

/*
*   Update variable in background script used for toggling sidebar
*/
function updateOpenStatus (isOpen) {
  function onGotPage (page) {
    page.sidebarIsOpen = isOpen;
    console.log(`open status: ${isOpen}`);
  }

  let gettingPage = browser.runtime.getBackgroundPage();
  gettingPage.then(onGotPage, onError);
}

/*
*   Load and unload event listeners and keep track of sidebar status
*/
window.addEventListener("load",   function (e) {
  updateOpenStatus(true);
  browser.tabs.onUpdated.addListener(handleTabUpdate, { properties: ["status"] });
  browser.tabs.onActivated.addListener(updateContent);
});

window.addEventListener("unload", function (e) {
  updateOpenStatus(false);
  browser.tabs.onUpdated.removeListener(handleTabUpdate);
  browser.tabs.onActivated.removeListener(updateContent);
});
