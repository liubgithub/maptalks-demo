(function () {
    'use strict';

    var maptalks;

    var nodeEnv = typeof module !== 'undefined' && module.exports;
    if (nodeEnv)  {
        maptalks = require('maptalks');
    } else {
        maptalks = window.maptalks;
    }

    function getGradient(colors) {
        return {
            type : 'radial',
            colorStops : [
              [0.70, 'rgba(' + colors.join() + ', 0.5)'],
              [0.30, 'rgba(' + colors.join() + ', 1)'],
              [0.20, 'rgba(' + colors.join() + ', 1)'],
              [0.00 , 'rgba(' + colors.join() + ', 0)']
            ]
        };
    }


    function getSymbol(prop) {
        return {
            'markerType' : 'ellipse',
            'markerFill' : {property:prop, type:'interval', stops: [[0, getGradient([255, 255, 0])], [40, getGradient([135, 196, 240])], [80, getGradient([216, 115, 149])]]},//stops: [[0, 'rgb(135, 196, 240)'], [9, '#1bbc9b'], [99, 'rgb(216, 115, 149)']]},
            'markerFillOpacity' : 0.8,
            'markerWidth' : {property:prop, type:'interval', stops: [[0, 20], [40, 40], [80, 60]]},
            'markerHeight' : 40
        };
    }

    maptalks.HaloLayer = maptalks.OverlayLayer.extend({

        options: {
            'haloProperty' : 'count',
            'animation' : true,
            'randomAnimation' : true,
            'animationDuration' : 3000,
            'symbol' : null
        },

        initialize: function (id, data, opts) {
            this.setId(id);
            maptalks.Util.setOptions(this, opts);
            this.addGeometry(data);
        },

        addGeometry: function (points) {
            points.forEach(function (point, index) {
                if (!(point instanceof maptalks.Marker)) {
                    throw new Error('The geometry at ' + index + ' to add is not a maptalks.Marker');
                }
            });
            maptalks.OverlayLayer.prototype.addGeometry.apply(this, arguments);
        },

        redraw: function () {
            if (this._getRenderer()) {
                this._getRenderer().redraw();
            }
            return this;
        }
    });

    maptalks.renderer.halolayer = {};

    maptalks.renderer.halolayer.Canvas = maptalks.renderer.Canvas.extend({
        initialize: function (layer) {
            this.layer = layer;
            this._prepare();
        },

        draw: function () {
            if (!this.isLoaded()) {
                this.completeRender();
            }
            if (this._animId) {
                maptalks.Util.cancelAnimFrame(this._animId);
            }
            this._animate();
        },

        transform: function () {
            return false;
        },

        redraw: function () {
            if (this._animId) {
                maptalks.Util.cancelAnimFrame(this._animId);
            }
            this._prepare();
            this.render();
        },

        _animate: function () {
            this.prepareCanvas();
            this._drawHalos();
           if (this.layer.options['animation'] && !this.getMap()._zooming && !this.getMap()._moving) {
                this.requestMapToRender();
                this._animId = maptalks.Util.requestAnimFrame(function () {
                    this._animate();
                }.bind(this));
            }
        },

        _prepare: function () {
            var layer = this.layer,
                argFn =  maptalks.Util.bind(function () {
                    return [this.getMap().getZoom(), this._currentGeo.getProperties()];
                }, this),
                symbol = layer.options['symbol'] || getSymbol(layer.options['haloProperty']);
            this._haloProperty = symbol['markerFill']['property'];
            if (!symbol['markerType']) {
                symbol['markerType'] = 'ellipse';
            }
            this._originSymbol = symbol;
            this._symbol = maptalks.Util.loadFunctionTypes(symbol, argFn);
            this._prepareHalos();
        },

        _drawHalos: function (matrix) {
            var ctx = this.context,
                map = this.getMap(),
                size = map.getSize(),
                extent = new maptalks.PointExtent(0, 0, size['width'], size['height']),
                min = this._extent2D.getMin(),
                duration = this.layer.options['animationDuration'],
                now = maptalks.Util.now();
            var globalAlpha = ctx.globalAlpha;
            this._currentHalos.forEach(function (halo) {
                if (!halo.g.isVisible()) {
                    return;
                }
                var r = 1;
                if (this.layer.options['animation']) {
                    r = ((now - halo.start) % (duration)) / duration;
                }
                var p = halo.point.substract(min),
                    size = r * halo.size,
                    offset = size / 2,
                    pExt = new maptalks.PointExtent(p.substract(size/2, size/2), p.add(size/2, size/2));
                if (!extent.intersects(pExt)) {
                    return;
                }
                var op = 1;
                if (this.layer.options['animation']) {
                    op = (r >= 0.5 ? 2 - r * 2 : 1);
                }
                var cache = this._haloCache[halo['cacheKey']];
                if (cache && op > 0) {
                    ctx.globalAlpha = globalAlpha * op;
                    ctx.drawImage(cache, p.x - offset, p.y - offset, size, size);
                    ctx.globalAlpha = globalAlpha;
                }
                // if (maptalks.Util.isGradient(halo.symbol['polygonFill'])) {
                //     halo.symbol['polygonGradientExtent'] = pExt;
                // }
                // maptalks.Canvas.prepareCanvas(ctx, halo.symbol);
                // maptalks.Canvas.ellipse(ctx, p, size, size, 0, halo.symbol['polygonOpacity'] * op);
            }, this);
        },

        _prepareHalos: function () {
            var map =  this.getMap(),
                halos = [],
                argFn =  maptalks.Util.bind(function () {
                    return [this.getMap().getZoom(), this._currentGeo.getProperties()];
                }, this);
            this._maxSize = 0;
            this._haloSymbols = {};
            this.layer.forEach(function (g) {
                this._currentGeo = g;
                var haloSymbol = {},
                    symbol = g.getSymbol(),
                    srcSymbol;
                if (symbol) {
                    //use geometry's own symbol if it has.
                    if (!this._testSymbol(symbol)) {
                        throw new Error('markerFill and markerWidth are required in geometry\' symbol for HaloLayer, id : ' + g.getId());
                    }
                    srcSymbol = maptalks.Util.loadFunctionTypes(symbol, argFn);
                } else {
                    srcSymbol = this._symbol;
                }
                for (var p in srcSymbol) {
                    if (p[0] !== '_') {
                        haloSymbol[p] = srcSymbol[p];
                    }
                }
                var cacheKey;
                if (maptalks.Util.isGradient(haloSymbol['markerFill'])) {
                    cacheKey = maptalks.Util.getGradientStamp(haloSymbol['markerFill']);
                } else {
                    cacheKey = haloSymbol['markerFill'];
                }
                var point = map.coordinateToPoint(g.getCoordinates()),
                    size = haloSymbol['markerWidth'];
                haloSymbol = maptalks.symbolizer.VectorMarkerSymbolizer.translateLineAndFill(haloSymbol);
                if (!this._haloSymbols[cacheKey]) {
                    this._haloSymbols[cacheKey] = haloSymbol;
                }
                // g.setSymbol(haloSymbol);
                if (size > this._maxSize) {
                    this._maxSize = size;
                }
                halos.push({
                    'size' : size,
                    'symbol' : haloSymbol,
                    'point' : point,
                    'cacheKey' : cacheKey,
                    //time to start animation
                    'start' : this.layer.options['randomAnimation'] ? Math.random() * this.layer.options['animationDuration'] : 0,
                    'g' : g
                });

            }, this);
            this._prepareHaloCache();
            this._currentHalos = halos;
        },

        _prepareHaloCache: function () {
            var map =  this.getMap(),
                size = this._maxSize;
            this._haloCache = {};
            for (var p in this._haloSymbols) {
                if (this._haloSymbols.hasOwnProperty(p)) {
                    var canvas = maptalks.Canvas.createCanvas(size, size, map.CanvasClass),
                        ctx = canvas.getContext('2d');
                    var symbol = this._haloSymbols[p];
                    symbol['polygonGradientExtent'] = new maptalks.PointExtent(0, 0, size, size);
                    maptalks.Canvas.prepareCanvas(ctx, symbol);
                    maptalks.Canvas.ellipse(ctx, new maptalks.Point(size/2, size/2), size, size, 0, 1);
                    this._haloCache[p] = canvas;
                }
            }
        },

        //test if the symbol is valid for HaloLayer
        _testSymbol: function (symbol) {
            if (maptalks.Util.isNil(symbol['markerWidth']) || !symbol['markerFill']) {
                return false;
            }
            return true;
        },

        onZoomEnd: function () {
            this._prepareHalos();
            maptalks.renderer.Canvas.prototype.onZoomEnd.apply(this, arguments);
        },

        onRemove: function () {
            if (this._animId) {
                maptalks.Util.cancelAnimFrame(this._animId);
            }
            delete this._originSymbol;
            delete this._symbol;
            delete this._haloSymbols;
            delete this._haloCache;
            delete this._haloProperty;
            delete this._currentGeo;
            delete this._currentHalos;
            delete this._maxSize;
        }
    });

    maptalks.HaloLayer.registerRenderer('canvas', maptalks.renderer.halolayer.Canvas);

    if (nodeEnv) {
        exports = module.exports = maptalks.HaloLayer;
    }
})();
