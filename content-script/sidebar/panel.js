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
  getContent();
});

/*
*   Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(getContent);

/*
*   Update content when a new tab becomes active.
*/
browser.tabs.onActivated.addListener(getContent);

/*
*   Listen for messages from the content script.
*/
browser.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    updateSidebar(request);
  }
);

/*
*   getContent: Initiate processing that will return, via messaging, the
*   current content information from the active tab.
*/
function getContent () {
  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    let tab = tabs[0];
    if (tab.url.indexOf('http:') != 0 && tab.url.indexOf('https:') != 0) {
      updateSidebar (protocolNotSupported);
    }
    else {
      browser.tabs.executeScript(null, { file: '../content.js' });
    }
  });
}

/*
*   getFormattedData: Convert the message data into an HTML string with
*   internationalized labels.
*/
function getFormattedData (message) {
  return `<h3>${titleLabel}</h3>
          <p>${message.title}</p>
          <h3>${urlLabel}</h3>
          <p>${message.url}</p>`;
}

/*
*   updateSidebar: Display the content sent by the content script.
*/
function updateSidebar (message) {
  let content = document.getElementById('content');

  // sidebar title
  document.getElementById('title').textContent = sidebarTitle;

  // sidebar content
  if (typeof message === 'object') {
    content.innerHTML = getFormattedData(message);
  }
  else {
    content.textContent = message;
  }
}

/*
*   Generic error handler
*/
function onError (error) {
  console.log(`Error: ${error}`);
}

/*
*   Update the variable in background script used for toggling sidebar
*/
function updateOpenStatus (isOpen) {
  function onGotPage (page) {
    page.sidebarIsOpen = isOpen;
    console.log(`open status: ${isOpen}`);
  }

  let gettingPage = browser.runtime.getBackgroundPage();
  gettingPage.then(onGotPage, onError);
}

window.addEventListener("load",   function (e) { updateOpenStatus(true) });
window.addEventListener("unload", function (e) { updateOpenStatus(false) });
