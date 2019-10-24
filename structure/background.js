/*
*   background.js
*/
var sidebarIsOpen;

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
