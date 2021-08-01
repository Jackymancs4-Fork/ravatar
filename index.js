// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
    h = h << 13 | h >>> 19;
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
}

function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    var t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const ROW_TYPE = {
  LINE: {
    type: 'LINE',
    nodes: 1,
    hasBg: false
  },
  LINE_DOT: {
    type: 'LINE_DOT',
    nodes: 2,
    hasBg: true
  },
  DOT_LINE: {
    type: 'DOT_LINE',
    nodes: 2,
    hasBg: true
  },
  DOT_DOT_DOT: {
    type: 'DOT_DOT_DOT',
    nodes: 3,
    hasBg: true
  },
  DOT_SPACE_DOT: {
    type: 'DOT_SPACE_DOT',
    nodes: 2,
    hasBg: true
  },
  DOT_DOT_SPACE: {
    type: 'DOT_DOT_SPACE',
    nodes: 2,
    hasBg: true
  },
  SPACE_DOT_DOT: {
    type: 'SPACE_DOT_DOT',
    nodes: 2,
    hasBg: true
  },
  SPACE_LINE: {
    type: 'SPACE_LINE',
    nodes: 1,
    hasBg: false
  },
  LINE_SPACE: {
    type: 'LINE_SPACE',
    nodes: 1,
    hasBg: false
  }
};

const GRADIENT_SETS = [
  // light blue
  {
    low: '#716bda',
    high: '#69e6ff',
    bgLow: 'rgba(113, 107, 218, 0.2)',
    bgHigh: 'rgba(105, 230, 255, 0.2)'
  },
  // light green
  {
    low: '#50e24c',
    high: '#80d57c',
    bgLow: 'rgba(101, 187, 97, 0.2)',
    bgHigh: 'rgba(80, 226, 76, 0.2)'
  },
  // gold
  {
    low: '#908542',
    high: '#e4df64',
    bgLow: 'rgba(187, 174, 97, 0.2)',
    bgHigh: 'rgba(250, 247, 182, 0.2)'
  },
  // red
  {
    low: '#862525',
    high: '#e94f4f',
    bgLow: 'rgba(134, 37, 37, 0.2)',
    bgHigh: 'rgba(233, 79, 79, 0.2)'
  },
  // purple
  {
    low: '#7253a1',
    high: '#9989b8',
    bgLow: 'rgba(114, 83, 161, 0.2)',
    bgHigh: 'rgba(153, 137, 184, 0.2)'
  },
  // lime
  {
    low: '#b6cd3c',
    high: '#d5f259',
    bgLow: 'rgba(182, 205, 60, 0.2)',
    bgHigh: 'rgba(213, 242, 89, 0.2)'
  },
  // "rose gold"
  {
    low: '#9e7c5d',
    high: '#e7b09c',
    bgLow: 'rgba(158, 124, 93, 0.2)',
    bgHigh: 'rgba(231, 176, 156, 0.2)'
  }
];

let Ravatar = { };

Ravatar.generate = function(seedStr) {
  // Seed and make a PRNGing function
  let seedFunc = xmur3(seedStr);
  let randFunc = sfc32(seedFunc(), seedFunc(), seedFunc(), seedFunc());
  
  // Generate properties of the avatar
  let avatarProps = { };
  avatarProps.roundedBg = true;
  avatarProps.hasBg = true;
  avatarProps.dark = true;
  avatarProps.isVertical = randFunc() >= 0.5; // 50/50
  avatarProps.rows = [];
  for (var i = 0; i < 3; i++) {
    avatarProps.rows[i] = ROW_TYPE[Object.keys(ROW_TYPE)[~~(randFunc() * Object.keys(ROW_TYPE).length)]];
  }
  avatarProps.gradientSet = GRADIENT_SETS[~~(randFunc() * GRADIENT_SETS.length)];
  let totalNodes = avatarProps.rows.reduce((a, c) => ({ nodes: a.nodes + c.nodes })).nodes;
  avatarProps.coloredNodes = [];
  let coloredCount = 0;
  for (var i = 0; i < totalNodes; i++) {
    avatarProps.coloredNodes[i] = randFunc() >= 0.65; // 35% for each node to be colored
    if (avatarProps.coloredNodes[i]) {
      coloredCount += 1;
    }
  }
  // Make sure at least one node is colored
  if (coloredCount == 0) {
    avatarProps.coloredNodes[~~(randFunc() * avatarProps.coloredNodes.length)] = true;
  }

  return avatarProps;
};

Ravatar.renderScaled = function(containerElement, avatarProps, size, scale) {
  containerElement.style.width = size
  containerElement.style.height = size

  Ravatar.render(containerElement, avatarProps, size * scale)
}

Ravatar.renderSVG = function(containerElement, avatarProps, size) {
  // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas/7838871#7838871
  function roundRect(context, x, y, w, h, r, color = 'red') {

    let rect = document.createElementNS('http://www.w3.org/2000/svg','rect')
    rect.setAttributeNS(null, 'x', x)
    rect.setAttributeNS(null, 'y', y)
    rect.setAttributeNS(null, 'width', w)
    rect.setAttributeNS(null, 'height', h)
    rect.setAttributeNS(null, 'rx', r)
    rect.setAttributeNS(null, 'ry', r)
    rect.setAttributeNS(null, 'fill', color)

    context.appendChild(rect)

    return context;
  }

  function getFillStyle(currentNode, avatarProps) {
    if (avatarProps.coloredNodes[currentNode]) {
      return lightLayerGradient;
    }
    else if (avatarProps.dark) {
      return '#f0f0f0';
    }
    else {
      return '#a0a0a0';
    }
  }

  containerElement.width = size;
  containerElement.height = size;
  let context = document.createElementNS('http://www.w3.org/2000/svg','svg');
  let defs = document.createElementNS('http://www.w3.org/2000/svg','defs');

  context.setAttributeNS(null, 'width', size)
  context.setAttributeNS(null, 'height', size)

  context.appendChild(defs)

  // Calculate some stuff
  const padding = containerElement.width / 6; // 1/6 of each side is padding totalling 1/3 of the canvas width
  let length = 4 * (containerElement.width / 6); // 4/6 or 2/3 of the area is for the glyph
  // Take the length and divide into 3 sections since 3 lines
  // A quarter of each trine is for margin,
  // but since the margin on the last line is not needed, add that back to the other two margins using *(3/2)
  const margin = (3 / 2) * (length / 3 / 4);
  const width = length / 4;
  // When there's a line and a space on the same row, the length of the line is different
  // Use (2/3) as a base then subtract half the length of the margin that would be included
  const halfLineLength = length * (2/3) - ((1/2) * (length / 3 / 4));

  // Render the background gradient
  if (avatarProps.hasBg) {
    let backgroundGradient = document.createElementNS('http://www.w3.org/2000/svg','linearGradient')
    backgroundGradient.id = "backgroundGradient"
    backgroundGradient.setAttributeNS(null, 'gradientUnits', "userSpaceOnUse")

    backgroundGradient.setAttributeNS(null, 'x1', '0')
    backgroundGradient.setAttributeNS(null, 'y1', size)
    backgroundGradient.setAttributeNS(null, 'x2', size)
    backgroundGradient.setAttributeNS(null, 'y2', '0')

    let firstStopColorBackgroundGradient = document.createElementNS('http://www.w3.org/2000/svg','stop')
    firstStopColorBackgroundGradient.setAttributeNS(null, 'offset', '0%')
    firstStopColorBackgroundGradient.setAttributeNS(null, 'stop-opacity', '1')
    let secondStopColorBackgroundGradient = document.createElementNS('http://www.w3.org/2000/svg','stop')
    secondStopColorBackgroundGradient.setAttributeNS(null, 'offset', '100%')
    secondStopColorBackgroundGradient.setAttributeNS(null, 'stop-opacity', '1')

    if (avatarProps.dark) {
      firstStopColorBackgroundGradient.style.stopColor = 'rgb(0, 0, 0)'
      secondStopColorBackgroundGradient.style.stopColor = 'rgb(42, 42, 42)'
    }
    else {
      firstStopColorBackgroundGradient.style.stopColor = 'rgb(213, 213, 213)'
      secondStopColorBackgroundGradient.style.stopColor = 'rgb(255, 255, 255)'
    }

    backgroundGradient.appendChild(firstStopColorBackgroundGradient)
    backgroundGradient.appendChild(secondStopColorBackgroundGradient)

    defs.appendChild(backgroundGradient)

    if (avatarProps.roundedBg) {
      roundRect(context, 0, 0, containerElement.width, containerElement.width, width / 2, "url(#backgroundGradient)");
    }
    else {
      roundRect(context, 0, 0, containerElement.width, containerElement.width, 0, "url(#backgroundGradient)");
    }
  }

  if (avatarProps.isVertical) {
    // Rotate -90deg by vertically skewing up and horizontally skewing right
    // Since the entire transform is now perfectly off the canvas, bring it back on by translating 512 down
    context.setAttributeNS(null, 'transform', "rotate(-90)")
  }

  let darkLayerGradientObject = document.createElementNS('http://www.w3.org/2000/svg','linearGradient')
  darkLayerGradientObject.id = "darkLayerGradient"

  darkLayerGradientObject.setAttributeNS(null, 'gradientUnits', "userSpaceOnUse")

  darkLayerGradientObject.setAttributeNS(null, 'x1', padding)
  darkLayerGradientObject.setAttributeNS(null, 'x2', (length + padding))
  darkLayerGradientObject.setAttributeNS(null, 'y1', 0)
  darkLayerGradientObject.setAttributeNS(null, 'y2', 0)

  let firstStopColorDarkLayerGradient = document.createElementNS('http://www.w3.org/2000/svg','stop')
  firstStopColorDarkLayerGradient.setAttributeNS(null, 'offset', '0%')
  firstStopColorDarkLayerGradient.style.stopColor = avatarProps.gradientSet.bgLow
  firstStopColorDarkLayerGradient.style.stopOpacity = '1'
  let secondStopColorDarkLayerGradient = document.createElementNS('http://www.w3.org/2000/svg','stop')
  secondStopColorDarkLayerGradient.setAttributeNS(null, 'offset', '100%')
  secondStopColorDarkLayerGradient.style.stopColor = avatarProps.gradientSet.bgHigh
  secondStopColorDarkLayerGradient.style.stopOpacity = '1'

  darkLayerGradientObject.appendChild(firstStopColorDarkLayerGradient)
  darkLayerGradientObject.appendChild(secondStopColorDarkLayerGradient)

  let lightLayerGradientObject = document.createElementNS('http://www.w3.org/2000/svg','linearGradient')
  lightLayerGradientObject.id = "lightLayerGradient"
  lightLayerGradientObject.setAttributeNS(null, 'gradientUnits', "userSpaceOnUse")

  lightLayerGradientObject.setAttributeNS(null, 'x1', padding)
  lightLayerGradientObject.setAttributeNS(null, 'x2', (length + padding))
  lightLayerGradientObject.setAttributeNS(null, 'y1', 0)
  lightLayerGradientObject.setAttributeNS(null, 'y2', 0)

  let firstStopColorLightLayerGradient = document.createElementNS('http://www.w3.org/2000/svg','stop')
  firstStopColorLightLayerGradient.setAttributeNS(null, 'offset', '0%')
  firstStopColorLightLayerGradient.setAttributeNS(null, 'stop-color', avatarProps.gradientSet.low)
  firstStopColorLightLayerGradient.style.stopOpacity = '1'
  let secondStopColorLightLayerGradient = document.createElementNS('http://www.w3.org/2000/svg','stop')
  secondStopColorLightLayerGradient.setAttributeNS(null, 'offset', '100%')
  secondStopColorLightLayerGradient.setAttributeNS(null, 'stop-color', avatarProps.gradientSet.high)
  secondStopColorLightLayerGradient.style.stopOpacity = '1'

  lightLayerGradientObject.appendChild(firstStopColorLightLayerGradient)
  lightLayerGradientObject.appendChild(secondStopColorLightLayerGradient)

  defs.appendChild(darkLayerGradientObject)
  defs.appendChild(lightLayerGradientObject)

  let darkLayerGradient = "url(#darkLayerGradient)"
  let lightLayerGradient = "url(#lightLayerGradient)"

  // Keep track of the node for coloring
  let currentNode = 0;

  // Render the rows of the actual avatar
  for (var i = 0; i < 3; i++) {
    let startX = padding;
    let startY = padding + ((width + margin) * i);
    switch (avatarProps.rows[i].type) {
      case 'LINE':
        roundRect(context, startX, startY, length, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'LINE_DOT':
        roundRect(context, startX, startY, length, width, width / 2, darkLayerGradient);
        roundRect(context, startX, startY, halfLineLength, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += halfLineLength + margin;

        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'DOT_LINE':
        roundRect(context, startX, startY, length, width, width / 2, darkLayerGradient);
        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += width + margin;

        roundRect(context, startX, startY, halfLineLength, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'DOT_DOT_DOT':
        roundRect(context, startX, startY, length, width, width / 2, darkLayerGradient);
        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += width + margin;

        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += width + margin;

        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'DOT_SPACE_DOT':
        roundRect(context, startX, startY, length, width, width / 2, darkLayerGradient);

        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += 2 * (width + margin);

        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'DOT_DOT_SPACE':
        roundRect(context, startX, startY, halfLineLength, width, width / 2, darkLayerGradient);
        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += width + margin;

        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'SPACE_DOT_DOT':
        startX += width + margin;

        roundRect(context, startX, startY, halfLineLength, width, width / 2, darkLayerGradient);
        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));

        startX += width + margin;
        roundRect(context, startX, startY, width, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'SPACE_LINE':
        startX += width + margin;
        roundRect(context, startX, startY, halfLineLength, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
      case 'LINE_SPACE':
        roundRect(context, startX, startY, halfLineLength, width, width / 2, getFillStyle(currentNode++, avatarProps));
        break;
    }
  }

  containerElement.appendChild(context)

};

Ravatar.render = function(canvasElement, avatarProps, size) {
  // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas/7838871#7838871
  function roundRect(context, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    context.beginPath();
    context.moveTo(x+r, y);
    context.arcTo(x+w, y,   x+w, y+h, r);
    context.arcTo(x+w, y+h, x,   y+h, r);
    context.arcTo(x,   y+h, x,   y,   r);
    context.arcTo(x,   y,   x+w, y,   r);
    context.closePath();
    return context;
  }

  function getFillStyle(currentNode, avatarProps) {
    if (avatarProps.coloredNodes[currentNode]) {
      return lightLayerGradient;
    }
    else if (avatarProps.dark) {
      return '#f0f0f0';
    }
    else {
      return '#a0a0a0';
    }
  }

  canvasElement.width = size;
  canvasElement.height = size;
  let context = canvasElement.getContext('2d');

  // Calculate some stuff
  const padding = canvasElement.width / 6; // 1/6 of each side is padding totalling 1/3 of the canvas width
  let length = 4 * (canvasElement.width / 6); // 4/6 or 2/3 of the area is for the glyph
  // Take the length and divide into 3 sections since 3 lines
  // A quarter of each trine is for margin,
  // but since the margin on the last line is not needed, add that back to the other two margins using *(3/2)
  const margin = (3 / 2) * (length / 3 / 4);
  const width = length / 4;
  // When there's a line and a space on the same row, the length of the line is different
  // Use (2/3) as a base then subtract half the length of the margin that would be included
  const halfLineLength = length * (2/3) - ((1/2) * (length / 3 / 4));
  
  // Render the background gradient
  if (avatarProps.hasBg) {
    let backgroundGradient = context.createLinearGradient(0, canvasElement.width, canvasElement.width, 0);
    if (avatarProps.dark) {
      backgroundGradient.addColorStop(0, 'rgb(0, 0, 0)');
      backgroundGradient.addColorStop(1, 'rgb(42, 42, 42)');
    }
    else {
      backgroundGradient.addColorStop(0, 'rgb(213, 213, 213)');
      backgroundGradient.addColorStop(1, 'rgb(255, 255, 255)');
    }
    context.fillStyle = backgroundGradient;
    if (avatarProps.roundedBg) {
      roundRect(context, 0, 0, canvasElement.width, canvasElement.width, width / 2).fill();
    }
    else {
      context.fillRect(0, 0, canvasElement.width, canvasElement.width);
    }
  }

  if (avatarProps.isVertical) {
    // Rotate -90deg by vertically skewing up and horizontally skewing right
    // Since the entire transform is now perfectly off the canvas, bring it back on by translating 512 down
    context.setTransform(0, -1, 1, 0, 0, canvasElement.width);
  }

  let darkLayerGradient = context.createLinearGradient(padding, 0, length + padding, 0);
  darkLayerGradient.addColorStop(0, avatarProps.gradientSet.bgLow);
  darkLayerGradient.addColorStop(1, avatarProps.gradientSet.bgHigh);

  let lightLayerGradient = context.createLinearGradient(padding, 0, length + padding, 0);
  lightLayerGradient.addColorStop(0, avatarProps.gradientSet.low);
  lightLayerGradient.addColorStop(1, avatarProps.gradientSet.high);

  // Keep track of the node for coloring
  let currentNode = 0;

  // Render the rows of the actual avatar
  for (var i = 0; i < 3; i++) {
    let startX = padding;
    let startY = padding + ((width + margin) * i);
    switch (avatarProps.rows[i].type) {
      case 'LINE':
        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();
        break;
      case 'LINE_DOT':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();

        startX += halfLineLength + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'DOT_LINE':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();
        break;
      case 'DOT_DOT_DOT':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'DOT_SPACE_DOT':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += 2 * (width + margin);

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'DOT_DOT_SPACE':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'SPACE_DOT_DOT':
        startX += width + margin;

        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'SPACE_LINE':
        startX += width + margin;

        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();
        break;
      case 'LINE_SPACE':
        context.fillStyle = getFillStyle(currentNode++, avatarProps);
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();
        break;
    }
  }
};