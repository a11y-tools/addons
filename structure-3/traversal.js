/*
*   traversal.js
*/

function isCustom (element) {
  return (element.tagName.indexOf('-') > 0);
}

function isHeading (element) {
  return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName);
}

function isSlot (element) {
  return (element instanceof HTMLSlotElement);
}

/*
*   getLandmarkInfo: The 'name' param will be defined when the accessible name
*   was already evaluated as a criterion for determining whether 'element' is
*   to be considered a landmark (based on 'ARIA in HTML' specification).
*/
function getLandmarkInfo (element, role, name) {
  const accessibleName =
    (name === undefined) ? getAccessibleName(element) : name;

  return {
    role: role,
    name: accessibleName,
    visible: isVisible(element)
  }
}

/*
*   testForLandmark: If element is a landmark, return an object with properties
*   'role', 'name' and 'visible'; otherwise return null.
*/
function testForLandmark (element) {
  const roles = [
    'application',
    'banner',
    'complementary',
    'contentinfo',
    'form',
    'main',
    'navigation',
    'search'
  ];

  function isDescendantOfNames (element) {
    const names = ['article', 'aside', 'main', 'nav', 'section'];
    return names.some(name => element.closest(name));
  }

  function isDescendantOfRoles (element) {
    const roles = ['article', 'complementary', 'main', 'navigation', 'region'];
    return roles.some(role => element.closest(`[role="${role}"]`));
  }

  // determination is straightforward for element with 'role' attribute
  if (element.hasAttribute('role')) {
    const value = element.getAttribute('role');
    if (roles.includes(value)) {
      return getLandmarkInfo(element, value);
    }
    if (value === 'region') {
      const name = getAccessibleName(element);
      if (name.length) {
        return getLandmarkInfo(element, 'region', name);
      }
      return null;
    }
  }
  else { // element does not have 'role' attribute
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'aside') {
      return getLandmarkInfo(element, 'complementary');
    }

    if (tagName === 'main') {
      return getLandmarkInfo(element, 'main');
    }

    if (tagName === 'nav') {
      return getLandmarkInfo(element, 'navigation');
    }

    if (tagName === 'footer') {
      if (!(isDescendantOfNames(element) || isDescendantOfRoles(element))) {
        return getLandmarkInfo(element, 'contentinfo');
      }
      return null;
    }

    if (tagName === 'header') {
      if (!(isDescendantOfNames(element) || isDescendantOfRoles(element))) {
        return getLandmarkInfo(element, 'banner');
      }
      return null;
    }

    if (tagName === 'form') {
      const name = getAccessibleName(element);
      if (name.length) {
        return getLandmarkInfo(element, 'form', name);
      }
      return null;
    }

    if (tagName === 'section') {
      const name = getAccessibleName(element);
      if (name.length) {
        return getLandmarkInfo(element, 'region', name);
      }
      return null;
    }

  } // end else

  return null;
}

/*
*   getChildren: Return an array of HTMLElement children based on element's
*   properties related to web components.
*/
function getChildren (element) {
  // slot element
  if (isSlot(element)) {
    const assignedElements = (element.assignedElements().length)
      ? element.assignedElements()
      : element.assignedElements({ flatten: true });
    console.log(`<slot> name: ${element.name || 'null'}, items: ${assignedElements.length}`);
    return assignedElements;
  }
  // custom element
  if (isCustom(element)) {
    if (element.shadowRoot !== null) {
      return Array.from(element.shadowRoot.children);
    }
    else {
      return [];
    }
  }
  // default
  return Array.from(element.children);
}

function getHeadingInfo (element) {
  const results = [];
  getDescendantTextContent(element, isVisible, results);
  return {
    name: element.tagName,
    text: results.length ? results.join(' ') : ''
  }
}

function saveInfo (element, info) {
  if (isHeading(element) && isVisible(element)) {
    const headingInfo = getHeadingInfo(element);
    info.headings.push(headingInfo);
    headingRefs.push(element);
    return;
  }
  const landmarkInfo = testForLandmark(element);
  if (landmarkInfo && landmarkInfo.visible) {
    info.landmarks.push(landmarkInfo);
  }
}

/*
*   getStructureInfo: Traverse DOM and store relevant info for any elements
*   of interest in the 'info' object; return 'info' object.
*/
function getStructureInfo (panelPort) {
  const info = {
    headings: [],
    landmarks: []
  };

  // Reset headingRefs array (defined in content.js)
  headingRefs = [];

  function traverseDom (startElement) {
    // getChildren returns an array of elements based on criteria related
    // to whether startElement is (or is part of) a custom element
    const children = getChildren(startElement);

    children.forEach(element => {
      // Save information if element meets certain criteria
      saveInfo(element, info);

      // Recursively visit children of element
      traverseDom(element);
    });
  }

  traverseDom(document.body);

  // Send structure info to the panel.js script
  const message = {
    id: 'info',
    info: info,
    title: document.title
  };

  panelPort.postMessage(message);
}
