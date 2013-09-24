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
            this._layers.push(layer);
        }
    },

    _onMouseMove: function (e) {
        var snapfunc = L.GeometryUtil.closestLayerSnap,
            distance = this.options.distance,
            closest = snapfunc(this._map, this._layers, e.latlng, distance, false);

        if (closest) {
            if (!this._previous) {
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
        if (this._previous) {
            var closest = this._previous;
            this._map.fire('almost:' + e.type, {layer: closest.layer,
                                                latlng: closest.latlng});
        }
    },
});

L.Map.addInitHook('addHandler', 'almostOver', L.Handler.AlmostOver);
