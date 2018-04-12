var assert = chai.assert;

describe('L.Handler.AlmostOver', function() {

    describe('Activation', function() {

        it("should enable almostOver handler by default.", function(done) {
            var map = L.map('map');
            assert.isDefined(map.almostOver);
            assert.isTrue(map.almostOver.enabled());
            map.remove();
            done();
        });

        it("should be disabled if almostOver option is given false", function(done) {
            var map = L.map('map', {almostOver: false});
            assert.isDefined(map.almostOver);
            assert.isFalse(map.almostOver.enabled());
            map.remove();
            done();
        });

    });


    describe('Mouse move sampling', function() {

        var map,
            clock,
            period;

        before(function () {
            clock = sinon.useFakeTimers();
        });

        beforeEach(function() {
            map = L.map('map').fitWorld();
            period = map.options.almostSamplingPeriod;
        });

        afterEach(function() {
            map.remove();
        });

        after(function () {
            clock.restore();
        });


        it("should not trigger mousesample if no layer added", function(done) {
            var callback = sinon.spy();
            map.on('mousemovesample', callback);
            map.fire('mousemove');
            assert.isFalse(callback.called);
            done();
        });

        it("should trigger mousesample once a layer is added", function(done) {
            map.almostOver.addLayer(L.marker([1, 1]));
            var callback = sinon.spy();
            map.on('mousemovesample', callback);

            clock.tick(period+1);
            map.fire('mousemove', {latlng: [0, 0]});

            assert.isTrue(callback.called);
            done();
        });

        it("should filter events with high frequency", function(done) {
            map.almostOver.addLayer(L.marker([1, 1]));
            var callback = sinon.spy();
            map.on('mousemovesample', callback);

            clock.tick(period+1);
            map.fire('mousemove', {latlng: [0, 0]});

            clock.tick(period-1);  // wait less than period
            map.fire('mousemove', {latlng: [0, 0]});
            map.fire('mousemove', {latlng: [0, 0]});

            assert.isTrue(callback.calledOnce);
            done();
        });

        it("should trigger mousesample only for defined period", function(done) {
            map.almostOver.addLayer(L.marker([1, 1]));
            var callback = sinon.spy();
            map.on('mousemovesample', callback);

            clock.tick(period+1);
            map.fire('mousemove', {latlng: [0, 0]});
            map.fire('mousemove', {latlng: [0, 0]});
            clock.tick(period+1);
            map.fire('mousemove', {latlng: [0, 0]});
            map.fire('mousemove', {latlng: [0, 0]});
            clock.tick(period+1);
            map.fire('mousemove', {latlng: [0, 0]});
            map.fire('mousemove', {latlng: [0, 0]});

            assert.equal(3, callback.callCount);
            done();
        });

    });


    describe('Almost over events', function() {
        var map;

        beforeEach(function() {
            map = L.map('map').fitWorld();
            var line = L.polyline([[0, 0], [0, 10]]).addTo(map);
            map.almostOver.addLayer(line);
        });

        afterEach(function() {
            map.remove();
        });

        it("should not trigger almost:over if too far", function(done) {
            var callback = sinon.spy();
            map.on('almost:over', callback);
            map.fire('mousemovesample', {latlng: [34, 0]});
            assert.isFalse(callback.called);
            done();
        });

        it("should trigger almost:over if close enough", function(done) {
            var callback = sinon.spy();
            map.on('almost:over', callback);
            map.fire('mousemovesample', {latlng: [33, 0]});
            assert.isTrue(callback.called);
            done();
        });

        it("should trigger almost clicks if close enough", function(done) {
            var click = sinon.spy(),
                dblclick = sinon.spy();
            map.on('almost:click', click);
            map.on('almost:dblclick', dblclick);
            map.fire('click', {latlng: [10, 0]});
            map.fire('dblclick', {latlng: [10, 0], containerPoint: [0, 0], originalEvent: { shiftKey: false } });
            assert.isTrue(click.called);
            assert.isTrue(dblclick.called);
            done();
        });

        it("should trigger almost:over once, and many almost:move", function(done) {
            var over = sinon.spy(),
                move = sinon.spy(),
                out = sinon.spy();
            map.on('almost:over', over);
            map.on('almost:move', move);
            map.on('almost:out', out);
            map.fire('mousemovesample', {latlng: [10, 0]});
            map.fire('mousemovesample', {latlng: [10.1, 0]});
            map.fire('mousemovesample', {latlng: [10.1, 0]});
            map.fire('mousemovesample', {latlng: [10.3, 0]});
            map.fire('mousemovesample', {latlng: [50, 0]});
            assert.isTrue(over.calledOnce);
            assert.equal(4, move.callCount);
            assert.isTrue(out.calledOnce);
            done();
        });

        it("should not trigger almost:out if no almost:move", function(done) {
            var out = sinon.spy();
            map.on('almost:out', out);
            map.fire('mousemovesample', {latlng: [50, 0]});
            assert.isFalse(out.calledOnce);

            map.fire('mousemovesample', {latlng: [10, 0]});
            map.fire('mousemovesample', {latlng: [50, 0]});
            assert.isTrue(out.calledOnce);
            done();
        });

        it("should trigger almost:out when jump from a layer to another", function(done) {
            var otherline = L.polyline([[0, 0], [10, 0]]).addTo(map);
            map.almostOver.addLayer(otherline);

            var over = sinon.spy(),
                out = sinon.spy();
            map.on('almost:over', over);
            map.on('almost:out', out);

            map.fire('mousemovesample', {latlng: [0, 10]});
            map.fire('mousemovesample', {latlng: [10, 0]});

            assert.isTrue(out.calledOnce);
            var outlayer = out.getCall(0).args[0].layer,
                overlayer = over.getCall(1).args[0].layer;

            assert.notEqual(outlayer, otherline);
            assert.equal(overlayer, otherline);
            done();
        });
    });

    describe('mousemove events can be disabled', function() {
        var map;

        beforeEach(function() {
            map = L.map('map', {
              almostOnMouseMove: false,
            }).fitWorld();
            var line = L.polyline([[0, 0], [0, 10]]).addTo(map);
            map.almostOver.addLayer(line);
        });

        afterEach(function() {
            map.remove();
        });

        it("should not trigger almost:over, even if close enough", function(done) {
            var callback = sinon.spy();
            map.on('almost:over', callback);
            map.fire('mousemovesample', {latlng: [33, 0]});
            assert.isFalse(callback.called);
            done();
        });

        it("should not trigger almost:over, almost:move, even if close enough ", function(done) {
            var over = sinon.spy(),
                move = sinon.spy(),
                out = sinon.spy();
            map.on('almost:over', over);
            map.on('almost:move', move);
            map.on('almost:out', out);
            map.fire('mousemovesample', {latlng: [10, 0]});
            assert.isFalse(over.called);
            assert.isFalse(move.called);
            assert.isFalse(out.called);
            done();
        });

        it("should trigger almost clicks if close enough", function(done) {
            var click = sinon.spy(),
                dblclick = sinon.spy();
            map.on('almost:click', click);
            map.on('almost:dblclick', dblclick);
            map.fire('click', {latlng: [10, 0]});
            map.fire('dblclick', {latlng: [10, 0], containerPoint: [0, 0], originalEvent: { shiftKey: false } });
            assert.isTrue(click.called);
            assert.isTrue(dblclick.called);
            done();
        });

    });
});
