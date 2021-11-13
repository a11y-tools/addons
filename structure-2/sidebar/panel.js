/*
*   panel.js
*/

import ListBox from '../listbox.js';
import { saveOptions } from '../storage.js';

var myWindowId;
var logInfo = false;
var listBox;

// Get message strings from locale-specific messages.json file
const getMessage = browser.i18n.getMessage;

const emptyContent         = getMessage("emptyContent");
const noHeadingElements    = getMessage("noHeadingElements");
const tabIsLoading         = getMessage("tabIsLoading");
const protocolNotSupported = getMessage("protocolNotSupported");

function addLabelsAndHelpContent () {
  // page-title-label and headings-label
  document.getElementById('page-title-label').textContent =
    getMessage("pageTitleLabel");
  document.getElementById('headings-label').textContent =
    getMessage("headingsLabel");

  // button labels
  document.getElementById('search-button').textContent =
    getMessage("searchButtonLabel");
  document.getElementById('clear-button').textContent =
    getMessage("clearButtonLabel");

  // help-label, help-highlight, help-active and help-focus content
  document.getElementById('help-label').textContent =
    getMessage("helpLabel");
  document.getElementById('help-highlight').textContent =
    getMessage("helpHighlight");
  document.getElementById('help-activate').textContent =
    getMessage("helpActivate");
  document.getElementById('help-focus').textContent =
    getMessage("helpFocus");
}

/*
*   When the sidebar loads, store the ID of the current window and update
*   the sidebar content.
*/
browser.windows.getCurrent({ populate: true }).then( (windowInfo) => {
  myWindowId = windowInfo.id;
  addLabelsAndHelpContent();
  updateContent('getCurrent');
});

/*
*   Generic error handler
*/
function onError (error) {
  console.log(`Error: ${error}`);
}

//--------------------------------------------------------------
//  Functions that handle ListBox selection and button actions
//--------------------------------------------------------------

/*
*   onListBoxAction: Called from ListBox event handlers
*/
function onListBoxAction (data) {
  if (data.index < 0) return;

  switch (data.action) {
    case 'navigate':
      console.log(`navigate: ${data.index}`);
      updateButton(false);
      break;
    case 'activate':
      console.log(`activate: ${data.index}`)
      sendButtonActivationMessage({
        id: 'find',
        index: data.index
      });
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
*   highlightSelectedOption
*/
function highlightSelectedOption (event) {
  sendButtonActivationMessage({
    id: 'find',
    index: listBox.optionsList.indexOf(listBox.selectedOption)
  });
}

/*
*   removeHighlighting
*/
function removeHighlighting (event) {
  sendButtonActivationMessage({
    id: 'clear'
  });
}

/*
*   sendButtonActivationMessage
*/
function sendButtonActivationMessage (data) {
  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, data);
  });
}

/*
*   Add listeners for the search and clear buttons.
*/
document.getElementById('search-button').addEventListener('click', highlightSelectedOption);
document.getElementById('clear-button').addEventListener('click', removeHighlighting);

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

function handleWindowFocusChanged (windowId) {
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
}

//---------------------------------------------------------------
//  Functions that process and display data from content script
//---------------------------------------------------------------

/*
*   getFormattedData: Convert the contentInfo data into an HTML string with
*   internationalized labels.
*/
function getFormattedData (info) {
  return `<p>${info.title}</p>`;
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
  let pageTitle = document.getElementById('page-title-content');
  let headings = document.getElementById('headings-content');

  // page-title and headings
  if (typeof info === 'object') {
    // Update the page-title box
    pageTitle.innerHTML = getFormattedData(info);

    // Update the headings box
    if (info.infoList.length) {
      headings.innerHTML = formatStructureInfo(info.infoList);
      listBox = new ListBox(headings, onListBoxAction);
      updateButton(true);
    }
    else {
      headings.innerHTML = `<div class="grid-message">${noHeadingElements}</div>`;
    }
  }
  else {
    pageTitle.textContent = info;
    headings.textContent = '';
  }
}

//------------------------------------------------------
//  Functions that run the content script and initiate
//  processing of the data it sends via messaging
//------------------------------------------------------

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

/*
*   Add event listeners when sidebar loads
*/
window.addEventListener("load", function (e) {
  browser.tabs.onUpdated.addListener(handleTabUpdated, { properties: ["status"] });
  browser.tabs.onActivated.addListener(handleTabActivated);
  browser.windows.onFocusChanged.addListener(handleWindowFocusChanged);
});
