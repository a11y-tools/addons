var myWindowId;
var logInfo = false;
var listBox;

// Get message strings from locale-specific messages.json file
let getMessage = browser.i18n.getMessage;
let pageInfoTitle        = getMessage("pageInfoTitle");
let pageTitle            = getMessage("pageTitle");
let pageUrl              = getMessage("pageUrl");
let structureTitle       = getMessage("structureTitle");
let emptyContent         = getMessage("emptyContent");
let noHeadingElements    = getMessage("noHeadingElements");
let tabIsLoading         = getMessage("tabIsLoading");
let protocolNotSupported = getMessage("protocolNotSupported");

/*
*   When the sidebar loads, store the ID of the current window and update
*   the sidebar content.
*/
browser.windows.getCurrent({ populate: true }).then( (windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent('getCurrent');
});

/*
*   Generic error handler
*/
function onError (error) {
  console.log(`Error: ${error}`);
}

//-----------------------------------------
//  Functions that handle ListBox actions
//-----------------------------------------

/*
*   onListBoxAction: Called from ListBox event handlers
*/
function onListBoxAction (data) {
  let index = data.index;
  if (index < 0) return;

  switch (data.action) {
    case 'navigate':
      console.log(`navigate: ${index}`);
      updateButton(false);
      break;
    case 'activate':
      console.log(`activate: ${index}`)
      scrollPageToSelection(index);
      break;
  }
}

/*
*   updateButton
*/
function updateButton (flag) {
  let button = document.getElementById('search-button');

  if (flag) {
    button.setAttribute('disabled', true);
  }
  else {
    button.removeAttribute('disabled');
  }
}

/*
*   scrollPageToSelection
*/
function scrollPageToSelection (index) {
  let data = { id: 'find', index: index };

  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, data);
  });
}

/*
*   handleSearchButtonActivation
*/
function handleSearchButtonActivation (event) {
  let index = listBox.optionsList.indexOf(listBox.selectedOption);
  scrollPageToSelection(index);
}

/*
*   Add listeners for the search and clear buttons.
*/
document.getElementById('search-button').addEventListener('click', handleSearchButtonActivation);

document.getElementById('clear-button').addEventListener('click', function () {
  browser.find.removeHighlighting();
});

//-----------------------------------------------
//  Functions that handle tab and window events
//-----------------------------------------------

/*
*   Handle tabs.onUpdated event when status is 'complete'
*/
let timeoutID;
function handleTabUpdated (tabId, changeInfo, tab) {
  // Skip content update when new page is loaded in background tab
  if (!tab.active) return;

  clearTimeout(timeoutID);
  if (changeInfo.status === "complete") {
    updateContent('handleTabUpdated');
  }
  else {
    timeoutID = setTimeout(function () {
      updateSidebar(tabIsLoading);
    }, 250);
  }
}

/*
*   Handle tabs.onActivated event
*/
function handleTabActivated (activeInfo) {
  if (logInfo) console.log(activeInfo);

  updateContent('handleTabActivated');
}

/*
*   Handle window focus change events by checking whether the sidebar is
*   open in the newly focused window, and if so, save the new window ID
*   and update the sidebar content.
*/
browser.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== myWindowId) {
    let checkingOpenStatus = browser.sidebarAction.isOpen({ windowId });
    checkingOpenStatus.then(onGotStatus, onInvalidId);
  }

  function onGotStatus (result) {
    if (result) {
      myWindowId = windowId;
      updateContent('onFocusChanged');
      if (logInfo) console.log(`Focus changed to window: ${myWindowId}`);
    }
  }

  function onInvalidId (error) {
    if (logInfo) console.log(`onInvalidId: ${error}`);
  }
});

//---------------------------------------------------------------
//  Functions that process and display data from content script
//---------------------------------------------------------------

/*
*   getFormattedData: Convert the contentInfo data into an HTML string with
*   internationalized labels.
*/
function getFormattedData (info) {
  return `<h3>${pageTitle}</h3>
          <p>${info.title}</p>
          <h3>${pageUrl}</h3>
          <p>${info.url}</p>`;
}

/*
*   Format the heading info as HTML, with the appropriate class names for
*   the grid layout.
*/
function getClassNames (name) {
  switch (name) {
    case 'H1': return ['h1-name', 'h1-text'];
    case 'H2': return ['h2-name', 'h2-text'];
    case 'H3': return ['h3-name', 'h3-text'];
    case 'H4': return ['h4-name', 'h4-text'];
    case 'H5': return ['h5-name', 'h5-text'];
    case 'H6': return ['h6-name', 'h6-text'];
  }
}

function formatStructureInfo (infoList) {
  let html = '';
  for (let i = 0; i < infoList.length; i++) {
    let name = infoList[i].name, text = infoList[i].text;
    if (text.trim() === '') text = `<span class="empty">${emptyContent}</span>`;
    let classNames = getClassNames(name);
    html += `<div class="list-option"><div class="${classNames[0]}">${name}</div><div \
    class="${classNames[1]}">${text}</div></div>`;
  }
  return html;
}

/*
*   Display the content generated by the content script.
*/
function updateSidebar (info) {
  let pageInfo  = document.getElementById('page-info-content');
  let structure = document.getElementById('structure-content');

  // page-info and structure titles
  document.getElementById('page-info-title').textContent = pageInfoTitle;
  document.getElementById('structure-title').textContent = structureTitle;

  // page-info and structure content
  if (typeof info === 'object') {
    // Update the page-info-content box
    pageInfo.innerHTML = getFormattedData(info);

    // Update the structure-content box
    if (info.infoList.length) {
      structure.innerHTML =  formatStructureInfo(info.infoList);
      let gettingPage = browser.runtime.getBackgroundPage();
      gettingPage.then(onGotPage, onError);
    }
    else {
      structure.innerHTML = `<div class="grid-message">${noHeadingElements}</div>`;
    }
  }
  else {
    pageInfo.textContent = info;
    structure.textContent = '';
  }

  // Reset listBox object after structure.innerHTML is updated
  function onGotPage (page) {
    listBox = new page.ListBox(structure, onListBoxAction);
    updateButton(true);
  }
}

//-----------------------------------------------------------------------
//  Functions that run the content script and process the data it sends
//-----------------------------------------------------------------------

/*
*   Update sidebar content by running the content script. When the
*   onMessage handler receives the message from the content script,
*   it calls the updateSidebar function.
*/
function updateContent (callerFn) {
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

  function onExecuted (result) {
    if (logInfo) console.log(`Content script invoked by ${callerFn}`);
  }
}

/*
*   Listen for messages from the content script and listbox
*/
browser.runtime.onMessage.addListener(
  function (message, sender) {
    switch (message.id) {
      case 'info':
        updateSidebar(message);
        break;
    }
  }
);

//-----------------------------------------------------
//  Functions for handling load and unload of sidebar
//-----------------------------------------------------

/*
*   Update variable in background script used for toggling sidebar
*/
function updateOpenStatus (isOpen) {
  function onGotPage (page) {
    page.sidebarIsOpen = isOpen;
    if (logInfo) console.log(`open status: ${isOpen}`);
  }

  let gettingPage = browser.runtime.getBackgroundPage();
  gettingPage.then(onGotPage, onError);
}

/*
*   Load and unload event listeners and keep track of sidebar status
*/
window.addEventListener("load",   function (e) {
  updateOpenStatus(true);
  browser.tabs.onUpdated.addListener(handleTabUpdated, { properties: ["status"] });
  browser.tabs.onActivated.addListener(handleTabActivated);
});

window.addEventListener("unload", function (e) {
  updateOpenStatus(false);
  browser.tabs.onUpdated.removeListener(handleTabUpdated);
  browser.tabs.onActivated.removeListener(handleTabActivated);
});
