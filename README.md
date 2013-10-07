Leaflet.AlmostOver
==================

This plugin allows to detect mouse click and overing events on lines,
with a tolerance distance.

It is useful if paths are drawn with a very small weight, or for clicks
detection on mobile devices, for which finger precision can be a problem.

Play with [online demo](http://makinacorpus.github.io/Leaflet.AlmostOver/).

It requires [Leaflet.GeometryUtil](https://github.com/makinacorpus/Leaflet.GeometryUtil/).


[![Build Status](https://travis-ci.org/makinacorpus/Leaflet.AlmostOver.png?branch=master)](https://travis-ci.org/makinacorpus/Leaflet.AlmostOver)


Usage
-----

```javascript

    var map = L.map('map');
    ...
    var lines = L.geoJson(...);
    ...
    map.almostOver.addLayer(lines);

    map.on('almost:over', function (e) {
        alert('Almost clicked !');
    });

```

### Events ###

Events triggered when mouse is almost over a layer :

* **almost:over** (latlng, layer)
* **almost:move** (latlng, layer)
* **almost:out** (layer)
* **almost:click** (latlng, layer)
* **almost:dblclick** (latlng, layer)


Authors
-------

[![Makina Corpus](http://depot.makina-corpus.org/public/logo.gif)](http://makinacorpus.com)
