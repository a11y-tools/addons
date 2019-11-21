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

/*
*   findSelectedHeading: This is currently using two different features to
*   accomplish its goal, which is to highlight the heading in the page and
*   scroll the window such that the highlighted heading is in view.
*
*   1. The browser.find API/methods .find  and .highlightResults are used
*      for highlighting the heading, until a better method is implemented.
*      This does not currently work in Firefox Developer Edition.
*   2. Scrolling the window to the selected heading is accomplished via the
*      message sent to the content script, which includes the index of the
*      heading element reference, stored in the headingRefs array, which is
*      retrieved and used to call the element.scrollIntoView method.
*
*   Note: This handler will only be called when there is an actual selection,
*   due to the action of the document.onselectionchange handler, which enables
*   the search button only when a selection has been made.
*/
function findSelectedHeading () {
  let logInfo = true;

  let selection = document.getSelection();
  let data = { id: 'find', index: selection.anchorNode.dataset.index };

  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, data);
  });

  browser.find.removeHighlighting();
  let searching = browser.find.find(selection.toString());
  searching.then(onFoundSelection, onError);

  function onFoundSelection (results) {
    if (results.count > 0) {
      browser.find.highlightResults();
    }

    if (logInfo) {
      console.log(`Found ${results.count} instance(s) of '${selection}'`);
    }
  }
}

/*
*   scrollToSelectedHeading
*/
function scrollToSelectedHeading () {
  let index = parseInt(listBox.selectedOption.id.substring(4));
  let data = { id: 'find', index: index };

  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, data);
  });
}

/*
*   Add listeners for the search and clear buttons.
*/
document.getElementById('search-button').addEventListener('click', scrollToSelectedHeading);

document.getElementById('clear-button').addEventListener('click', function () {
  browser.find.removeHighlighting();
});

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
    html += `<div class="list-item"><div class="${classNames[0]}">${name}</div><div \
    class="${classNames[1]}" data-index="${i}">${text}</div></div>`;
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
    listBox = new page.ListBox(structure);
    updateButton(true);
  }
}

/*
*   Handle tabs.onUpdated event, but only when status is 'complete'. There
*   can be numerous calls to this event handler, as multiple events are
*   triggered while the tab is updating, e.g. status is 'loading'.
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
*   Manage the 'disabled' state of the search button by handling text
*   selection change events in the sidebar structure-content div.
*/
document.onselectionchange = function() {
  let selection = document.getSelection();
  let button = document.getElementById('search-button');

  if (selection.toString() === '') {
    button.setAttribute('disabled', true);
  }
  else {
    button.removeAttribute('disabled');
  }
};

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
*   Listen for messages from the content script and listbox
*/
browser.runtime.onMessage.addListener(
  function (message, sender) {

    switch (message.id) {
      case 'info':
        updateSidebar(message);
        break;
      case 'select':
        updateButton(false);
        console.log(`panel.js onMessage: ${message.tabId} ${message.optionId}`);
        break
    }

  }
);

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
