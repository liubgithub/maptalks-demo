(function () {
    'use strict';
    var maptalks;
    var nodeEvn = typeof module !== 'undefined' && module.exports;
    if (nodeEvn) {
        maptalks = require('maptalks');
    } else {
        maptalks = window.maptalks;
    }

    maptalks.CanvasLayer = maptalks.Layer.extend({
        options:{},
        initialize: function (id,options) {
            this.setId(id);
            maptalks.Util.setOptions(this, options);
            this.drawCanvas = null;
            this.Draw = function (draw) {
                this.drawCanvas = draw;
            }
        }
    });

   
    var render = maptalks.renderer.Canvas.extend({
        initialize: function (layer) {
            this.layer = layer;
        },
        draw: function () {
            this.prepareCanvas();
            this.layer.drawCanvas.apply(this, arguments);
            this.completeRender();
        }
    });
    maptalks.CanvasLayer.registerRenderer('canvas', render);
})();