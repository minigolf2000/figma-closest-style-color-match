const memo = {}
function findClosestStyle(color: RGB, stylesToMatch: PaintStyle[]) {
  if (memo[JSON.stringify(color)]) {
    return memo[JSON.stringify(color)]
  }
  let closestStyle: PaintStyle = null
  let closestDistance = Infinity
  stylesToMatch.forEach((style: PaintStyle) => {
    const currentDistance = deltaE(color, (style.paints[0] as SolidPaint).color)
    if (currentDistance < closestDistance) {
      closestStyle = style
      closestDistance = currentDistance
    }
  })
  memo[JSON.stringify(color)] = closestStyle
  return closestStyle
}

// Compute distance between two colors
function deltaE(a: RGB, b: RGB) {
  let labA = rgb2lab(a);
  let labB = rgb2lab(b);
  let deltaL = labA[0] - labB[0];
  let deltaA = labA[1] - labB[1];
  let deltaB = labA[2] - labB[2];
  let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  let deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  let sc = 1.0 + 0.045 * c1;
  let sh = 1.0 + 0.015 * c1;
  let deltaLKlsl = deltaL / (1.0);
  let deltaCkcsc = deltaC / (sc);
  let deltaHkhsh = deltaH / (sh);
  let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2lab(rgb: RGB){
  let {r, g, b} = rgb
  let x: number, y: number, z: number;
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

async function main(): Promise<string> {
  if (figma.currentPage.selection.length === 0) {
    return "Please first select the nodes then run the plugin"
  }

  const stylesToMatch = figma.
    getLocalPaintStyles().
    filter((paintStyle: PaintStyle) => (
      paintStyle.paints.length === 1 &&
      paintStyle.paints[0].type === 'SOLID' &&
      paintStyle.paints[0].opacity === 1
    ))

  if (stylesToMatch.length === 0) {
    return "Please create local solid paint styles then run the plugin"
  }

  const numApplied = recurse({children: figma.currentPage.selection}, stylesToMatch, 0)

  return `Applied styles to ${numApplied} nodes in selection`
}

function recurse(node: any, stylesToMatch: PaintStyle[], numApplied: number) {
  if ('children' in node) {
    node.children.forEach((child: any) => {
      numApplied += recurse(child, stylesToMatch, 0)
    })
  }

  if (node.fills && node.fills.length > 0) {
    for (const paint of node.fills) {
      if (paint.type === 'SOLID') {
        const closestStyle = findClosestStyle(paint.color as RGB, stylesToMatch)
        node.fillStyleId = closestStyle.id
        numApplied++
      }
    }
  }

  return numApplied
}

main().then((message: string) => {
  figma.closePlugin(message)
})
