import {
  ExteriorNodeLabelModel,
  GeneralPath,
  IGraph,
  ImageNodeStyle,
  LabelStyle,
  Point,
  Rect,
  
  Size,
  WebGLEffect,
  WebGLImageNodeStyle,
  WebGLShapeNodeShape,
  WebGLShapeNodeStyle,
  PolylineEdgeStyle,
  Arrow,
  WebGLNodeStyleDecorator,
  GroupNodeStyle,
  CollapsibleNodeStyleDecorator
} from '@yfiles/yfiles'

import getSVGDataURL from './SVGDataURLFetch'
import { DemoConfiguration } from './DemoConfiguration'
import { createLitNodeStyleFromSource } from './utils/LitNodeStyle'

const nodeStyleTemplate = `({ layout, tag, selected, zoom }) => {
  function formatPosition(position, maxLength) {
    if (!position || position.length <= maxLength) {
      return [position?.toUpperCase() || ''];
    }
    let truncated = position.slice(0, maxLength);
    let lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex !== -1) {
      return [
        truncated.slice(0, lastSpaceIndex).toUpperCase(),
        position.slice(lastSpaceIndex + 1).toUpperCase()
      ];
    }
    return [position.toUpperCase()];
  }
  return svg\`
  <g>
    <use href="#node-dropshadow" x="-10" y="-5"></use>
    <rect fill="#FFFFFF" stroke="#C0C0C0" width="$\{layout.width}" height="$\{layout.height}"></rect>
    <rect width="$\{layout.width}" height="\${zoom < 0.4 ? layout.height : zoom < 0.7 ? '10' : '5'}" class="node-background"
      fill='$\{tag.status === "present" ? "#76b041" : tag.status === "busy" ? "#ab2346" : tag.status === "unavailable" ? "blue" : "#c1c1c1"}'>
    </rect>
    <rect class='\${selected ? "yfiles-highlighted yfiles-focused" : ""}'  fill='$\{tag.status === "present" ? "#76b041" : tag.status === "busy" ? "#ab2346" : tag.status === "unavailable" ? "blue" : "#c1c1c1"}'stroke-width='3' width='\${layout.width + 3}' height='\${layout.height + 3}' x='-1.5' y='-1.5'></rect>
    <!-- Detail View -->
    \${zoom >= 0.25 ? svg\`
<image
  href="resources/icons/\${tag.status === 'present' ? 'checkmark' : tag.status === 'busy' ? 'cross' : 'unavailable'}.svg"
  x="\${tag.isInsideGroup ? layout.width / 2 - 16 : 4}"
  y="\${tag.isInsideGroup ? layout.height / 2 - 16 : 4}"
  width="32"
  height="32"
/>
        <text x="60" y="50" font-size="14" font-family="Roboto,sans-serif" fill="#fff">Status: \${tag.status}</text>
    \` :  svg\`
      <!-- Overview View -->
      <text transform='translate(30 50)' style='font-size:40px; font-family:Roboto,sans-serif; fill:#fff; dominant-baseline: central;'>
        \${tag.name.replace(/^(.)(\\S*)(.*)/, "$1.$3")}
      </text>
    \`}
  </g>
\`}`


class LargeGraphDemoConfiguration extends DemoConfiguration {
  svgThreshold = 0.25
  webGLNodeStyles = []
  statuses = ['busy', 'unavailable', 'present']
  colors = ['#ab2346', 'blue', '#76b041']
   foldingManager = null  
  litNodeStyle = createLitNodeStyleFromSource(nodeStyleTemplate)

  getRandomInt = (upper) => Math.floor(Math.random() * upper)

  getIndex(node) {
    const type = typeof node.tag?.type === 'number' ? node.tag?.type : 0
    return Math.max(0, Math.min(type, this.statuses.length - 1))
  }

  getColor(status) {
    const index = this.statuses.indexOf(status)
    return this.colors[index] ?? '#c1c1c1'
  }

  nodeStyleProvider = (node, graph, zoom = 1) => {
    if (graph.isGroupNode(node)) {
      return graph.groupNodeDefaults.style
    }
  
    const index = this.getIndex(node)
    const status = node.tag?.status
    const fill = this.getColor(status)
  
    return new WebGLNodeStyleDecorator(
      this.litNodeStyle,
      new WebGLShapeNodeStyle(WebGLShapeNodeShape.ROUND_RECTANGLE, fill, fill)
    )
  }
  
  edgeStyleProvider = (edge, graph, zoom = 1) => {
    const sourceStatus = edge.sourceNode?.tag?.status
    const color = this.getColor(sourceStatus)
    return new PolylineEdgeStyle({
      stroke: `2px ${color}`,
      targetArrow: new Arrow({ type: 'triangle', stroke: color, fill: color })
    })
  }

  nodeCreator = (context, graph, location, parent) => {
    const zoom = context.canvasComponent.zoom
    const index = graph.nodes.size % 3
    const node = graph.createNode({
      parent,
      layout: Rect.fromCenter(location, graph.nodeDefaults.size),
      tag: {
        id: graph.nodes.size,
        type: index,
        status: this.statuses[index]
      }
    })
    graph.setStyle(node, this.nodeStyleProvider(node, graph, zoom))
    return node
  }

  async initializeStyleDefaults(graph) {
    await this.initializeNodeStyles()
    graph.nodeDefaults.size = new Size(100, 100)
    graph.nodeDefaults.labels.layoutParameter = new ExteriorNodeLabelModel({
      margins: [0, 0, 5, 0]
    }).createParameter('bottom')
    graph.nodeDefaults.labels.style = new LabelStyle({
      backgroundFill: '#fffd'
    })
    graph.edgeDefaults.style = new PolylineEdgeStyle({
      stroke: '2px #999',
      targetArrow: new Arrow({ type: 'triangle', stroke: '#999', fill: '#999' })
    })
    graph.groupNodeDefaults.style = new CollapsibleNodeStyleDecorator(new GroupNodeStyle())
  }

  createNode(graph, id, layout, nodeData, zoom = 1) {
    const index = id % 3
    const zoomFactor = zoom || 1
  
    if (id %10 === 0) {
      const groupNode = graph.createGroupNode({
        layout,
        tag: {
          id: id,
          type: 'group',
          status: 'group'
        }
      })
  
      const baseGroupStyle = graph.groupNodeDefaults.style
      const collapsibleStyle = new CollapsibleNodeStyleDecorator(baseGroupStyle)
      graph.setStyle(groupNode, collapsibleStyle)
      graph.addLabel(groupNode, 'Group Node')
  
      const childNode = graph.createNode({
        parent: groupNode,
        layout: new Rect(layout.x + 10, layout.y + 10, layout.width - 20, layout.height - 20),
        tag: {
          id: `${id}`,
          type: index,
          status: this.statuses[index],
          isInsideGroup: true 
        }
      })
  
      graph.setStyle(childNode, this.nodeStyleProvider(childNode, graph, zoomFactor))
      graph.addLabel(childNode, `Child Node`)
      
      return groupNode
    }
  
    const node = graph.createNode({
      layout,
      tag: {
        id,
        type: index,
        status: this.statuses[index]
      }
    })
  
    graph.setStyle(node, this.nodeStyleProvider(node, graph, zoomFactor))
    graph.addLabel(node, `Item ${id}`)
  
    return node
  }
      
  createImageDataPromise(ctx, image, dataURL) {
    return new Promise((resolve) => {
      image.onload = () => {
        ctx.clearRect(0, 0, 200, 200)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fillRect(0, 0, 200, 200)
        ctx.drawImage(image, 25, 25, 150, 150)
        const imageData = ctx.getImageData(0, 0, 200, 200)
        resolve(imageData)
      }
      image.src = dataURL
    })
  }

  async initializeNodeStyles() {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', '200')
    canvas.setAttribute('height', '200')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const image = new Image(100, 100)
    const iconPaths = [
      'resources/icons/cross.svg',
      'resources/icons/unavailable.svg',
      'resources/icons/checkmark.svg'
    ]

    for (let i = 0; i < 3; i++) {
      const dataURL = await getSVGDataURL(iconPaths[i])
      const imageData = await this.createImageDataPromise(ctx, image, dataURL)
      this.webGLNodeStyles.push(new WebGLImageNodeStyle({
        image: imageData,
        backgroundShape: WebGLShapeNodeShape.ROUND_RECTANGLE,
        backgroundFill: this.colors[i],
        backgroundStroke: 'black',
        effect: WebGLEffect.DROP_SHADOW
      }))
    }
  }

  registerNodeTooltips(graphComponent) {
    graphComponent.toolTipItems = IGraph.ItemTypes.NODE
    graphComponent.addEventListener('query-tool-tip', evt => {
      if (evt.handled) return
      const item = evt.item
      if (item?.tag) {
        const { id, status } = item.tag
        evt.toolTip = `Job ID: ${id} | Status: ${status}`
        evt.handled = true
      }
    })
  }

  registerZoomStyleSwitcher(graphComponent) {
    graphComponent.addZoomChangedListener(() => {
      const zoom = graphComponent.zoom
      const graph = graphComponent.graph
      graph.nodes.forEach(node => {
        graph.setStyle(node, this.nodeStyleProvider(node, graph, zoom))
      })
      graph.edges.forEach(edge => {
        const edgeStyle = this.edgeStyleProvider(edge, graph, zoom)
        graph.setStyle(edge, edgeStyle)
      })
    })
  }
}

export class HierarchicalDemoConfiguration extends LargeGraphDemoConfiguration {
  graphResourcePath = 'resources/hierarchic-10000-11000-circles.json'
}

export class OrganicDemoConfiguration extends LargeGraphDemoConfiguration {
  graphResourcePath = 'resources/radial_tree_10000_9999.json'
}
