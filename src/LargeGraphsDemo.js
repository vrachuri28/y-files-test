import {
  GraphComponent,
  GraphViewerInputMode,
  GraphItemTypes,
  License,
  FoldingManager,
  FolderNodeConverter,
  Size,
  INode,
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

  configureReadOnlyInteraction(graphComponent)

  initToolbar(graphComponent)

  initGraphInformationUI(graphComponent)
}

async function loadGraph(graphComponent, config) {
  const startTime = performance.now()
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
  }

  initRenderingInformationUI(graphComponent)

  const endTime = performance.now()
  console.log(`⏱️ Graph rendered in ${(endTime - startTime).toFixed(2)} ms`)
}

function configureReadOnlyInteraction(graphComponent) {
  const viewerInputMode = new GraphViewerInputMode({
    clickableItems: GraphItemTypes.NODE,
    focusableItems: GraphItemTypes.NONE,
    selectableItems: GraphItemTypes.NODE,
    marqueeSelectableItems: GraphItemTypes.NONE,
    contextMenuItems: GraphItemTypes.NODE,
    toolTipItems: GraphItemTypes.NODE
  });

  viewerInputMode.navigationInputMode.allowExpandGroup = true;
  viewerInputMode.navigationInputMode.allowCollapseGroup = true;

  viewerInputMode.itemHoverInputMode.hoverItems = GraphItemTypes.NODE;
  viewerInputMode.itemHoverInputMode.hoverEnabled = true;
  viewerInputMode.itemHoverInputMode.toolTipLocationOffset = { x: 15, y: 15 };

  viewerInputMode.navigationInputMode.allowZoom = true;

  viewerInputMode.addEventListener('populate-item-context-menu', (evt) => {
    if (evt.item instanceof INode) {
      evt.contextMenu = [
        {
          label: 'ID',
          action: () => {
            console.log('Current Node Id', evt.item.tag.id);
          }
        },
        {
          label: 'Status',
          action: () => {
            console.log('Current Node Status', evt.item.tag.status);
          }
        }
      ];
      evt.handled = true;
    }
  });

  // Handle tooltips
  viewerInputMode.addEventListener('query-item-tool-tip', (evt) => {
    if (evt.handled) return;
    const item = evt.item;
    if (item && item.tag && typeof item.tag.id !== 'undefined') {
      const { id, status } = item.tag;
      evt.toolTip = `Job ID: ${id} | Status: ${status}`;
      evt.handled = true;
    }
  });

  graphComponent.inputMode = viewerInputMode;
}
function initGraphInformationUI(graphComponent) {
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

function initToolbar(graphComponent) {
  const sampleSelect = document.querySelector('#sampleSelection')

  addOptions(
    sampleSelect,
    { text: 'Hierarchical:2000 nodes', value: 'hierarchical-2000' },
    { text: 'Hierarchical:5000 nodes', value: 'hierarchical-5000' },
    { text: 'Hierarchical:10000 nodes', value: 'hierarchical-10000' },
    { text: 'Hierarchical:20000 nodes', value: 'hierarchical-20000' },
    { text: 'Hierarchical:50000 nodes', value: 'hierarchical-50000' }

  )

  sampleSelect.value = 'hierarchical-10000'
  sampleSelect.disabled = false
  document.querySelector('#sampleName').innerText = 'Hierarchical'

  const hierarchicalOrganicDescription = document.querySelector('#hierarchicalOrganic')
  const orgChartDescription = document.querySelector('#orgChart')
  hierarchicalOrganicDescription.style.display = 'block'
  orgChartDescription.style.display = 'none'

  const foldingManager = new FoldingManager()
  initDemoStyles(foldingManager.masterGraph, { foldingEnabled: true })
  foldingManager.folderNodeConverter = new FolderNodeConverter({
    folderNodeDefaults: {
      copyLabels: true,
      size: new Size(110, 60)
    }
  })

  async function loadSelectedConfig(value) {
    let configPath = 'resources/hierarchic-50000.json'
    switch (value) {
      case 'hierarchical-2000':
        configPath = 'resources/hierarchic-2000.json'
        break
      case 'hierarchical-5000':
        configPath = 'resources/hierarchic-5000.json'
        break
      case 'hierarchical-10000':
        configPath = 'resources/hierarchic-10000-11000-circles.json'
        break
      case 'hierarchical-20000':
        configPath = 'resources/hierarchic-20000.json'
        break
      }
    const config = new HierarchicalDemoConfiguration(configPath)
    config.foldingManager = foldingManager
    await loadGraph(graphComponent, config)
    config.registerZoomStyleSwitcher(graphComponent)
    config.initializeGraph(graphComponent)

    config.registerNodeTooltips(graphComponent)
    updateGraphInformation(graphComponent.graph)
  }

  loadSelectedConfig('hierarchical-10000')

  sampleSelect.addEventListener('change', async (e) => {
    const selected = e.target.value
    document.querySelector('#sampleName').innerText = e.target.options[e.target.selectedIndex].text
    await loadSelectedConfig(selected)
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

  addNavigationButtons(sampleSelect)
  addNavigationButtons(svgThresholdSelect, false)
}

run().then(finishLoading)
