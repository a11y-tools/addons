/*
*   background.js
*/
var sidebarIsOpen;

browser.browserAction.onClicked.addListener(function (e) {
  if (sidebarIsOpen) {
    browser.sidebarAction.close();
  }
  else {
    browser.sidebarAction.open();
  }
});
