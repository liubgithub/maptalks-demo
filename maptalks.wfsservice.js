(function () {
    "use strict";

	//用于WFS Service查询服务
	var WFSService = function (serverUrl,option) {
	    this.serverUrl = serverUrl || "";
	    var option = option || {};
	    this.map = option.map;
	    this.featureCollection = {};
	    this.callbacks = [];
	    this.loaded = false;
	    this.getdata(this.serverUrl);
	    var that = this;
        //根据属性查询
	    this.excuteForAttriute = function (options, callback) {
	        var conditions = [];
	        var wheres = options.where.split("&");
	        var layerName = options.layerName;
	        wheres.forEach(function (item) {
	            conditions.push(item.split("="));
	        });
	        var getResult = function (featureCollection) {
	            var _results = [];
	            var len = featureCollection.length;
	            for (var i = 0; i < len; i++) {
	                var fea = featureCollection[i];
	                for (var j = 0; j < conditions.length; j++) {
	                    var p = fea.attributes[conditions[j][0]];
	                    if (p != conditions[j][1])
	                        break;
	                    if (j == conditions.length - 1)
	                        _results.push(that._createGeometry(fea));
	                }
	            }
	            return _results;
	        }
	        if (that.loaded) {
	            callback(getResult(that.featureCollection[layerName]));
	        }
	        that.callbacks.push(function (featureCollection) {
	            var results = getResult(featureCollection[layerName]);
	            callback(results);
	        });
		}
        //根据控件关系查询
	    this.excuteForSpatialRelation = function (options, callback) {
		    var inputGeometry = options.input;
		    var relation = options.relationship;
		    var layerName = options.layerName;
		    var handler = function (featureCollection) {
		        switch (relation) {
		            //包含关系
		            case 'contain':
		                callback(that._contain(inputGeometry, featureCollection[layerName]));
		                break;
		            default:
		                break;
		        }
		    }
		    if (that.loaded) {
		        handler(that.featureCollection[layerName]);
		    }
		    else that.callbacks.push(handler);
		}

		this._contain = function (point, featureCollection) {
		    var results = [];
		    if (that.map) {
		        that.servicelayer = new maptalks.VectorLayer('wfslayer').addTo(map).hide();
		        for (var i = 0; i < featureCollection.length; i++) {
		            var polygon = new maptalks.Polygon(featureCollection[i].geometry.rings);
		            that.servicelayer.addGeometry(polygon);
		            if (polygon.containsPoint(point.getCoordinates())) {
		                polygon.attributes = featureCollection[i].attributes;
		                that.servicelayer.removeGeometry(polygon);
		                results.push(polygon);
		            }
		        }
		        that.map.removeLayer(that.servicelayer);
		        return results;
		    }
		    else {
		        console.log('需要传入地图对象进行空间关系的计算.')
		        return;
		    }
		}
		this._createGeometry=function(feature){
		    switch (feature.geometryType) {
		        case "esriGeometryPolygon":
		            var pg = new maptalks.Polygon(feature.geometry.rings);
		            pg.attributes = feature.attributes;
		            return pg;
		            break;
		        case "esriGeometryPolyline":
		            var pl = new maptalks.MultiLineString(feature.geometry.paths);
		            pl.attributes = feature.attributes;
		            return pl;
		            break;
		        case "esriGeometryPoint":
		            var p = new maptalks.Marker([feature.geometry.x, feature.geometry.y]);
		            p.attributes = feature.attributes;
		            return p;
		            break;
		        default:
		            break;
		    }
		}
	}

	var recomponentUrl = function (url) {
	    var strs = url.split("ArcGIS");
	    if (strs.length && strs.length == 2) {
	        var str = strs[0] + "ArcGIS/rest" + strs[1];
	        return str.replace("/WFSServer", "");
	    }
	}
	var _getData = function (url) {
	    url = recomponentUrl(url);
	    var reqUrl = url;
	    var proxyUrl = "../proxy/proxy.ashx";
	    var filter = "/query?objectIds=&where=1%3D1&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&gdbVersion=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&f=pjson";
	    var that = this;
	    maptalks.Ajax.post({ url: proxyUrl }, 'url=' + encodeURIComponent(reqUrl) + '&filter=' + encodeURIComponent('?f=pjson'), function (err, response) {
	        var flag = 0;
	        var me = that;
		    var res = maptalks.Util.parseJSON(response);
		    for (var i = 0; i < res.layers.length; i++) {
		        var _requestUrl = url + "/" + res.layers[i].id;
		        var name = res.layers[i].name;
		        maptalks.Ajax.post({
		            url: proxyUrl
		        }, 'url=' + encodeURIComponent(_requestUrl) + '&filter=' + encodeURIComponent(filter) + '&layerName=' + encodeURIComponent(name), function (err, data) {
		            var _data = data.split('_layerName_');
		            var layerName = _data[0];
		            data = _data[1];
		            var data = maptalks.Util.parseJSON(data);
		            if (!data.features.length) {
		                console.log('error');
		            }
		            console.log(data.features.length);
		            data.features.forEach(function (item) {
		                item.geometryType = data.geometryType;
		            });
		            //me.featureCollection = me.featureCollection.concat(data.featureCollection);
		            //me.featureCollection.push({ layerName: name, features: data.features });
		            me.featureCollection[layerName] = data.features;
		            flag++;
		            if (flag == res.layers.length) {
                        //指示数据已经全部加载完成
		                me.loaded = true;
                        //冒泡溢出，避免查询任务函数堆积
		                var cb = me.callbacks.pop();
		                while (!!cb) {
		                    cb(me.featureCollection);
		                    cb = me.callbacks.pop();
		                }
		            }
		        });
		    }
		});
	}

	WFSService.prototype.getdata = _getData;

	if (typeof module !== 'undefined' && module.exports) {
	    exports = module.exports = WFSService;
	}

	if (typeof window !== 'undefined') {
	    window['maptalks'] = window['maptalks'] || {};
	    window['maptalks']['WFSService'] = WFSService;
	}
})();