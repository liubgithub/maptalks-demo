(function () {
    'use strict';

    var maptalks;

    var nodeEnv = typeof module !== 'undefined' && module.exports;
    if (nodeEnv)  {
        maptalks = require('maptalks');
    } else {
        maptalks = window.maptalks;
    }

    maptalks.RoutePlayer = maptalks.Class.extend({
        includes : maptalks.Eventable,

        options: {
            'unitTime' : 1 * 1000,
            'showRoutes' : true,
            'markerSymbol' : null,
            'lineSymbol' : {
                'lineWidth' : 5,
                'lineColor' : '#004A8D'
            }
        },

        initialize: function (routes, map ,opts) {
            if (!maptalks.Util.isArray(routes)) {
                routes = [routes];
            }
            this.id = maptalks.Util.GUID();
            this._map = map;
            maptalks.Util.setOptions(this, opts);
            this._setup(routes);
        },

        remove: function () {
            this.markerLayer.remove();
            this.lineLayer.remove();
            delete this._map;
        },

        play: function () {
            this.player.play();
            this.fire('playstart');
            return this;
        },

        pause: function () {
            this.player.pause();
            this.fire('playpause');
            return this;
        },

        cancel: function () {
            this.player.cancel();
            this.played = 0;
            this._createPlayer();
            this._step({'styles':{'t':0}});
            this.fire('playcancel');
            return this;
        },

        finish: function () {
            this.player.finish();
            this._step({'styles':{'t':1}});
            this.fire('playfinish');
            return this;
        },

        getCurrentTime: function () {
            if (!this.played) {
                return this.startTime;
            }
            return this.startTime + this.played;
        },

        setTime: function (t) {
            this.played = t - this.startTime;
            if (this.played < 0) {
                this.played = 0;
            }
            this._resetPlayer();
            return this;
        },

        getUnitTime: function () {
            return this.options['unitTime'];
        },

        setUnitTime: function (ut) {
            this.options['unitTime'] = +ut;
            this._resetPlayer();
        },

        getCurrentCoordinates: function (index) {
            if (!index) {
                index = 0;
            }
            if (!this.routes[index] || !this.routes[index]._painter) {
                return null;
            }
            return this.routes[index]._painter.marker.getCoordinates();
        },

        _resetPlayer: function () {
            var playing = this.player && this.player.playState === 'running';
            if (playing) {
                this.player.finish();
            }
            this._createPlayer();
            if (playing) {
                this.player.play();
            }
        },

        _step: function (frame) {
            this.played = this.duration * frame.styles.t;
            for (var i = 0, l = this.routes.length; i < l; i++) {
                this._drawRoute(this.routes[i], this.startTime + this.played);
            }
            this.fire('playing');
        },

        _drawRoute: function (route, t) {
            var coordinates = route.getCoordinates(t, this._map);
            if (!coordinates) {
                return;
            }
            if (!route._painter) {
                route._painter = {};
                var marker = new maptalks.Marker(coordinates.coordinate, {
                    symbol : route.markerSymbol || this.options['markerSymbol']
                }).addTo(this.markerLayer);
                var line = new maptalks.LineString(route.path, {
                    symbol : route.lineSymbol || this.options['lineSymbol']
                }).addTo(this.lineLayer);
                route._painter.marker = marker;
                route._painter.line = line;
            } else {
                route._painter.marker.setCoordinates(coordinates.coordinate);
            }
        },

        _setup: function (rs) {
            var routes = [new Route(rs[0])],
                start = routes[0].getStart(),
                end = routes[0].getEnd();
            for (var i = 1; i < rs.length; i++) {
                var route = new Route(rs[i]);
                if (route.getStart() < start) {
                    start = route.getStart();
                }
                if (route.getEnd() > end) {
                    end = route.getEnd();
                }
            }
            this.routes = routes;
            this.startTime = start;
            this.endTime = end;
            this.played = 0;
            this.duration = end - start;
            this._createLayers();
            this._createPlayer();
        },

        _createPlayer: function () {
            var duration = (this.duration - this.played) / this.options['unitTime'];
            this.player = maptalks.Animation.animate({'t' : [this.played / this.duration, 1]}, {'speed' : duration, 'easing' : 'linear'}, maptalks.Util.bind(this._step, this));
        },

        _createLayers: function () {
            this.lineLayer = new maptalks.VectorLayer(maptalks.internalLayerPrefix + '_routeplay_r_' + this.id).addTo(this._map);
            this.markerLayer = new maptalks.VectorLayer(maptalks.internalLayerPrefix + '_routeplay_m_' + this.id).addTo(this._map);
        }
    });

    function Route(r) {
        this.route = r;
        this.path = r.path;
    }

    maptalks.Util.extend(Route.prototype, {
        getCoordinates: function (t, map) {
            if (t < this.getStart() || t > this.getEnd()) {
                return null;
            }
            var preLen = 0, len = 0,
                idx = null;
            for (var i = 0, l = this.path.length; i < l; i++) {
                if (t < this.path[i][2]) {
                    idx = i;
                    break;
                }
            }
            if (idx === null) {
                idx = this.path.length - 1;
            }
            var p1 = this.path[idx - 1], p2 = this.path[idx],
                span = t - p1[2],
                r = span / (p2[2] - p1[2]);
            var x = p1[0] + (p2[0] - p1[0]) * r,
                y = p1[1] + (p2[1] - p1[1]) * r,
                coord = new maptalks.Coordinate(x, y),
                vp = map.coordinateToViewPoint(coord);
            var degree = maptalks.Util.computeDegree(map.coordinateToViewPoint(new maptalks.Coordinate(p1)), vp);
            return {
                'coordinate' : coord,
                'viewPoint' : vp,
                'degree' : degree,
                'index' : idx
            };
        },

        getStart: function () {
            return this.path[0][2];
        },

        getEnd: function () {
            return this.path[this.getCount() - 1][2];
        },

        getCount: function () {
            return this.path.length;
        }
    });


    if (nodeEnv) {
        exports = module.exports = maptalks.RoutePlayer;
    }
})();
