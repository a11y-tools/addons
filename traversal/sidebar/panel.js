var myWindowId;

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
  let msg = "This extension only supports 'http' and 'https' protocols."
  browser.tabs.query({ windowId: myWindowId, active: true })
  .then((tabs) => {
    let tab = tabs[0];
    if (tab.url.indexOf('http:') != 0 && tab.url.indexOf('https:') != 0) {
      updateSidebar (msg)
    }
    else {
      browser.tabs.executeScript(null, { file: '../content.js' });
    }
  });
}

function getFormattedData (message) {
  return `<h3>Title</h3>
          <p>${message.title}</p>
          <h3>URL</h3>
          <p>${message.href}</p>`;
}

/*
*   updateSidebar: Display the content sent by the content script.
*/
function updateSidebar (message) {
  let content = '';
  if (typeof message === 'object') {
    content = getFormattedData(message);
  }
  else {
    content = message;
  }

  document.getElementById('content').innerHTML = content;
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
