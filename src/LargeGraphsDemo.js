import {
  EventRecognizers,
  GraphComponent,
  GraphEditorInputMode,
  HandlePositions,
  IReshapeHandler,
  License,
  NodeReshapeHandleProvider,
  GraphItemTypes,
  FoldingManager,
  FolderNodeConverter,
  Size
} from '@yfiles/yfiles'

import RenderingTypesManager from './RenderingTypesManager'
import {
  HierarchicalDemoConfiguration,
} from './LargeGraphDemoConfiguration'
import {
  addNavigationButtons,
  addOptions,
  checkWebGL2Support,
  finishLoading
} from '@yfiles/demo-resources/demo-page'
import { initDemoStyles } from '@yfiles/demo-resources/demo-styles'


let renderingTypesManager = null

async function run() {
  if (!checkWebGL2Support()) return

  License.value = {
    comment: 'c33b6bba-95f0-471d-8fbf-05c4a25a5507',
    date: '03/18/2025',
    distribution: false,
    domains: ['*'],
    expires: '05/18/2025',
    fileSystemAllowed: true,
    licensefileversion: '1.1',
    localhost: true,
    oobAllowed: true,
    package: 'complete',
    product: 'yFiles for HTML',
    type: 'eval',
    version: '3.0',
    watermark: 'yFiles HTML Evaluation License (expires in ${license-days-remaining} days)',
    key: 'afd710f573036f446bd952fa6908fba475b4dcd6'
  }

  const graphComponent = new GraphComponent('#graphComponent')

  configureInteraction(graphComponent)

  initToolbar(graphComponent) 

  initGraphInformationUI(graphComponent)
}

async function loadGraph(graphComponent, config) {
  const graph = graphComponent.graph
  if (renderingTypesManager) {
    renderingTypesManager.dispose()
    graph.clear()
  }
  const foldingView = config.foldingManager?.createFoldingView?.()
  if (foldingView) {
    graphComponent.graph = foldingView.graph
  }
  await config.initializeStyleDefaults(graph)

  const svgThresholdSelect = document.querySelector('#svgThreshold')
  const newIndex = Array.from(svgThresholdSelect.options).findIndex(
    (item) => item.value === String(config.svgThreshold)
  )
  svgThresholdSelect.selectedIndex = newIndex !== -1 ? newIndex : 1

  renderingTypesManager = new RenderingTypesManager(
    graphComponent,
    config.svgThreshold,
    config.nodeStyleProvider,
    config.edgeStyleProvider,
    config.nodeCreator
  )

  await config.loadGraph(graphComponent)
  void graphComponent.fitGraphBounds()
  renderingTypesManager.registerZoomChangedListener()
  renderingTypesManager.registerItemCreatedListeners()
  const masterGraph = config.foldingManager?.masterGraph || graph
  masterGraph.undoEngineEnabled = true
  if (masterGraph.undoEngine) {
    masterGraph.undoEngine.clear()
  }  initRenderingInformationUI(graphComponent)
}

function configureInteraction(graphComponent) {
  const graphEditorInputMode = new GraphEditorInputMode({
    allowGroupingOperations: true,
    allowGroupSelection: true,
    allowUngroupSelection: true,
    allowReparentNodes: true,
    allowAdjustGroupNodeSize: true,
    allowReparentToNonGroupNodes: true
  })
  
  graphEditorInputMode.navigationInputMode.allowCollapseGroup = true
  graphEditorInputMode.navigationInputMode.allowExpandGroup = true
  graphEditorInputMode.itemHoverInputMode.hoverItems = GraphItemTypes.NODE
  graphEditorInputMode.itemHoverInputMode.hoverEnabled = true
  graphEditorInputMode.itemHoverInputMode.toolTipLocationOffset = { x: 15, y: 15 }

  graphEditorInputMode.addEventListener('query-item-tool-tip', (eventArgs) => {
    if (eventArgs.handled) return
    const item = eventArgs.item
    if (item && item.tag && typeof item.tag.id !== 'undefined') {
      const { id, status } = item.tag
      eventArgs.toolTip = `Job ID: ${id} | Status: ${status}`
      eventArgs.handled = true
    }
  })

  graphComponent.inputMode = graphEditorInputMode

  graphComponent.graph.decorator.edges.positionHandler.hide()
  graphComponent.graph.decorator.nodes.reshapeHandleProvider.addFactory((node) => {
    const keepAspectRatio = new NodeReshapeHandleProvider(
      node,
      node.lookup(IReshapeHandler),
      HandlePositions.BORDER
    )
    keepAspectRatio.ratioReshapeRecognizer = EventRecognizers.ALWAYS
    return keepAspectRatio
  })
}

function initGraphInformationUI(graphComponent) {
  const inputMode = graphComponent.inputMode
  const updateGraphInformationListener = () => {
    updateGraphInformation(graphComponent.graph)
  }
  inputMode.addEventListener('node-created', updateGraphInformationListener)
  inputMode.createEdgeInputMode.addEventListener('edge-created', updateGraphInformationListener)
  inputMode.addEventListener('deleted-item', updateGraphInformationListener)
  updateGraphInformation(graphComponent.graph)
}

function updateGraphInformation(graph) {
  document.querySelector('#numberNodes').textContent = String(graph.nodes.size)
  document.querySelector('#numberEdges').textContent = String(graph.edges.size)
}

function initRenderingInformationUI(graphComponent) {
  graphComponent.addEventListener('zoom-changed', (_, graphComponent) => {
    updateRenderingInformationUI(graphComponent)
  })
  updateRenderingInformationUI(graphComponent)
  renderingTypesManager.setRenderingTypeChangedListener((newMode) => {
    const thresholdPercent = Math.floor(renderingTypesManager.svgThreshold * 100)
    const renderingInfoPopup = document.querySelector('#renderingInfoPopup')
    renderingInfoPopup.textContent =
      newMode === 'SVG'
        ? `SVG rendering at zoom above ${thresholdPercent}%`
        : `WebGL rendering at zoom below ${thresholdPercent}%`
    renderingInfoPopup.className = 'visible'
    setTimeout(() => {
      renderingInfoPopup.className = ''
    }, 3000)
  })
}

function updateRenderingInformationUI(graphComponent) {
  const zoomPercent = Math.floor(graphComponent.zoom * 100)
  document.querySelector('#zoomLevel').textContent = zoomPercent.toString()
  document.querySelector('#renderType').textContent = renderingTypesManager.currentRenderingType
}

function setUIDisabled(disabled) {
  const popup = document.querySelector('#loadingPopup')
  popup.className = disabled ? 'visible' : ''
  document.querySelector('#sampleSelection').disabled = disabled
  document.querySelector('#svgThreshold').disabled = disabled
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function initToolbar(graphComponent) {
  const sampleSelect = document.querySelector('#sampleSelection')

  addOptions(sampleSelect, 'Hierarchical')
  sampleSelect.value = 'Hierarchical'
  sampleSelect.disabled = true

  document.querySelector('#sampleName').innerText = 'Hierarchical'

  const hierarchicalOrganicDescription = document.querySelector('#hierarchicalOrganic')
  const orgChartDescription = document.querySelector('#orgChart')
  hierarchicalOrganicDescription.style.display = 'block'
  orgChartDescription.style.display = 'none'

  const config = new HierarchicalDemoConfiguration()
  const foldingManager = new FoldingManager()
  initDemoStyles(foldingManager.masterGraph, { foldingEnabled: true })
  foldingManager.folderNodeConverter = new FolderNodeConverter({
    folderNodeDefaults: {
      copyLabels: true,
      size: new Size(110, 60)
    }
  })
  const foldingView = foldingManager.createFoldingView()
  graphComponent.graph = foldingView.graph

  const inputMode = graphComponent.inputMode

  inputMode.allowCollapseGroup = true
  inputMode.allowExpandGroup = true
  config.foldingManager = foldingManager

  loadGraph(graphComponent, config).then(() => {
    config.registerNodeTooltips(graphComponent)
    updateGraphInformation(graphComponent.graph)
    setUIDisabled(false)
  })

  const svgThresholdSelect = document.querySelector('#svgThreshold')
  addOptions(
    svgThresholdSelect,
    { text: '≥ 25%', value: '0.25' },
    { text: '≥ 50%', value: '0.5' },
    { text: '≥ 100%', value: '1.0' },
    { text: 'WebGL only', value: '-1' }
  )
  svgThresholdSelect.addEventListener('change', (e) => {
    const selectElement = e.target
    const newThreshold = Number(selectElement.value)
    renderingTypesManager.svgThreshold = newThreshold < 0 ? Number.POSITIVE_INFINITY : newThreshold
    updateRenderingInformationUI(graphComponent)
  })

  // Add nav buttons
  addNavigationButtons(sampleSelect)
  addNavigationButtons(svgThresholdSelect, false)
}

run().then(finishLoading)
