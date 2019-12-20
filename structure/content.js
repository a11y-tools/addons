/*
*   content.js
*/
var headingRefs;
var className = 'structureExtensionHighlight';
var classProperties = `{
  position:   absolute;
  overflow:   hidden;
  box-sizing: border-box;
  border:     3px solid cyan;
  z-index:    10000; }
}`;

/*
*   Add highlighting stylesheet to document.
*/
(function () {
  let sheet = document.createElement('style');
  sheet.innerHTML = '.' + className + ' ' + classProperties;
  document.body.appendChild(sheet);
})();

/*
*   Send 'info' message with page and heading information to sidebar script.
*/
browser.runtime.sendMessage({
  id: 'info',
  infoList: getInfo(),
  title: document.title,
  url: window.location.href
});

/*
*   Respond to 'find' and 'clear' messages by highlighting and scrolling to
*   the element specified or removing the highlighting
*/
browser.runtime.onMessage.addListener (
  function (message, sender) {
    switch (message.id) {
      case 'find':
        let element = headingRefs[message.index];
        if (isInPage(element)) {
          addHighlightBox(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        else {
          console.log('Element was removed from DOM: ' + element)
        }
        break;

      case 'clear':
        removeOverlays();
        break;
    }
});

/*
*   addHighlightBox: Clear previous highlighting and add highlight border box
*   to specified element.
*/
function addHighlightBox (element) {
  let boundingRect = element.getBoundingClientRect();
  removeOverlays();

  let overlayNode = createOverlay(boundingRect);
  document.body.appendChild(overlayNode);
}

/*
*   createOverlay: Use bounding client rectangle and offsets to create an element
*   that appears as a highlighted border around element corresponding to 'rect'.
*/
function createOverlay (rect) {
  const MIN_WIDTH = 68;
  const MIN_HEIGHT = 27;
  const OFFSET = 5;

  let node = document.createElement('div');
  node.setAttribute('class', className);

  node.style.left   = Math.round(rect.left - OFFSET + window.scrollX) + 'px';
  node.style.top    = Math.round(rect.top  - OFFSET + window.scrollY) + 'px';

  node.style.width  = Math.max(rect.width  + OFFSET * 2, MIN_WIDTH)  + 'px';
  node.style.height = Math.max(rect.height + OFFSET * 2, MIN_HEIGHT) + 'px';

  return node;
}

/*
*   removeOverlays: Utilize 'className' to remove highlight overlays created
*   by previous calls to 'addHighlightBox'.
*/
function removeOverlays () {
  let selector = 'div.' + className;
  let elements = document.querySelectorAll(selector);
  Array.prototype.forEach.call(elements, function (element) {
    document.body.removeChild(element);
  });
}

/*
*   isInPage: This function checks to see if an element is a descendant of
*   the page's body element. Because 'contains' is inclusive, isInPage returns
*   false when the argument is the body element itself.
*   MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
*/
function isInPage (element) {
  if (element === document.body) return false;
  return document.body.contains(element);
}

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
