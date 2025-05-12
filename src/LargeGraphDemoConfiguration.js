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
  const nodeWidth = 100;
  const nodeHeight = 100;
  const groupPadding = 10;
  const statusColors = {
    present: { bgColor: '#76b041', iconFill: '#fff' },
    busy: { bgColor: '#ab2346', imageFill: '#fff' },
    unavailable: { bgColor: 'blue', iconFill: '#fff' },
    default: { bgColor: '#c1c1c1', iconFill: '#fff' }
  };
  const status = tag.status || 'default';
  const colors = statusColors[status] || statusColors.default;
  const isGroup = tag.type === 'group';
  const isGroupCollapsed = tag.isGroupCollapsed || false;
  const isInsideGroup = tag.isInsideGroup;

  const badgeSize = nodeWidth * 0.2263;
  const iconScaleFactor = Math.min(3.5, Math.max(1.5, 3.5 - 2 * zoom)); // Scale from 1.5 (high zoom) to 3.5 (low zoom)
  const iconOffsetX = (badgeSize - 36 * iconScaleFactor) / 2;
  const iconOffsetY = (badgeSize - 34 * iconScaleFactor) / 2;
  const fontSizeHeader = Math.max(12, 12 + 8 * (1 - zoom)); // 12px at high zoom, up to 20px at low zoom
  const fontSizeLabel = Math.max(14, 14 + 14 * (1 - zoom)); // 14px at high zoom, up to 28px at low zoom
  const fontSizeStatus = Math.max(12, 12 + 8 * (1 - zoom)); // 12px at high zoom, up to 20px at low zoom

  return svg\`
    <g>
      <use href="#node-dropshadow" x="-10" y="-5"></use>
      \${isGroup && !isGroupCollapsed ? svg\`
        <rect
          x="\${-groupPadding}"
          y="\${-groupPadding}"
          width="\${layout.width + groupPadding * 2}"
          height="\${layout.height + groupPadding * 2}"
          rx="8"
          ry="8"
          stroke="#3273D94D"
          stroke-width="5"
          fill="#3273D90A"
          class="group-border"
        ></rect>
      \` : ''}
      \${!isGroup || isGroupCollapsed ? svg\`
        <rect
          width="\${layout.width}"
          height="\${layout.height}"
          rx="\${zoom < 0.4 ? 50 : 8}"
          fill="\${colors.bgColor}"
          stroke="\${selected ? '#3272D9' : 'none'}"
          stroke-width="3"
          class="node-background"
          style="filter: drop-shadow(0px 1px 8px #0000001F) drop-shadow(0px 3px 4px #00000024) drop-shadow(0px 3px 3px #00000033);"
        ></rect>
      \` : ''}
      <g transform="translate(12, 20)">
        <!-- Icon on the left -->
        \${!isGroup ? svg\`
          <image href="resources/icons/\${status === 'present' ? 'checkmark' : status === 'busy' ? 'cross' : 'unavailable'}.svg"
            x="0" y="-12" width="20" height="20"/>
        \` : ''}
        <!-- Item-id header next to icon -->
        \${!isInsideGroup ? svg\`
        <text x="26" y="3" font-size="\${fontSizeHeader}" font-family="Roboto,sans-serif" font-weight="600" fill="#171D26DE">
          Item-id: \${tag.id || 'N/A'}
        </text>
        \` : ''}        
      </g>
      <line
        x1="12"
        y1="30"
        x2="\${layout.width - 12}"
        y2="30"
        stroke="#171D26"
        stroke-width="1"
        stroke-dasharray="4,2"
      />
      \${zoom > 0.7 && !isGroup && !isInsideGroup ? svg\`
        <!-- Additional node data for zoom > 0.7 -->
        <g transform="translate(12, 40)">
          <text x="0" y="0" font-size="\${fontSizeLabel}" font-family="Roboto,sans-serif" font-weight="600" fill="#171D26DE">
            \${tag.label || 'Unnamed'}
          </text>
          <text x="0" y="15" font-size="\${fontSizeStatus}" font-family="Roboto,sans-serif" fill="#171D26DE">
            Status: \${status}
          </text>
          <text x="0" y="30" font-size="\${fontSizeStatus}" font-family="Roboto,sans-serif" fill="#171D26DE">
            Machine: \${tag.machine || 'N/A'}
          </text>
          <text x="0" y="45" font-size="\${fontSizeStatus}" font-family="Roboto,sans-serif" fill="#171D26DE">
            Type: \${tag.type || 'N/A'}
          </text>
          <text x="0" y="60" font-size="\${fontSizeStatus}" font-family="Roboto,sans-serif" fill="#171D26DE">
            Active: \${tag.bool || 'N/A'}
          </text>
          </g>
      \` : isGroup && isInsideGroup ? svg\`
        <!-- Group node label and machine -->
        <g transform="translate(12, 40)">
        </g>
      \` : ''}
      \${status === 'busy' ? svg\`
        <g>
          \${zoom < 0.4 ? svg\`
            <rect x="0" y="0" width="\${layout.width}" height="\${layout.height}" rx="50" fill="none" stroke="#1D5BBF" stroke-width="10" stroke-dasharray="400" stroke-dashoffset="800">
              <animate attributeName="stroke-dashoffset" from="800" to="0" dur="2s" repeatCount="indefinite"/>
            </rect>
          \` : svg\`
            <g transform="translate(0, \${layout.height - 5})">
              <defs><clipPath id="progress-bar-clip"><rect x="0" y="0" width="\${layout.width}" height="5"/></clipPath></defs>
              <rect x="0" y="0" width="\${layout.width}" height="5" fill="#F0F5FC" rx="2" ry="2"></rect>
              <g clip-path="url(#progress-bar-clip)">
                <rect x="0" y="0" width="\${layout.width / 5}" height="5" fill="#1D5BBF" rx="2" ry="2">
                  <animateTransform attributeType="XML" attributeName="transform" type="translate" from="-50 0" to="\${layout.width} 0" dur="1.5s" repeatCount="indefinite"/>
                </rect>
              </g>
            </g>
          \`}
        </g>
      \` : ''}
      \${(tag.has_resources || tag.has_global_variable) && zoom >= 0.25 ? svg\`
        <g transform="translate(\${layout.width - badgeSize * 0.5}, \${-badgeSize * 0.5})">
          <rect x="0" y="0" width="\${badgeSize}" height="\${badgeSize}" rx="\${badgeSize / 2}" fill="white" style="filter: drop-shadow(0px 1px 8px #0000001F) drop-shadow(0px 3px 4px #00000024) drop-shadow(0px 3px 3px #00000033);"></rect>
          \${tag.has_resources ? svg\`
            <g transform="translate(\${iconOffsetX}, \${iconOffsetY}) scale(\${iconScaleFactor})">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M14.0674 17C14.0674 17.3151 14.1032 17.6216 14.1708 17.9157L13.268 18.5662C13.0356 18.7043 12.9571 19.0121 13.0927 19.2537L13.6757 20.293C13.8113 20.5346 14.1097 20.6186 14.3421 20.4805L15.3687 19.9741C15.7906 20.3608 16.2953 20.6557 16.8525 20.828L16.9521 22C16.9521 22.2761 17.1719 22.5 17.4431 22.5H18.6093C18.8805 22.5 19.1003 22.2761 19.1003 22L19.1889 20.8121C19.7274 20.6374 20.2156 20.3477 20.6255 19.9712L21.6579 20.4805C21.8903 20.6186 22.1887 20.5346 22.3243 20.293L22.9073 19.2537C23.0429 19.0121 22.9644 18.7043 22.732 18.5662L21.8215 17.9101C21.8883 17.6177 21.9236 17.3131 21.9236 17C21.9236 16.7024 21.8917 16.4124 21.8312 16.1334L22.7582 15.4805C22.9906 15.3424 23.0691 15.0346 22.9335 14.793L22.3505 13.7537C22.2149 13.5121 21.9165 13.4281 21.6841 13.5662L20.6577 14.0587C20.2413 13.6677 19.7416 13.3672 19.1889 13.1879L19.1003 12C19.1003 11.7239 18.8805 11.5 18.6093 11.5H17.4431C17.1719 11.5 16.9521 11.7239 16.9521 12L16.8525 13.172C16.2811 13.3487 15.7648 13.6544 15.3364 14.0558L14.3159 13.5662C14.0835 13.4281 13.7851 13.5121 13.6495 13.7537L13.0665 14.793C12.9309 15.0346 13.0094 15.3424 13.2418 15.4805L14.161 16.1279C14.0997 16.4086 14.0674 16.7005 14.0674 17ZM19.7723 17.0039C19.7723 18.001 18.9785 18.8093 17.9993 18.8093C17.0202 18.8093 16.2264 18.001 16.2264 17.0039C16.2264 16.0068 17.0202 15.1985 17.9993 15.1985C18.9785 15.1985 19.7723 16.0068 19.7723 17.0039Z" fill="#3272D9"></path>
            </g>
          \` : tag.has_global_variable ? svg\`
            <g transform="translate(\${iconOffsetX}, \${iconOffsetY}) scale(\${iconScaleFactor})">
              <g clip-path="url(#clip0_1860_5407)">
                <g opacity="0.8">
                  <path d="M4.65392 1.84198C4.60274 1.86322 4.55204 1.88538 4.50184 1.90843L4.65392 1.84198Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M2.34551 3.99999C2.80283 3.07973 3.56592 2.33824 4.50184 1.90843C4.2795 2.50545 4.11147 3.21575 4.00609 3.99999H2.34551Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M2.26135 4.17916L2.34551 3.99999C2.31619 4.05899 2.28812 4.11872 2.26135 4.17916Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M1.98925 6.99999C1.91628 6.67837 1.87775 6.34368 1.87775 5.99999C1.87775 5.68932 1.90923 5.38602 1.96917 5.09308L1.98925 4.99999H3.90859C3.88819 5.32538 3.87775 5.65948 3.87775 5.99999C3.87775 6.34049 3.88819 6.67459 3.90859 6.99999H1.98925Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M4.50184 10.0915C4.2795 9.49452 4.11147 8.78422 4.00609 7.99999L2.34578 8.00053C2.80314 8.92053 3.5661 9.66182 4.50184 10.0915Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M4.50184 10.0915C4.55204 10.1146 4.60274 10.1368 4.65392 10.158L4.50184 10.0915Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M8.10156 1.84198L8.25364 1.90843C8.20344 1.88538 8.15274 1.86322 8.10156 1.84198Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M8.25364 1.90843C9.24957 2.3658 10.0498 3.17609 10.4941 4.17916L10.41 3.99999H8.74939C8.64401 3.21575 8.47598 2.50545 8.25364 1.90843Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M10.6552 4.5986L10.7136 4.7915C10.6956 4.7266 10.6761 4.66229 10.6552 4.5986Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M10.4097 8.00053L8.74939 7.99999C8.64401 8.78422 8.47598 9.49452 8.25364 10.0915L8.10156 10.158C8.15274 10.1368 8.20344 10.1146 8.25364 10.0915C9.18938 9.66182 9.95234 8.92053 10.4097 8.00053Z" fill="#171D26" fill-opacity="0.62"/>
                  <path d="M10.7662 4.99999H8.84689C8.86729 5.32538 8.87773 5.65948 8.87773 5.99999C8.87773 6.34049 8.86729 6.67459 8.84689 6.99999H10.7662C10.8392 6.67831 10.8777 6.34365 10.8777 5.99999C10.8777 5.65629 10.8392 5.3216 10.7662 4.99999Z" fill="#171D26" fill-opacity="0.62"/>
                </g>
                <path d="M5.7562 10.4565C5.45269 9.93275 5.18042 9.06407 5.02209 8H7.7334C7.57498 9.06472 7.30247 9.93381 6.99919 10.4574C6.79606 10.4855 6.58859 10.5 6.37775 10.5C6.1669 10.5 5.95944 10.4855 5.7562 10.4565Z" fill="#171D26" fill-opacity="0.62"/>
                <path d="M4.87775 6C4.87775 5.65724 4.8901 5.32285 4.91306 5H7.84243C7.86539 5.32285 7.87775 5.65724 7.87775 6C7.87775 6.34276 7.86539 6.67715 7.84243 7H4.91306C4.8901 6.67715 4.87775 6.34276 4.87775 6Z" fill="#171D26" fill-opacity="0.62"/>
                <path d="M5.75631 1.54256C5.95944 1.5145 6.1669 1.5 6.37775 1.5C6.58859 1.5 6.79606 1.5145 6.99929 1.54346C7.3028 2.06725 7.57508 2.93593 7.7334 4H5.02209C5.18051 2.93528 5.45303 2.06619 5.75631 1.54256Z" fill="#171D26" fill-opacity="0.62"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.8777 6C10.8777 3.51472 8.86303 1.5 6.37775 1.5C3.89247 1.5 1.87775 3.51472 1.87775 6C1.87775 8.48528 3.89247 10.5 6.37775 10.5C8.86303 10.5 10.8777 8.48528 10.8777 6ZM11.8777 6C11.8777 2.96243 9.41531 0.5 6.37775 0.5C3.34018 0.5 0.877747 2.96243 0.877747 6C0.877747 9.03757 3.34018 11.5 6.37775 11.5C9.41531 11.5 11.8777 9.03757 11.8777 6Z" fill="#171D26" fill-opacity="0.62"/>
              </g>
              <defs><clipPath id="clip0_1860_5407"><rect width="12" height="12" fill="white" transform="translate(0.377747)"/></clipPath></defs>
            </g>
          \` : ''}
        </g>
      \` : ''}
      \${isGroup ? svg\`
        <g id="box-node-toggle-button" transform="translate(\${layout.width - 25}, \${layout.height - 20})">
          <rect x="1" y="1" width="45" height="40" rx="3" fill="white" stroke="#3272D9" stroke-width="2"></rect>
          <path d="\${isGroupCollapsed ?
            'M9.3092 19.5374L14.0129 14.8337L15.1667 15.9875L10.463 20.6912L12.5893 20.6711C13.0356 20.6668 13.394 21.0252 13.3897 21.4714C13.3855 21.9177 13.0203 22.2829 12.574 22.2872L7.66675 22.3337L7.71325 17.4264C7.71748 16.9801 8.08269 16.6149 8.52896 16.6107C8.97523 16.6064 9.33358 16.9648 9.32935 17.4111L9.3092 19.5374ZM22.691 8.46329L17.9873 13.167L16.8334 12.0131L21.5371 7.30945L19.4108 7.3296C18.9645 7.33383 18.6062 6.97548 18.6104 6.52921C18.6147 6.08293 18.9799 5.71773 19.4261 5.7135L24.3334 5.66699L24.2869 10.5743C24.2827 11.0205 23.9175 11.3858 23.4712 11.39C23.0249 11.3942 22.6666 11.0359 22.6708 10.5896L22.691 8.46329Z' :
            'M23.1795 5.6665L18.4758 10.3702L18.4959 8.24391C18.5002 7.79764 18.1418 7.43929 17.6956 7.44352C17.2493 7.44775 16.8841 7.81295 16.8798 8.25923L16.8333 13.1665L21.7406 13.12C22.1869 13.1158 22.5521 12.7506 22.5563 12.3043C22.5606 11.858 22.2022 11.4997 21.7559 11.5039L19.6296 11.524L24.3333 6.82035L23.1795 5.6665ZM8.82052 22.3332L13.5242 17.6295L13.5041 19.7558C13.4998 20.202 13.8582 20.5604 14.3045 20.5562C14.7507 20.5519 15.1159 20.1867 15.1202 19.7404L15.1667 14.8332L10.2594 14.8797C9.81312 14.8839 9.44791 15.2491 9.44368 15.6954C9.43946 16.1417 9.7978 16.5 10.2441 16.4958L12.3704 16.4756L7.66667 21.1793L8.82052 22.3332Z'}"
            fill="#3272D9" transform="scale(1.5)">
          </path>
        </g>
      \` : ''}
    </g>
  \`;
}`;

class LargeGraphDemoConfiguration extends DemoConfiguration {
  svgThreshold = 0.5
  webGLNodeStyles = []
  statuses = ['busy', 'unavailable', 'present']
  colors = ['#ab2346', 'blue', '#76b041']
  type = ['box', 'circle', 'square']
  bool = ['true', 'false', 'n.a.']
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
      return new CollapsibleNodeStyleDecorator(new GroupNodeStyle())
    }
  
    const index = this.getIndex(node)
    const status = node.tag?.status
    const fill = this.getColor(status)
    if (zoom < 0.5) {
      return this.webGLNodeStyles[index] || new WebGLImageNodeStyle({
        image: null,
        backgroundShape: WebGLShapeNodeShape.ROUND_RECTANGLE,
        backgroundFill: fill,
        backgroundStroke: 'black',
        effect: WebGLEffect.DROP_SHADOW
      })
    }
  
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



  createNestedGroup(graph, parentGroup, x, y, width, height, levels, currentLevel = 1, idTracker = { value: 10000 }) {
    const group = graph.createGroupNode(parentGroup, new Rect(x, y, width, height))
  
    for (let i = 0; i < 2; i++) {
      const nodeId = idTracker.value++
      const index = nodeId % 3
      const layout = new Rect(x + 10 + i * 40, y + 10, 30, 30)
  
      const node = graph.createNode({
        parent: group,
        layout,
        tag: {
          id: nodeId,
          type: this.type[index],
          status: this.statuses[index],
          machine: `${nodeId}`,
          bool: this.bool[index],
          label: ' ',
          has_resources: Math.random() > 0.5,
          has_global_variable: Math.random() > 0.5,
          isInsideGroup: true
        }
      })
  
      graph.setStyle(node, this.nodeStyleProvider(node, graph))
    }
  
    if (currentLevel < levels) {
      this.createNestedGroup(
        graph,
        group,
        x + 20,
        y + 60,
        width - 40,
        height - 40,
        levels,
        currentLevel + 1,
        idTracker
      )
    }
  
    graph.adjustGroupNodeLayout(group)
    return group
  }
    
  createNode(graph, id, layout, nodeData, zoom = 1) {
    const index = id % 3
    const zoomFactor = zoom || 1

    if (id === 1) {
      const rootX = layout.x
      const rootY = layout.y
    
      const idTracker = { value: 10000 }
    
      const outerGroup = this.createNestedGroup(
        graph,
        null,
        rootX,
        rootY,
        250,
        160,
        3,
        1,
        idTracker
      )
    
      const extraNodeId = idTracker.value++
      const extraNode = graph.createNode({
        layout: new Rect(rootX + 300, rootY, 30, 30),
        tag: {
          id: extraNodeId,
          type: this.type[extraNodeId % 3],
          status: this.statuses[extraNodeId % 3],
          machine: `${extraNodeId}`,
          bool: this.bool[extraNodeId % 3],
          label: ' ',
          has_resources: Math.random() > 0.5,
          has_global_variable: Math.random() > 0.5,
          isInsideGroup: true
        }
      })
      graph.setStyle(extraNode, this.nodeStyleProvider(extraNode, graph))
    
      const topLevelGroup = graph.groupNodes([outerGroup, extraNode])
      graph.adjustGroupNodeLayout(topLevelGroup)
    
      return topLevelGroup
     }

    const node = graph.createNode({
      layout,
      tag: {
        id,
        type: index,
        status: this.statuses[index],
        label: ' ',
        has_resources: nodeData.has_resources || Math.random() > 0.5,
        has_global_variable: nodeData.has_global_variable || Math.random() > 0.5,
        machine: `${id}`,
        type: this.type[index],
        bool: this.bool[index]
      }
    })

    graph.setStyle(node, this.nodeStyleProvider(node, graph, zoomFactor))

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
      'resources/icons/unavailable.svg',
      'resources/icons/checkmark.svg',
      'resources/icons/cross.svg',
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
  async applyHierarchicLayout(graphComponent) {
    const layout = new HierarchicLayout()
    layout.minimumLayerDistance = 100 
    layout.nodeLayoutDescriptor = new NodeLayoutDescriptor()
    layout.nodeLayoutDescriptor.minimumNodeDistance = 100

    const layoutData = new HierarchicLayoutData()

    await new LayoutExecutor({
      graphComponent,
      layout: new MinimumNodeSizeStage(layout),
      layoutData,
      duration: '0.5s',
      animateViewport: true
    }).start()
  }

}

export class HierarchicalDemoConfiguration extends LargeGraphDemoConfiguration {
  constructor(resourcePath = 'resources/hierarchic-5000.json') {
    super()
    this.graphResourcePath = resourcePath
  }

  async loadGraphData() {
    const response = await fetch(this.graphResourcePath)
    return await response.json()
  }

  async initializeGraph(graphComponent) {
    await super.initializeStyleDefaults(graphComponent.graph)
    await this.applyHierarchicLayout(graphComponent)
  }

}