/*
*   content.js
*/
var headingRefs;

browser.runtime.sendMessage({
  infoList: getInfo(),
  title: document.title,
  url: window.location.href
});

browser.runtime.onMessage.addListener (
  function (request, sender, sendResponse) {
    if (request.id !== 'find') return;
    let element = headingRefs[request.index];
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
});

/*
*   isVisible: Recursively check element properties from getComputedStyle
*   until document element is reached, to determine whether element or any
*   of its ancestors has properties set that affect its visibility.
*/
function isVisible (element) {
  if (element.nodeType === Node.DOCUMENT_NODE) return true;

  if (element.nodeType === Node.ELEMENT_NODE) {
    let computedStyle = window.getComputedStyle(element, null);
    let display    = computedStyle.getPropertyValue('display');
    let visibility = computedStyle.getPropertyValue('visibility');
    let hidden     = element.getAttribute('hidden');
    let ariaHidden = element.getAttribute('aria-hidden');

    if ((display === 'none') || (visibility === 'hidden') ||
        (hidden !== null) || (ariaHidden === 'true')) {
      return false;
    }
  }
  return isVisible(element.parentNode);
}

/*
*   isHeading: Determine whether element is a heading based on its tagName.
*/
function isHeading (element) {
  let headingNames = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  return (headingNames.indexOf(element.tagName) >= 0);
}

/*
*   getDescendantTextContent: Collect the textContent values of child text
*   nodes, and descendant text nodes of child elements that meet the predicate
*   condition, by storing the values in the results array.
*/
function getDescendantTextContent (node, predicate, results) {
  // Process the child nodes
  for (let i = 0; i < node.childNodes.length; i++) {
    let child = node.childNodes[i];

    switch (child.nodeType) {
      case (Node.ELEMENT_NODE):
        if (predicate(child)) {
          getDescendantTextContent(child, predicate, results);
        }
        break;
      case (Node.TEXT_NODE):
        let content = child.textContent.trim();
        if (content.length) { results.push(content); }
        break;
    }
  }
}

/*
*   getInfo: Use the traverseDom function to recursively find each visible
*   heading element in the document, collect its text content from visible
*   child elements and store all relevant info in the returned infoList.
*/
function getInfo () {
  let infoList = [];

  // Reset headingRefs array
  headingRefs = [];

  function traverseDom (startElement) {
    // Process the child elements
    for (let i = 0; i < startElement.children.length; i++) {
      let element = startElement.children[i];
      // Save information if element meets criteria
      if (isHeading(element) && isVisible(element)) {
        let results = [];
        getDescendantTextContent(element, isVisible, results);
        let headingInfo = {
          name: element.tagName,
          text: results.length ? results.join(' ') : ''
        }
        infoList.push(headingInfo);
        headingRefs.push(element);
      }
      else {
        traverseDom(element);
      }
    }
  }

  // Start with body element and traverse entire DOM
  traverseDom(document.body);
  return infoList;
}
