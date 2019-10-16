/*
*   content.js
*/
browser.runtime.sendMessage({
  url: window.location.href,
  title: document.title,
  infoList: getInfo()
});

if (true) console.log(window.location.href);

function getInfo () {
  function isHeadingElement (name) {
    let allHeadings = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    return (allHeadings.indexOf(name) >= 0);
  }

  let treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    { acceptNode: function (node) { return isHeadingElement(node.tagName) } },
    false
  );

  let infoList = [];

  while (treeWalker.nextNode()) {
    let node = treeWalker.currentNode;
    let nodeInfo = {
      name: node.tagName,
      text: node.textContent
    }
    infoList.push(nodeInfo);
  }

  return infoList;
}
