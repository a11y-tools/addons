/*
*   content.js
*/
browser.runtime.sendMessage({
  url: window.location.href,
  title: document.title
});
