/*
*   background.js
*/
var sidebarIsOpen;
var contentInfo;

/*
*   Toggle the sidebar when browserAction button is clicked
*/
browser.browserAction.onClicked.addListener(function (e) {
  if (sidebarIsOpen) {
    browser.sidebarAction.close();
  }
  else {
    browser.sidebarAction.open();
  }
});

/*
*   Listen for messages from the content script
*/
browser.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    contentInfo = request;
  }
);
