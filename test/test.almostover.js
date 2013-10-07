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
            period = map.almostOver.options.samplingPeriod;
        });

        afterEach(function() {
            map.remove();
        });

        after(function () {
            clock.restore();
        });


        it("should not trigger mousesample if no layer added", function(done) {
            callback = sinon.spy();
            map.on('mousemovesample', callback);
            map.fire('mousemove');
            assert.isFalse(callback.called);
            done();
        });

        it("should trigger mousesample once a layer is added", function(done) {
            map.almostOver.addLayer(L.marker([1, 1]));
            callback = sinon.spy();
            map.on('mousemovesample', callback);

            clock.tick(period+1);
            map.fire('mousemove', {latlng: [0, 0]});

            assert.isTrue(callback.called);
            done();
        });

        it("should filter events with high frequency", function(done) {
            map.almostOver.addLayer(L.marker([1, 1]));
            callback = sinon.spy();
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
            callback = sinon.spy();
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
});
