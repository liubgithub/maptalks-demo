(function () {
    "use strict";
     var flag = 0;
     var getData=function (url) {
        var reqUrl = url;
        var proxyUrl = "../proxy/proxy.ashx";
        var filter = "/query?objectIds=&where=1%3D1&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&gdbVersion=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&f=pjson";
        var that = this;
        maptalks.Ajax.post({ url: proxyUrl }, 'url=' + encodeURIComponent(reqUrl) + '&filter=' + encodeURIComponent('?f=pjson'), function (err, response) {
            if (err) return;
            var flag = 0;
            var res = maptalks.Util.parseJSON(response);
            for (var i = 0; i < res.layers.length; i++) {
                var fserverUrl = url + "/" + res.layers[i].id;
                var name = res.layers[i].name;
                if (that.layerName == name) {
                    that._addLayers(name, fserverUrl);
                    that.loaded = true;
                    break;
                }
                else if (that.layerName != name) {
                    that._addLayers(name, fserverUrl);
                }
                if (i == res.layers.length - 1)
                    that.loaded = true;
            }
        });
     };

    //将图层添加到地图中去
     var _addLayers = function (name,fserverUrl) {
         var flayer = new maptalks.FeatureLayer(name, fserverUrl);
         this.LayerCollection.push(flayer);
         if (this.map)
             flayer.addTo(this.map);
     }
     var GroupLayer = function (id,serverUrl, option) {
         this.serverUrl = serverUrl || "";
         this.id = id;
         var option = option || {};
         this.layerName = option.layerName;
         this.loaded = false;
         this.LayerCollection = [];
         this.getData = getData;
         this._addLayers = _addLayers;
         this.getData(this.serverUrl);
     };
     GroupLayer.prototype.addTo = function (map) {
         //图层未加载完成
         if(!this.loaded)
             this.map = map;
        //图层加载完成
         else if (this.loaded) {
             for (var i = 0; i < this.LayerCollection.length; i++) {
                 this.LayerCollection[i].addTo(map);
             }
         }
    };

    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = GroupLayer;
    }

    if (typeof window !== 'undefined') {
        window['maptalks'] = window['maptalks'] || {};
        window['maptalks']['GroupLayer'] = GroupLayer;
    }
})();