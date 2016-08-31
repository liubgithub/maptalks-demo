(function () {
    'use strict';
    var maptalks;
    var nodeEvn = typeof module !== 'undefined' && module.exports;
    if (nodeEvn) {
        maptalks = require('maptalks');
    } else {
        maptalks = window.maptalks;
    }

    maptalks.FeatureLayer = maptalks.VectorLayer.extend({
        breakClassRender: false,
        selected:false,
        initialize: function (id, url, options) {
            var _options=options||{};
            this.setId(id);
            this.breakClassRender = this.breakClassRender || _options.breakClassRender;
            this.selected = this.selected || _options.selected;
            this.query = this.query || _options.query;
            this.displayField = this.displayField || _options.displayField;
            this.outputLayerName = this.outputLayerName || _options.layerName;
            maptalks.Util.setOptions(this, options);
            this.layerCollection={};
            this._postDataFrom(url);
        },
        
        addGeometry: function (geometries) {
            for (var i = 0, len = geometries.length; i <= len; i++) {
                if (!geometries[i] instanceof maptalks.Geometry) {
                    throw new Error('Only a geometry can be added into a Layer');
                }
            }
            if (this.breakClassRender == true) {
                this._breakRenderLayer(this.breakClasses, geometries);
            }
            this.fire('loadend', { geometries: geometries });
            return maptalks.VectorLayer.prototype.addGeometry.apply(this, arguments);
        },
        setRenderProperty:function(attri){
            this.renderAtrribute = attri;
            this.breakClassRender = true;
        },
        setBreakRender: function (breakRender) {
            this.breakClasses = this.breakClasses || [];
            if (!breakRender.length) {
                this.breakClasses.push(breakRender)
            }
            else if (breakRender instanceof Array) {
                this.breakClasses = this.breakClasses.concat(breakRender);
            }
        },

        _breakRenderLayer:function(breakclasses,geometries){
            if (!breakclasses) {
                throw new Error("you need set render field and set rendered classes!");
                return;
            };
            if (!breakclasses.length) {
                this.setBreakRender(breakclasses);
                return;
            }
            if (!this.layerData) {
                throw new Error('layer data not exist!');
                return;
            }
            if (breakclasses instanceof Array) {
                var flen = geometries.length;
                var that = this;
                for (var j = 0; j < flen; j++) {
                    var fea = this.layerData.features[j];
                    //供测试用的属性
                    fea.attributes[this.renderAtrribute] = 100000 * Math.random();
                }
                breakclasses.forEach(function (breakclass) {
                    for (var i = 0; i < flen; i++) {
                        var fea = that.layerData.features[i];
                        //供测试用的属性
                        var geo = that._getGeometry(geometries, fea.attributes.OBJECTID);
                        var _attri = parseInt(fea.attributes[that.renderAtrribute]);
                        if (_attri >= breakclass.minValue && _attri < breakclass.maxValue) {
                            //对对象设置符号
                            geo.setSymbol(breakclass.renderSymbol);
                        }
                    }
                });
            }
        },
  
        _getGeometry:function(geometries,id){
            if(!geometries.length) return;
            for(var i=0;i<geometries.length;i++){
                if (geometries[i].getId() === id) {
                    return geometries[i];
                    break;
                }
            }
        },
        _postDataFrom: function (url) {
            var _url = url;
            this.dataUrl = url;
            var that = this;
            var filter = "/query?objectIds=&where=1%3D1&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&gdbVersion=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&f=pjson";
            //跨域代理
            var proxyUrl = "../proxy/proxy.ashx";
            var requestUrl = proxyUrl;
            maptalks.Ajax.post({ url: requestUrl }, 'url=' + encodeURIComponent(_url) + '&filter=' + encodeURIComponent(filter), function (err, response) {
                if (err) return;
                var data = maptalks.Util.parseJSON(response);
                console.log(data.features.length);
                maptalks.Ajax.post({
                    url: requestUrl
                }, 'url=' + encodeURIComponent(_url) + '&filter=' + encodeURIComponent('?f=pjson'), function (err, res) {
                    var lInfo = maptalks.Util.parseJSON(res);
                    var layerData = { data: data, info: lInfo };
                    var geometries = that._addData(layerData);
                    that.addGeometry(geometries);
                });
            })
        },
 

        _addData: function (layerData) {
            var geodata = null;
            if (!(layerData instanceof Object))
                return;
            if (!layerData.info.geometryType) {
                throw new Error("The layer's geometry type is unknown");
                return;
            }
            switch (layerData.info.geometryType) {
                case "esriGeometryPoint":
                    geodata = this._processMarkers(layerData);
                    break;
                case "esriGeometryPolygon":
                    geodata = this._processPolygons(layerData);
                   break;
                case "esriGeometryPolyline":
                    geodata = this._processPolylines(layerData);
                    break;
                default:
                    break;
            }
            return geodata; 
        },
        _processMarkers: function (layerData) {
            this.layerData = layerData.data;
            var features = layerData.data.features;
            var _markers = [];
            var len = features.length;
            console.log(len);
            for (var i = 0; i < len; i++) {
                var feature = features[i];
                var _symbol;
                if (feature.attributes.PSNAME) {
                    _symbol = this._getPicMarkerSymbol(feature.attributes.PSNAME, layerData.info.drawingInfo.renderer.uniqueValueInfos);
                    if (!_symbol) continue;
                }
                else
                    _symbol = this._parseEsriSymbol(layerData.info.drawingInfo.renderer.symbol || layerData.info.drawingInfo.renderer.defaultSymbol);
                var marker = new maptalks.Marker([feature.geometry.x, feature.geometry.y], {
                    symbol: _symbol
                });
                if (this.query == true) {
                    this._setInfoWindow(marker, feature.attributes);
                }
                marker.attributes = feature.attributes;
                marker.setId(feature.attributes.OBJECTID);
                _markers.push(marker);
            }
            return _markers;
        },
        //准备进行分级渲染操作
        _startBreakRenderLayer:function(){
            if (!!this.layerData && this._examField(this.layerData.fields, this.renderAtrribute)) {
                this._breakRenderLayer(this.breakClassRender);
            }
            else {
                throw new Error("attribute you set not exist in featurelayer's fields");
            }
        },
        _processPolygons: function (layerData) {
            this.layerData = layerData.data;
            var features = layerData.data.features;
            var _symbol = this._parseEsriSymbol(layerData.info.drawingInfo.renderer.symbol);
            var polygons = [];
            var len=features.length;
            for(var i=0;i<len;i++){
                var feature = features[i];
                var polygon = new maptalks.Polygon(feature.geometry.rings, {
                    symbol:_symbol
                });
                polygon.attributes = feature.attributes;
                //鼠标在要素上移动时改变polygon透明度
                if (this.selected == true) {
                    var oldopacity = 0;
                    polygon.on('mouseover', function (g) {
                        var _target = g.target;
                        var currentopacity = _target.getSymbol().polygonOpacity;
                        oldopacity = (oldopacity < currentopacity && oldopacity != 0) ? oldopacity : currentopacity;
                        var newopacity = (currentopacity + 0.2<= 1) ? currentopacity+0.2 : 1;
                        var _symbol = _target.getSymbol();
                        _target.updateSymbol({ polygonOpacity: newopacity });
                        _target.on('mouseout', function (_g) {
                            var _target_ = _g.target;
                            _target_.updateSymbol({ polygonOpacity: oldopacity });
                        });
                    });
                }
                if (this.query == true) {
                    this._setInfoWindow(polygon);
                }
                polygon.setId(feature.attributes.OBJECTID);
                polygons.push(polygon);
            }
            return polygons;
        },
        _processPolylines: function (layerData) {
            this.layerData = layerData.data;
            var features = layerData.data.features;
            var polylines = [];
            if(features)
            var len = features.length;
            for (var i = 0; i < len; i++) {
                var feature = features[i];
                var paths = feature.geometry.paths;
                var polyline = new maptalks.MultiLineString(paths);
                if (this.query == true) {
                    this._setInfoWindow(polyline, feature.attributes);
                }
                polyline.attributes = feature.attributes;
                polyline.setId(feature.attributes.OBJECTID);
                polylines.push(polyline);
            }
            return polylines;
        },
        //检查字段
        _examField: function (data, attri) {
            if (data instanceof Array&&attri) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].name== attri) {
                        return true;
                        break;
                    }
                }
                return false;
            }
            else {
                throw new Error("attribute you set not in featurelayer's fields");
                if (this.addGeometry) {

                }
                return false;
            }
        },
        //解析请求信息中所包含的符号信息
        _parseEsriSymbol: function (symbol) {
            var sym;
            if (!symbol) return;
            if (symbol.type == "esriSMS") {
                sym = {
                    'markerType':'ellipse',
                    'markerLineColor': 'rgb(' + symbol.outline.color[0] + ',' + symbol.outline.color[1]+',' +symbol.outline.color[2] + ')',
                    'lineWidth': symbol.outline.width,
                    'markerLineOpacity': 1,
                    'markerFill': 'rgb(' + symbol.color[0] + ',' + symbol.color[1] +','+symbol.color[2] +')',
                    'markerFillOpacity': 1,
                    'markerWidth': symbol.size+1,
                    'markerHeight': symbol.size+1
                }
                return sym;
            }
            else if (symbol.type == "esriSFS") {
                var pfill = symbol.color ? 'rgb(' + symbol.color[0] + ',' + symbol.color[1] + ',' + symbol.color[2] + ')' : "#ffffff";
                var pOpacity = symbol.color ? 0.8 : 0;
                sym = {
                    'lineColor': 'rgb('+symbol.outline.color[0]+','+symbol.outline.color[1]+','+symbol.outline.color[2]+')',
                    'lineWidth': symbol.outline.width,
                    'lineOpacity': 1,
                    'polygonFill':pfill,
                    'polygonOpacity': pOpacity
                }
                return sym;
            }
        },
        //根据arcgis发布的maeker符号来找出对应的符号表达方式
        _getPicMarkerSymbol: function (name, uniqueValueInfos) {
            if (name&&uniqueValueInfos) {
                var len = uniqueValueInfos.length;
                for (var i = 0; i < len; i++) {
                    var uniqueValue = uniqueValueInfos[i];
                    if (uniqueValue.value == name) {
                        return {
                            'markerFile': this.dataUrl + "/images/" + uniqueValue.symbol.url,
                            'markerWidth': uniqueValue.symbol.width,
                            'markerHeight': uniqueValue.symbol.height,
                        };
                        break;
                    }
                }
            }
        },
        _setInfoWindow: function (geo) {
            var attri = geo.attributes;
            var content = '<table class="infoWin" cellspacing="5" id="infoWin">';
            for (var p in attri) {
                content += '<tr><td>' + p + '</td><td>：' + attri[p] + '</td></tr>';
            }
            content += '</table>';
            var options = {
                'title': '属性信息',
                'content': content
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var _infoWin = infoWindow.addTo(geo);
            geo.on('click', function (e) {
                !_infoWin.isVisible() ? _infoWin.show(e.target.getCenter()) : _infoWin.hide();
            });
        },
        _addLabel: function (geos) {
            var labels = [];
            geos.forEach(function (geo) {
                if (geo.label)
                    labels.push(geo.label);
            });
            return labels;
        },
        //根据图层名称获取图层索引
        _getLayerIndex: function (name,layers) {
            for (var i = 0; i < layers.length; i++) {
                if (name == layers[i].name) {
                    return layers[i].id;
                    break;
                }
            }
        }
    });
    maptalks.FeatureLayer.registerRenderer('canvas', maptalks.renderer.vectorlayer.Canvas);
})();