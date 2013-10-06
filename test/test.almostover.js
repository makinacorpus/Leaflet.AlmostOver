var assert = chai.assert;


describe('L.Handler.AlmostOver', function() {

    it("should enable almostOver handler by default.", function(done) {
        var map = L.map('map');
        assert.isDefined(map.almostOver);
        assert.isTrue(map.almostOver.enabled());
        map.remove();
        done();
    });

    it("should be disabled if almostOver option is given false", function(done) {
        map = L.map('map', {almostOver: false});
        assert.isDefined(map.almostOver);
        assert.isFalse(map.almostOver.enabled());
        map.remove();
        done();
    });

});
