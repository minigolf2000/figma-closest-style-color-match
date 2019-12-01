function findClosestStyle(color: RGB, stylesToMatch: PaintStyle[]) {
  return stylesToMatch[0].id
}

function main() {
  const stylesToMatch = figma.
    getLocalPaintStyles().
    filter((paintStyle: PaintStyle) => (
      paintStyle.paints.length === 1 &&
      paintStyle.paints[0].type === 'SOLID' &&
      paintStyle.paints[0].opacity === 1
    ))

  figma.currentPage.selection.forEach((node: SceneNode) => {
    // Look for fills on node types that have fills.
    // An alternative would be to do `if ('fills' in node) { ... }
    switch (node.type) {
      case 'RECTANGLE':
      case 'ELLIPSE':
      case 'POLYGON':
      case 'STAR':
      case 'VECTOR':
      case 'TEXT': {
        for (const paint1 of (node as any).fills) {
          const closestStyleId = findClosestStyle(node.fills[0], stylesToMatch)
          node.fillStyleId = closestStyleId
        }
        break
      }

      default: {
        // not supported, silently do nothing
      }
    }
  })

}

main()
figma.closePlugin()
// main().then((message: string | undefined) => {
//   figma.closePlugin(message)
// })
