L.Map.mergeOptions({
    almostOver: true
});


L.Handler.AlmostOver = L.Handler.extend({

    includes: L.Mixin.Events,

    options: {
        distance: 25,   // pixels
        samplingPeriod: 50,  // ms
    },

    initialize: function (map) {
        this._map = map;
        this._layers = [];
        this._previous = null;
        this._marker = null;
        this._buffer = 0;

        // Reduce 'mousemove' event frequency
        this.__mouseMoveSampling = (function () {
            var timer = new Date();
            return function (e) {
                var date = new Date(),
                    filtered = (date - timer) < this.options.samplingPeriod;
                if (filtered || this._layers.length === 0) {
                    return;  // Ignore movement
                }
                timer = date;
                this._map.fire('mousemovesample', {latlng: e.latlng});
            };
        })();
    },

    addHooks: function () {
        this._map.on('mousemove', this.__mouseMoveSampling, this);
        this._map.on('mousemovesample', this._onMouseMove, this);
        this._map.on('click dblclick', this._onMouseClick, this);

        var map = this._map;
        function computeBuffer() {
            this._buffer = this._map.layerPointToLatLng([0, 0]).lat -
                           this._map.layerPointToLatLng([this.options.distance,
                                                         this.options.distance]).lat;
        }
        this._map.on('viewreset zoomend', computeBuffer, this);
        this._map.whenReady(computeBuffer, this);
    },

    removeHooks: function () {
        this._map.off('mousemovesample');
        this._map.off('mousemove', this.__mouseMoveSampling, this);
        this._map.off('click dblclick', this._onMouseClick, this);
    },

    addLayer: function (layer) {
        if (typeof layer.eachLayer == 'function') {
            layer.eachLayer(function (l) {
                this.addLayer(l);
            }, this);
        }
        else {
            if (typeof this.indexLayer == 'function') {
                this.indexLayer(layer);
            }
            this._layers.push(layer);
        }
    },

    removeLayer: function (layer) {
        if (typeof layer.eachLayer == 'function') {
            layer.eachLayer(function (l) {
                this.removeLayer(l);
            }, this);
        }
        else {
            if (typeof this.unindexLayer == 'function') {
                this.unindexLayer(layer);
            }
            var index = this._layers.indexOf(layer);
            this._layers.splice(index, 1);
        }
    },

    getClosest: function (latlng) {
        var snapfunc = L.GeometryUtil.closestLayerSnap,
            distance = this.options.distance;

        var snaplist = [];
        if (typeof this.searchBuffer == 'function') {
            snaplist = this.searchBuffer(latlng, this._buffer);
        }
        else {
            snaplist = this._layers;
        }
        return snapfunc(this._map, snaplist, latlng, distance, false);
    },

    _onMouseMove: function (e) {
        var closest = this.getClosest(e.latlng);
        if (closest) {
            if (!this._previous) {
                this._map.fire('almost:over', {layer: closest.layer,
                                               latlng: closest.latlng});
            }
            else if (L.stamp(this._previous.layer) != L.stamp(closest.layer)) {
                this._map.fire('almost:out', {layer: this._previous.layer});
                this._map.fire('almost:over', {layer: closest.layer,
                                               latlng: closest.latlng});
            }

            this._map.fire('almost:move', {layer: closest.layer,
                                           latlng: closest.latlng});
        }
        else {
            if (this._previous) {
                this._map.fire('almost:out', {layer: this._previous.layer});
            }
        }
        this._previous = closest;
    },

    _onMouseClick: function (e) {
        var closest = this.getClosest(e.latlng);
        if (closest) {
            this._map.fire('almost:' + e.type, {layer: closest.layer,
                                                latlng: closest.latlng});
        }
    },
});

if (L.LayerIndexMixin !== undefined) {
    L.Handler.AlmostOver.include(L.LayerIndexMixin);
}

L.Map.addInitHook('addHandler', 'almostOver', L.Handler.AlmostOver);
