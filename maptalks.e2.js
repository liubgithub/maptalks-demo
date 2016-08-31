
/**
 * EChart2 plugin for maptalks.js
 *
 * @author Fu Zhen (fuzhen@maptalks.org)
 *
 * Based on echarts2 BMap plugin, a work of Neil (杨骥, 511415343@qq.com), thanks for his awesome works.
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

    maptalks.E2Layer = maptalks.Layer.extend({
        options : {
            'renderer' : 'dom'
        },

        initialize: function (id, ec, ecOption, options) {
            this.setId(id);
            this._ec = ec;
            this._ecOption = ecOption;
            maptalks.Util.setOptions(this, options);
        }
    });

    maptalks.renderer.e2layer = {};

    maptalks.renderer.e2layer.Dom = maptalks.Class.extend({
        initialize: function (layer) {
            this.layer = layer;
        },

        render: function () {
            var layer = this.layer;
            if (!this._container) {
                this._createLayerContainer();
                this._ec = layer._ec.init(this._container);

            }
            this._parseECOption(layer._ecOption);
            this._ec.setOption(layer._ecOption, false);
            this.layer.fire('layerload');
        },

        getMap:function () {
            return this.layer.getMap();
        },

        show: function () {
            if (this._container) {
                this._redrawCharts();
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

        _parseECOption: function (option) {
            var series = option.series || {};

            if (!this._geoCoord) {
                this._geoCoord = {};
            }

            // 记录所有的geoCoord
            for (var i = 0, item; item = series[i++];) {
                var geoCoord = item.geoCoord;
                if (geoCoord) {
                    for (var k in geoCoord) {
                        this._geoCoord[k] = geoCoord[k];
                    }
                }
            }

            // 添加x、y
            for (var i = 0, item; item = series[i++];) {
                var markPoint = item.markPoint || {};
                var markLine = item.markLine || {};

                var data = markPoint.data;
                if (data && data.length) {
                    for (var k in data) {
                        this._addPos(data[k]);
                    }
                }

                data = markLine.data;
                if (data && data.length) {
                    for (var k in data) {
                        this._addPos(data[k][0]);
                        this._addPos(data[k][1]);
                    }
                }
            }
        },

        _addPos : function (obj) {
            var coord;
            if (obj.geoCoord) {
                coord = obj.geoCoord;
            } else if (obj.name) {
                coord = this._geoCoord[obj.name]
            }
            var pos = this.getMap().coordinateToContainerPoint(new maptalks.Coordinate(coord));
            obj.x = pos.x;
            obj.y = pos.y;
        },

        getEvents: function () {
            return {
                '_zoomstart' : this.onZoomStart,
                '_zoomend'   : this._redrawCharts,
                '_moveend'   : this._redrawCharts,
                '_resize'    : this._redrawCharts
            }
        },

        onMoveEnd: function () {
            this._resetContainer();
            this._ec.resize();
        },

        _redrawCharts: function () {
            this._ec.clear();
            this._resetContainer();
            this._ec.resize();
            this.render();
        },

        onZoomStart: function () {
            this._ec.clear();
        }
    });

    maptalks.E2Layer.registerRenderer('dom', maptalks.renderer.e2layer.Dom);

    if (nodeEnv) {
        exports = module.exports = maptalks.E2Layer;
    }

})();
