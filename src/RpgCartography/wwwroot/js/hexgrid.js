L.Control.HexGrid = L.Control.extend({

    includes: L.Mixin.Events,

    options: {
        position: 'topleft',
        mPerPixel: 1,
        rc: null,
        minX: 0,
        minY: 0,
        maxX: 5000,
        maxY: 3000,
        hexWidth: 60
    },

    initialize: function (options) {

        options = options || {};

        L.Util.setOptions(this, options);

        L.Control.prototype.initialize.call(this, this.options);

        //Precompute cosines and sines of angles used in hexagon creation
        // for performance gain
        var cosines = this._cosines = [];
        var sines = this._sines = [];

        for (var i = 0; i < 6; i++) {
            var angle = 2 * Math.PI / 6 * i;
            cosines.push(Math.cos(angle));
            sines.push(Math.sin(angle));
        }
    },

    onAdd: function (map) {
        
        this._map = map;
        this._hexLayer = L.geoJson();

        this._hexLayer.addTo(map);

        var container = this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-hexgrid');

        var stop = L.DomEvent.stopPropagation;

        L.DomEvent.on(this._container, 'mousedown', stop)
                  .on(this._container, 'touchstart', stop)
                  .on(this._container, 'dblclick', stop)
                  .on(this._container, 'mousewheel', stop)
                  .on(this._container, 'MozMozMousePixelScroll', stop);

        var toggleLink = this._toggleLink = L.DomUtil.create('a', 'hexGridLink', container);
        toggleLink.title = 'Show/hide HexGrid';

        L.DomEvent.on(this._toggleLink, 'click', this.toggle, this);

        var rangeForm = L.DomUtil.create('div', 'hexGridRangeDiv', container);

        var cellSizeSpan = L.DomUtil.create('span', '', rangeForm);
        cellSizeSpan.innerText = '1 hex = ';

        var rangeOutput = this._rangeOutput = L.DomUtil.create('output', 'hexGridRangeOutput', rangeForm);
        rangeOutput.innerText = this.options.hexWidth;

        var unitSpan = L.DomUtil.create('span', '', rangeForm);
        unitSpan.innerText = window.LoreMaps.UserPreferences.UseMetric ? ' kilometers' : ' miles';

        var rangeInput = this._rangeInput = L.DomUtil.create('input', 'hexGridRangeInput', rangeForm);
        rangeInput.type = 'range';
        rangeInput.value = this.options.hexWidth;
        rangeInput.min = 60;
        rangeInput.max = 320;
        rangeInput.step = 5;

        L.DomEvent
            .on(this._rangeInput, 'input', this.onRangeInput, this)
            .on(this._rangeInput, 'change', this.onRangeChange, this);

        L.DomEvent
            .on(map, 'zoomend', this.onZoomEnd, this)
            .on(map, 'dragend', this.onDragEnd, this);

        return container;
    },

    isVisible: function () {
        return L.DomUtil.hasClass(this._toggleLink, 'hexgrid-visible');
    },

    show: function () {
        if (!this.isVisible()) {
            L.DomUtil.addClass(this._toggleLink, 'hexgrid-visible');

            this._createxGrid();

            this.fire('show');
        }
    },

    hide: function (e) {
        if (this.isVisible()) {
            L.DomUtil.removeClass(this._toggleLink, 'hexgrid-visible');

            this._clearHexGrid();

            this.fire('hide');
        }
        if (e) {
            L.DomEvent.stopPropagation(e);
        }
    },

    toggle: function () {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    },

    onRangeChange: function () {
        var input = this._rangeInput;

        this.options.hexWidth = input.value;
        //console.log('new width ' + input.value);
        this.fire('hexResized', { newSize: input.value });

        this._clearHexGrid();
        this._createxGrid();
    },

    onRangeInput: function () {
        var input = this._rangeInput;
        var output = this._rangeOutput;
        output.value = input.value;
    },

    onDragEnd: function (e) {

        var self = this;

        if (this.isVisible()) {

            $(this._map).one('moveend', function () {
                self._clearHexGrid();
                self._createxGrid();
            });

        }
    },

    onZoomEnd: function (e) {

        if (this.isVisible()) {
            this._clearHexGrid();
            this._createxGrid();
        }

    },

    _clearHexGrid: function () {
        var map = this._map;
        var hexLayer = this._hexLayer;
        map.removeLayer(hexLayer);
    },
    
    _createxGrid: function () {
        var map = this._map;

        var rc = this.options.rc;

        var nw = rc.project(map.getBounds().getNorthWest());
        var se = rc.project(map.getBounds().getSouthEast());

        var minX = Math.max(nw.x, this.options.minX);
        var minY = Math.max(nw.y, this.options.minY);
        var maxX = Math.min(se.x, this.options.maxX);
        var maxY = Math.min(se.y, this.options.maxY);

        //var bbox = [nw.x, nw.y, se.x, se.y];
        var bbox = [minX, minY, maxX, maxY];

        var cellWidth = this.options.hexWidth;
        var units = window.LoreMaps.UserPreferences.UseMetric ? 'kilometers' : 'miles';

        var hexgrid = this.turfHexGrid(bbox, cellWidth, units);

        this._hexLayer = L.geoJson(hexgrid, {
            coordsToLatLng: function (coords) {
                return rc.unproject(coords);
            },
            style: function (feature) {
                return {
                    fill: false,
                    color: '#000',
                    weight: 1,
                    clickable: false
                };
            }
        });

        if (!map.hasLayer(this._hexLayer))
        {
            map.addLayer(this._hexLayer);
        }
        
    },

    turfHexGrid: function (bbox, cell, units) {

        var point = turf.point;
        var distance = this.distance;

        var xFraction = cell / (this.distance(point([bbox[0], bbox[1]]), point([bbox[2], bbox[1]]), units));
        var cellWidth = xFraction * (bbox[2] - bbox[0]);
        var yFraction = cell / (this.distance(point([bbox[0], bbox[1]]), point([bbox[0], bbox[3]]), units));
        var cellHeight = yFraction * (bbox[3] - bbox[1]);
        var radius = cellWidth / 2;

        var hex_width = radius * 2;
        var hex_height = Math.sqrt(3) / 2 * hex_width;

        var box_width = bbox[2] - bbox[0];
        var box_height = bbox[3] - bbox[1];

        var x_interval = 3 / 4 * hex_width;
        var y_interval = hex_height;

        var x_span = box_width / (hex_width - radius / 2);
        var x_count = Math.ceil(x_span);
        if (Math.round(x_span) === x_count) {
            x_count++;
        }

        var x_adjust = ((x_count * x_interval - radius / 2) - box_width) / 2 - radius / 2;

        var y_count = Math.ceil(box_height / hex_height);

        var y_adjust = (box_height - y_count * hex_height) / 2;

        var hasOffsetY = y_count * hex_height - box_height > hex_height / 2;
        if (hasOffsetY) {
            y_adjust -= hex_height / 4;
        }

        var fc = turf.featurecollection([]);
        for (var x = 0; x < x_count; x++) {
            for (var y = 0; y <= y_count; y++) {

                var isOdd = x % 2 === 1;
                if (y === 0 && isOdd) {
                    continue;
                }

                if (y === 0 && hasOffsetY) {
                    continue;
                }

                var center_x = x * x_interval + bbox[0] - x_adjust;
                var center_y = y * y_interval + bbox[1] + y_adjust;

                if (isOdd) {
                    center_y -= hex_height / 2;
                }
                fc.features.push(this.hexagon([center_x, center_y], radius));
            }
        }

        return fc;
    },

    //Center should be [x, y]
    hexagon: function (center, radius) {

        var cosines = this._cosines;
        var sines = this._sines;

        var vertices = [];
        for (var i = 0; i < 6; i++) {
            var x = center[0] + radius * cosines[i];
            var y = center[1] + radius * sines[i];
            vertices.push([x, y]);
        }
        //first and last vertex must be the same
        vertices.push(vertices[0]);
        return turf.polygon([vertices]);
    },

    distance: function (point1, point2, units) {

        var mPerPixel = this.options.mPerPixel;

        this.featureOf(point1, 'Point', 'distance');
        this.featureOf(point2, 'Point', 'distance');

        var coordinates1 = point1.geometry.coordinates;
        var coordinates2 = point2.geometry.coordinates;

        var dx = coordinates2[0] - coordinates1[0];
        var dy = coordinates2[1] - coordinates1[1];
        var pixelDistance = Math.sqrt(dx * dx + dy * dy);


        var distance;
        switch (units) {
            case 'miles':
                distance = pixelDistance * mPerPixel * 0.000621371;
                break;
            case 'kilometers':
                distance = pixelDistance * mPerPixel * 0.001;
                break;
                //case 'degrees':
                //    R = 57.2957795;
                //    break;
                //case 'radians':
                //    R = 1;
                //    break;
            case undefined:
                distance = pixelDistance;
                break;
            default:
                throw new Error('unknown option given to "units"');
        }

        return distance;
    },
    
    featureOf: function (value, type, name) {
        if (!name) throw new Error('.featureOf() requires a name');
        if (!value || value.type !== 'Feature' || !value.geometry) {
            throw new Error('Invalid input to ' + name + ', Feature with geometry required');
        }
        if (!value.geometry || value.geometry.type !== type) {
            throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + value.geometry.type);
        }
    }

});

L.control.hexGrid = function (options) {
    return new L.Control.HexGrid(options);
}
