<template xmlns:>
  <div id="app" :class="[$options.name]">
    <!-- app map -->
    <vl-map v-if="mapVisible" class="map" ref="map" :load-tiles-while-animating="true" :load-tiles-while-interacting="true"
            @click="clickCoordinate = $event.coordinate" @postcompose="onMapPostCompose"
            data-projection="EPSG:4326" @mounted="onMapMounted">
      <!-- map view aka ol.View -->
      <vl-view ref="view" :center.sync="center" :zoom.sync="zoom" :rotation.sync="rotation"></vl-view>

      <!-- interactions -->
      <vl-interaction-select :features.sync="selectedFeatures" v-if="drawType == null">
        <template slot-scope="select">
          <!-- select styles -->
          <vl-style-box>
            <vl-style-stroke color="#423e9e" :width="7"></vl-style-stroke>
            <vl-style-fill :color="[254, 178, 76, 0.7]"></vl-style-fill>
            <vl-style-circle :radius="5">
              <vl-style-stroke color="#423e9e" :width="7"></vl-style-stroke>
              <vl-style-fill :color="[254, 178, 76, 0.7]"></vl-style-fill>
            </vl-style-circle>
          </vl-style-box>
          <vl-style-box :z-index="1">
            <vl-style-stroke color="#d43f45" :width="2"></vl-style-stroke>
            <vl-style-circle :radius="5">
              <vl-style-stroke color="#d43f45" :width="2"></vl-style-stroke>
            </vl-style-circle>
          </vl-style-box>
          <!--// select styles -->

          <!-- selected feature popup -->
          <vl-overlay class="feature-popup" v-for="feature in select.features" :key="feature.id" :id="feature.id"
                      :position="pointOnSurface(feature.geometry)" :auto-pan="true" :auto-pan-animation="{ duration: 300 }">
            <template slot-scope="popup">
              <section class="card">
                <header class="card-header">
                  <p class="card-header-title">
                    Feature ID {{ feature.id }}
                  </p>
                  <a class="card-header-icon" title="Close"
                     @click="selectedFeatures = selectedFeatures.filter(f => f.id !== feature.id)">
                    <b-icon icon="close"></b-icon>
                  </a>
                </header>
                <div class="card-content">
                  <div class="content">
                    <p>
                      Overlay popup content for Feature with ID <strong>{{ feature.id }}</strong>
                    </p>
                    <p>
                      Popup: {{ JSON.stringify(popup) }}
                    </p>
                    <p>
                      Feature: {{ JSON.stringify({ id: feature.id, properties: feature.properties }) }}
                    </p>
                  </div>
                </div>
              </section>
            </template>
          </vl-overlay>
          <!--// selected popup -->
        </template>
      </vl-interaction-select>
      <!--// interactions -->

      <!-- geolocation -->
      <vl-geoloc @update:position="onUpdatePosition">
        <template slot-scope="geoloc">
          <vl-feature v-if="geoloc.position" id="position-feature">
            <vl-geom-point :coordinates="geoloc.position"></vl-geom-point>
            <vl-style-box>
              <vl-style-icon src="./assets/marker.png" :scale="0.4" :anchor="[0.5, 1]"></vl-style-icon>
            </vl-style-box>
          </vl-feature>
        </template>
      </vl-geoloc>
      <!--// geolocation -->

      <!-- overlay marker with animation -->
      <vl-feature id="marker" ref="marker" :properties="{ start: Date.now(), duration: 2500 }">
        <template slot-scope="feature">
          <vl-geom-point :coordinates="[-10, -10]"></vl-geom-point>
          <vl-style-box>
            <vl-style-icon src="./assets/flag.png" :scale="0.5" :anchor="[0.1, 0.95]" :size="[128, 128]"></vl-style-icon>
          </vl-style-box>
          <!-- overlay binded to feature -->
          <vl-overlay v-if="feature.geometry" :position="pointOnSurface(feature.geometry)" :offset="[10, 10]">
            <p class="is-light box content">
              Always opened overlay for Feature ID <strong>{{ feature.id }}</strong>
            </p>
          </vl-overlay>
        </template>
      </vl-feature>
      <!--// overlay marker -->


      <!-- circle geom -->
      <vl-feature id="circle">
        <vl-geom-circle :radius="1000000" :coordinates="[0, 30]"></vl-geom-circle>
      </vl-feature>
      <!--// circle geom -->

      <!-- base layers -->
      <vl-layer-tile v-for="layer in baseLayers" :key="layer.name" :id="layer.name" :visible="layer.visible">
        <component :is="'vl-source-' + layer.name" v-bind="layer"></component>
      </vl-layer-tile>
      <!--// base layers -->

      <!-- other layers from config -->
      <component v-for="layer in layers" :is="layer.cmp" v-if="layer.visible" :key="layer.id" v-bind="layer">
        <!-- add vl-source-* -->
        <component :is="layer.source.cmp" v-bind="layer.source">
          <!-- add static features to vl-source-vector if provided -->
          <vl-feature v-if="layer.source.staticFeatures && layer.source.staticFeatures.length"
                      v-for="feature in layer.source.staticFeatures" :key="feature.id"
                      :id="feature.id" :properties="feature.properties">
            <component :is="geometryTypeToCmpName(feature.geometry.type)" v-bind="feature.geometry"></component>
          </vl-feature>

          <!-- add inner source if provided (like vl-source-vector inside vl-source-cluster) -->
          <component v-if="layer.source.source" :is="layer.source.source.cmp" v-bind="layer.source.source">
            <!-- add static features to vl-source-vector if provided -->
            <vl-feature v-if="layer.source.source.staticFeatures && layer.source.source.staticFeatures.length"
                        v-for="feature in layer.source.source.staticFeatures" :key="feature.id"
                        :id="feature.id" :properties="feature.properties">
              <component :is="geometryTypeToCmpName(feature.geometry.type)" v-bind="feature.geometry"></component>
            </vl-feature>
          </component>
        </component>
        <!--// vl-source-* -->

        <!-- add style components if provided -->
        <!-- create vl-style-box or vl-style-func -->
        <component v-if="layer.style" v-for="(style, i) in layer.style" :key="i" :is="style.cmp" v-bind="style">
          <!-- create inner style components: vl-style-circle, vl-style-icon, vl-style-fill, vl-style-stroke & etc -->
          <component v-if="style.styles" v-for="(st, cmp) in style.styles" :key="cmp" :is="cmp" v-bind="st">
            <!-- vl-style-fill, vl-style-stroke if provided -->
            <vl-style-fill v-if="st.fill" v-bind="st.fill"></vl-style-fill>
            <vl-style-stroke v-if="st.stroke" v-bind="st.stroke"></vl-style-stroke>
          </component>
        </component>
        <!--// style -->
      </component>
      <!--// other layers -->

      <!-- draw components -->
      <vl-layer-vector id="draw-pane" v-if="mapPanel.tab === 'draw'">
        <vl-source-vector ident="draw-target" :features.sync="drawnFeatures"></vl-source-vector>
      </vl-layer-vector>

      <vl-interaction-draw v-if="mapPanel.tab === 'draw' && drawType" source="draw-target" :type="drawType"></vl-interaction-draw>
      <vl-interaction-modify v-if="mapPanel.tab === 'draw'" source="draw-target"></vl-interaction-modify>
      <vl-interaction-snap v-if="mapPanel.tab === 'draw'" source="draw-target" :priority="10"></vl-interaction-snap>
      <!--// draw components -->
    </vl-map>
    <!--// app map -->

    <!-- map panel, controls -->
    <div class="map-panel">
      <b-collapse class="panel box is-paddingless" :open.sync="panelOpen">
        <div slot="trigger" class="panel-heading">
          <div class="columns">
            <div class="column is-11">
              <strong>Map panel</strong>
            </div>
            <div class="column">
              <b-icon :icon="panelOpen ? 'chevron-up' : 'chevron-down'" size="is-small"></b-icon>
            </div>
          </div>
        </div>
        <p class="panel-tabs">
          <a @click="showMapPanelTab('state')" :class="mapPanelTabClasses('state')">State</a>
          <a @click="showMapPanelTab('layers')" :class="mapPanelTabClasses('layers')">Layers</a>
          <a @click="showMapPanelTab('draw')" :class="mapPanelTabClasses('draw')">Draw</a>
        </p>

        <div class="panel-block" v-show="mapPanel.tab === 'state'">
          <table class="table is-fullwidth">
            <tr>
              <th>Map center</th>
              <td>{{ center }}</td>
            </tr>
            <tr>
              <th>Map zoom</th>
              <td>{{ zoom }}</td>
            </tr>
            <tr>
              <th>Map rotation</th>
              <td>{{ rotation }}</td>
            </tr>
            <tr>
              <th>Device coordinate</th>
              <td>{{ deviceCoordinate }}</td>
            </tr>
            <tr>
              <th>Selected features</th>
              <td>{{ selectedFeatures.map(f => f.id) }}</td>
            </tr>
          </table>
        </div>

        <div class="panel-block" v-for="layer in layers" :key="layer.id" @click="showMapPanelLayer"
             :class="{ 'is-active': layer.visible }"
             v-show="mapPanel.tab === 'layers'">
          <b-switch :key="layer.id" v-model="layer.visible">
            {{ layer.title }}
          </b-switch>
        </div>

        <div class="panel-block draw-panel" v-show="mapPanel.tab === 'draw'">
          <div class="buttons">
            <button v-for="control in drawControls" :key="control.type || -1" @click="drawType = control.type"
                    :class="drawType && drawType === control.type ? 'is-info' : ''" class="button" >
              <b-icon :icon="control.icon"></b-icon>
              <span>{{ control.label }}</span>
            </button>
          </div>
        </div>
      </b-collapse>
    </div>
    <!--// map panel, controls -->

    <!-- base layers switch -->
    <div class="base-layers-panel">
      <div class="buttons has-addons">
        <button class="button is-light" v-for="layer in baseLayers"
                :key="layer.name" :class="{ 'is-info': layer.visible }"
                @click="showBaseLayer(layer.name)">
          {{ layer.title }}
        </button>
        <button class="button is-light" @click="mapVisible = !mapVisible">
          {{ mapVisible ? 'Hide map' : 'Show map' }}
        </button>
      </div>
    </div>
    <!--// base layers -->
  </div>
</template>

<script>
  import { kebabCase, range, random, camelCase } from 'lodash'
  import { createProj, addProj, findPointOnSurface, createStyle, createMultiPointGeom, loadingBBox } from 'vuelayers/lib/ol-ext'
  import pacmanFeaturesCollection from './assets/pacman.geojson'
  import ScaleLine from 'ol/control/ScaleLine'
  import FullScreen from 'ol/control/FullScreen'
  import OverviewMap from 'ol/control/OverviewMap'
  import ZoomSlider from 'ol/control/ZoomSlider'

  // Custom projection for static Image layer
  let x = 1024 * 10000
  let y = 968 * 10000
  let imageExtent = [-x / 2, -y / 2, x / 2, y / 2]
  let customProj = createProj({
    code: 'xkcd-image',
    units: 'pixels',
    extent: imageExtent,
  })
  // add to the list of known projections
  // after that it can be used by code
  addProj(customProj)

  const easeInOut = t => 1 - Math.pow(1 - t, 3)

  const methods = {
    camelCase,
    pointOnSurface: findPointOnSurface,
    geometryTypeToCmpName (type) {
      return 'vl-geom-' + kebabCase(type)
    },
    /**
     * Packman layer Style function factory
     * @return {ol.StyleFunction}
     */
    pacmanStyleFunc () {
      const pacman = [
        createStyle({
          strokeColor: '#de9147',
          strokeWidth: 3,
          fillColor: [222, 189, 36, 0.8],
        }),
      ]
      const path = [
        createStyle({
          strokeColor: 'blue',
          strokeWidth: 1,
        }),
        createStyle({
          imageRadius: 5,
          imageFillColor: 'orange',
          geom (feature) {
            // geometry is an LineString, convert it to MultiPoint to style vertex
            return createMultiPointGeom(feature.getGeometry().getCoordinates())
          },
        }),
      ]
      const eye = [
        createStyle({
          imageRadius: 6,
          imageFillColor: '#444444',
        }),
      ]

      return function __pacmanStyleFunc (feature) {
        switch (feature.getId()) {
          case 'pacman':
            return pacman
          case 'pacman-path':
            return path
          case 'pacman-eye':
            return eye
        }
      }
    },
    /**
     * Cluster layer style function factory
     * @return {ol.StyleFunction}
     */
    clusterStyleFunc () {
      const cache = {}

      return function __clusterStyleFunc (feature) {
        const size = feature.get('features').length
        let style = cache[size]

        if (!style) {
          style = createStyle({
            imageRadius: 10,
            strokeColor: '#fff',
            fillColor: '#3399cc',
            text: size.toString(),
            textFillColor: '#fff',
          })
          cache[size] = style
        }
        return [style]
      }
    },
    selectFilter (feature) {
      return ['position-feature'].indexOf(feature.getId()) === -1
    },
    onUpdatePosition (coordinate) {
      this.deviceCoordinate = coordinate
    },
    onMapPostCompose ({ vectorContext, frameState }) {
      if (!this.$refs.marker || !this.$refs.marker.$feature) return

      const feature = this.$refs.marker.$feature
      if (!feature.getGeometry() || !feature.getStyle()) return

      const flashGeom = feature.getGeometry().clone()
      const duration = feature.get('duration')
      const elapsed = frameState.time - feature.get('start')
      const elapsedRatio = elapsed / duration
      const radius = easeInOut(elapsedRatio) * 35 + 5
      const opacity = easeInOut(1 - elapsedRatio)
      const fillOpacity = easeInOut(0.5 - elapsedRatio)

      vectorContext.setStyle(createStyle({
        imageRadius: radius,
        fillColor: [119, 170, 203, fillOpacity],
        strokeColor: [119, 170, 203, opacity],
        strokeWidth: 2 + opacity,
      }))

      vectorContext.drawGeometry(flashGeom)
      vectorContext.setStyle(feature.getStyle()(feature)[0])
      vectorContext.drawGeometry(feature.getGeometry())

      if (elapsed > duration) {
        feature.set('start', Date.now())
      }

      this.$refs.map.render()
    },
    onMapMounted () {
      // now ol.Map instance is ready and we can work with it directly
      this.$refs.map.$map.getControls().extend([
        new ScaleLine(),
        new FullScreen(),
        new OverviewMap({
          collapsed: false,
          collapsible: true,
        }),
        new ZoomSlider(),
      ])
    },
    // base layers
    showBaseLayer (name) {
      let layer = this.baseLayers.find(layer => layer.visible)
      if (layer != null) {
        layer.visible = false
      }

      layer = this.baseLayers.find(layer => layer.name === name)
      if (layer != null) {
        layer.visible = true
      }
    },
    // map panel
    mapPanelTabClasses (tab) {
      return {
        'is-active': this.mapPanel.tab === tab,
      }
    },
    showMapPanelLayer (layer) {
      layer.visible = !layer.visible
    },
    showMapPanelTab (tab) {
      this.mapPanel.tab = tab
      if (tab !== 'draw') {
        this.drawType = undefined
      }
    },
  }

  export default {
    name: 'vld-demo-app',
    methods,
    data () {
      return {
        center: [0, 0],
        zoom: 2,
        rotation: 0,
        clickCoordinate: undefined,
        selectedFeatures: [],
        deviceCoordinate: undefined,
        mapPanel: {
          tab: 'state',
        },
        panelOpen: true,
        mapVisible: true,
        drawControls: [
          {
            type: 'point',
            label: 'Draw Point',
            icon: 'map-marker',
          },
          {
            type: 'line-string',
            label: 'Draw LineString',
            icon: 'minus',
          },
          {
            type: 'polygon',
            label: 'Draw Polygon',
            icon: 'square-o',
          },
          {
            type: 'circle',
            label: 'Draw Circle',
            icon: 'circle-thin',
          },
          {
            type: undefined,
            label: 'Stop drawing',
            icon: 'times',
          },
        ],
        drawType: undefined,
        drawnFeatures: [],
        // base layers
        baseLayers: [
          {
            name: 'osm',
            title: 'OpenStreetMap',
            visible: true,
          },
          {
            name: 'sputnik',
            title: 'Sputnik Maps',
            visible: false,
          },
          // needs paid plan to get key
          // {
          //   name: 'mapbox',
          //   title: 'Mapbox',
          // },
          {
            name: 'bingmaps',
            title: 'Bing Maps',
            apiKey: 'ArbsA9NX-AZmebC6VyXAnDqjXk6mo2wGCmeYM8EwyDaxKfQhUYyk0jtx6hX5fpMn',
            imagerySet: 'CanvasGray',
            visible: false,
          },
        ],
        // layers config
        layers: [
          // Packman vector layer with static vector features
          // rendered through vl-feature component.
          {
            id: 'pacman',
            title: 'Pacman',
            cmp: 'vl-layer-vector',
            visible: false,
            renderMode: 'image',
            source: {
              cmp: 'vl-source-vector',
              staticFeatures: pacmanFeaturesCollection.features,
            },
            style: [
              {
                cmp: 'vl-style-func',
                factory: this.pacmanStyleFunc,
              },
            ],
          },
          // Circles
          {
            id: 'circles',
            title: 'Circles',
            cmp: 'vl-layer-vector',
            visible: false,
            source: {
              cmp: 'vl-source-vector',
              staticFeatures: range(0, 100).map(i => {
                let coordinate = [
                  random(-50, 50),
                  random(-50, 50),
                ]

                return {
                  type: 'Feature',
                  id: 'random-cirlce-' + i,
                  geometry: {
                    type: 'Circle',
                    coordinates: coordinate,
                    radius: random(Math.pow(10, 5), Math.pow(10, 6)),
                  },
                }
              }),
            },
          },
          // Countries vector layer
          // loads GeoJSON data from remote server
          {
            id: 'countries',
            title: 'Countries',
            cmp: 'vl-layer-vector',
            visible: false,
            source: {
              cmp: 'vl-source-vector',
              url: 'https://openlayers.org/en/latest/examples/data/geojson/countries.geojson',
            },
            style: [
              {
                cmp: 'vl-style-box',
                styles: {
                  'vl-style-fill': {
                    color: [255, 255, 255, 0.5],
                  },
                  'vl-style-stroke': {
                    color: '#219e46',
                    width: 2,
                  },
                  'vl-style-text': {
                    text: '\uf041',
                    font: '24px FontAwesome',
                    fill: {
                      color: '#2355af',
                    },
                    stroke: {
                      color: 'white',
                    },
                  },
                },
              },
            ],
          },
          // Tile layer with WMS source
          {
            id: 'wms',
            title: 'WMS',
            cmp: 'vl-layer-tile',
            visible: false,
            source: {
              cmp: 'vl-source-wms',
              url: 'https://ahocevar.com/geoserver/wms',
              layers: 'topp:states',
              extParams: { TILED: true },
              serverType: 'geoserver',
            },
          },
          // Tile layer with WMTS source
          {
            id: 'wmts',
            title: 'WMTS',
            cmp: 'vl-layer-tile',
            visible: false,
            source: {
              cmp: 'vl-source-wmts',
              url: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/',
              layerName: '0',
              matrixSet: 'EPSG:3857',
              format: 'image/png',
              styleName: 'default',
            },
          },
          // Vector layer with clustering
          {
            id: 'cluster',
            title: 'Cluster',
            cmp: 'vl-layer-vector',
            renderMode: 'image',
            visible: false,
            // Cluster source (vl-source-cluster) wraps vector source (vl-source-vector)
            source: {
              cmp: 'vl-source-cluster',
              distance: 50,
              source: {
                cmp: 'vl-source-vector',
                // features defined as array of GeoJSON encoded Features
                // to not overload Vue and DOM
                features: range(0, 10000).map(i => {
                  let coordinate = [
                    random(-50, 50),
                    random(-50, 50),
                  ]

                  return {
                    type: 'Feature',
                    id: 'random-' + i,
                    geometry: {
                      type: 'Point',
                      coordinates: coordinate,
                    },
                  }
                }),
              },
            },
            style: [
              {
                cmp: 'vl-style-func',
                factory: this.clusterStyleFunc,
              },
            ],
          },
          {
            id: 'wfs',
            title: 'WFS (Canada water areas)',
            cmp: 'vl-layer-vector',
            visible: false,
            renderMode: 'image',
            source: {
              cmp: 'vl-source-vector',
              features: [],
              url (extent, resolution, projection) {
                return 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
                  'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
                  'outputFormat=application/json&srsname=' + projection + '&' +
                  'bbox=' + extent.join(',') + ',' + projection
              },
              strategyFactory () {
                return loadingBBox
              },
            },
          },
          {
            id: 'static-image',
            title: 'Static Image with custom projection',
            cmp: 'vl-layer-image',
            visible: false,
            source: {
              cmp: 'vl-source-image-static',
              projection: customProj.getCode(),
              url: 'https://imgs.xkcd.com/comics/online_communities.png',
              size: [1024, 968],
              extent: imageExtent,
            },
          },
          {
            id: 'wms-image',
            title: 'Image WMS',
            cmp: 'vl-layer-image',
            visible: false,
            source: {
              cmp: 'vl-source-image-wms',
              url: 'https://ahocevar.com/geoserver/wms',
              layers: 'topp:states',
              serverType: 'geoserver',
            },
          },
          {
            id: 'vector-tiles',
            title: 'Vector tiles',
            cmp: 'vl-layer-vector-tile',
            visible: false,
            source: {
              cmp: 'vl-source-vector-tile',
              url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf',
            },
            style: [
              {
                cmp: 'vl-style-box',
                styles: {
                  'vl-style-stroke': {
                    width: 2,
                    color: '#2979ff',
                  },
                  'vl-style-circle': {
                    radius: 5,
                    stroke: {
                      width: 1.5,
                      color: '#2979ff',
                    },
                  },
                },
              },
            ],
          },
        ],
      }
    },
  }
</script>

<style lang="sass">
  @import ~bulma/sass/utilities/_all

  html, body, #app
    width: 100%
    height: 100%
    margin: 0
    padding: 0

  .vld-demo-app
    position: relative

    .map
      height: 100%
      width: 100%

    .map-panel
      padding: 0

      .panel-heading
        box-shadow: 0 .25em .5em transparentize($dark, 0.8)

      .panel-content
        background: $white
        box-shadow: 0 .25em .5em transparentize($dark, 0.8)

      .panel-block
        &.draw-panel
          .buttons
            .button
              display: block
              flex: 1 1 100%

      +tablet()
        position: absolute
        top: 0
        right: 0
        max-height: 500px
        width: 22em

    .base-layers-panel
      position: absolute
      left: 50%
      bottom: 20px
      transform: translateX(-50%)

    .feature-popup
      position: absolute
      left: -50px
      bottom: 12px
      width: 20em
      max-width: none

      &:after, &:before
        top: 100%
        border: solid transparent
        content: ' '
        height: 0
        width: 0
        position: absolute
        pointer-events: none
      &:after
        border-top-color: white
        border-width: 10px
        left: 48px
        margin-left: -10px
      &:before
        border-top-color: #cccccc
        border-width: 11px
        left: 48px
        margin-left: -11px

      .card-content
        max-height: 20em
        overflow: auto

      .content
        word-break: break-all
</style>
