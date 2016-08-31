
/**
 * EChart3 plugin for maptalks.js
 *
 * Thanks to Echarts Team (https://github.com/ecomfe/echarts)
 *
 * @author Fu Zhen (fuzhen@maptalks.org)
 *
 * MIT License
 */
(function () {
    'use strict';

    var maptalks;

    var nodeEnv = typeof module !== 'undefined' && module.exports;
    if (nodeEnv)  {
        maptalks = require('maptalks');
    } else {
        maptalks = window.maptalks;
    }

    maptalks.E3Layer = maptalks.Layer.extend({
        options : {
            'renderer' : 'dom'
        },

        initialize: function (id, ecOption, options) {
            this.setId(id);
            this._ecOption = ecOption;
            maptalks.Util.setOptions(this, options);
        },

        getEChartsOption: function () {
            return this._ecOption;
        },

        setEChartsOption: function (ecOption) {
            this._ecOption = ecOption;
            if (this._getRenderer()) {
                this._getRenderer()._clearAndRedraw();
            }
            return this;
        }
    });

    maptalks.renderer.e3layer = {};

    maptalks.renderer.e3layer.Dom = maptalks.Class.extend({
        initialize: function (layer) {
            this.layer = layer;
        },

        render: function () {
            var layer = this.layer;
            if (!this._container) {
                this._createLayerContainer();
                this._ec = echarts.init(this._container);
                this._prepareECharts();
            }
            this._ec.setOption(layer._ecOption, false);
            this.layer.fire('layerload');
        },

        getMap:function () {
            return this.layer.getMap();
        },

        show: function () {
            if (this._container) {
                this._clearAndRedraw();
                this._container.style.display = '';
            }
        },

        hide: function () {
            if (this._container) {
                this._container.style.display = 'none';
                this.clear();
            }
        },

        remove:function () {
            this._ec.clear();
            this._ec.dispose();
            delete this._ec;
            this._removeLayerContainer();
        },

        clear: function () {
            this._ec.clear();
        },

        setZIndex: function (z) {
            this._zIndex = z;
            if (this._container) {
                this._container.style.zIndex = z;

            }
        },

        isCanvasRender: function () {
            return false;
        },

        _prepareECharts: function () {
            if (!this._registered) {
                echarts.registerCoordinateSystem(
                    'maptalks', this._getE3CoordinateSystem(this.getMap())
                );
                this._registered = true;
            }
            var series = this.layer._ecOption.series;
            if (series) {
                for (var i = series.length - 1; i >= 0; i--) {
                    //change coordinateSystem to maptalks
                    series[i]['coordinateSystem'] = 'maptalks';
                    //disable update animations
                    series[i]['animation'] = false;
                }
            }
        },

        _createLayerContainer: function () {
            var size = this.getMap().getSize();
            var container = this._container = maptalks.DomUtil.createEl('div', 'maptalks-layer');
            container.style.cssText = 'position:absolute;left:0px;top:0px;';
            container.style.width = size.width + 'px';
            container.style.height = size.height + 'px';
            if (this._zIndex) {
                container.style.zIndex = this._zIndex;
            }
            this.getMap()._panels['frontLayer'].appendChild(container);
        },

        _removeLayerContainer:function () {
            if (this._container) {
                maptalks.DomUtil.removeDomNode(this._container);
            }
            delete this._levelContainers;
        },

        _resetContainer: function () {
            var point = this.getMap().offsetPlatform(),
                size = this.getMap().getSize();
            maptalks.DomUtil.offsetDom(this._container, point.multi(-1));
            this._container.style.width = size.width + 'px';
            this._container.style.height = size.height + 'px';
        },

        /**
         * Coordinate System for echarts 3
         * based on echarts's bmap plugin
         * https://github.com/ecomfe/echarts/blob/f383dcc1adb4c7b9e1888bda3fc976561a788020/extension/bmap/BMapCoordSys.js
         */
        _getE3CoordinateSystem: function (map) {
            var CoordSystem = function (map) {
                this.map = map;
                this._mapOffset = [0, 0];
            };

            CoordSystem.create = function (ecModel, api) {
                ecModel.eachSeries(function (seriesModel) {
                    if (seriesModel.get('coordinateSystem') === 'maptalks') {
                        seriesModel.coordinateSystem = new CoordSystem(map);
                    }
                });
            }

            maptalks.Util.extend(CoordSystem.prototype, {
                dimensions: ['x', 'y'],

                setMapOffset: function (mapOffset) {
                    this._mapOffset = mapOffset;
                },

                dataToPoint: function (data) {
                    var coord = new maptalks.Coordinate(data);
                    var px = this.map.coordinateToContainerPoint(coord);
                    var mapOffset = this._mapOffset;
                    return [px.x - mapOffset[0], px.y - mapOffset[1]];
                },

                pointToData: function (pt) {
                    var mapOffset = this._mapOffset;
                    var pt = this._bmap.containerPointToCoordinate({
                        x: pt[0] + mapOffset[0],
                        y: pt[1] + mapOffset[1]
                    });
                    return [pt.x, pt.y];
                },

                getViewRect: function () {
                    var size = this.map.getSize();
                    return new echarts.graphic.BoundingRect(0, 0, size.width, size.height);
                },

                getRoamTransform: function () {
                    return echarts.matrix.create();
                }
            });

            return CoordSystem;
        },

        getEvents: function () {
            return {
                '_zoomstart' : this.onZoomStart,
                '_zoomend'   : this.onZoomEnd,
                '_moveend'   : this.onMoveEnd,
                '_resize'    : this._clearAndRedraw
            }
        },

        onMoveEnd: function () {
            this._resetContainer();
            this._ec.resize();
        },

        _clearAndRedraw: function () {
            this._ec.clear();
            this._resetContainer();
            this._ec.resize();
            this.render();
        },

        onZoomStart: function () {
            this.hide();
        },

        onZoomEnd: function () {
            this.show();
        }
    });

    maptalks.E3Layer.registerRenderer('dom', maptalks.renderer.e3layer.Dom);

    if (nodeEnv) {
        exports = module.exports = maptalks.E3Layer;
    }

})();
