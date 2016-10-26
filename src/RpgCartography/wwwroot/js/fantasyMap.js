/** 
    @description Creates the whole FantasyMap app.
 */
var FantasyMap = {

    options: {

        map: {
            minZoom: 0,
            maxZoom: 5
        },

        image: {
            width: 4763,
            height: 3185,
            TilesUrl: '@Url.Content("~/images/maps/FaerunTiles")',
            meterPerPixel: 1287.473,
            attribution: ''
        },

        data: {
            '@Url.Content("~/data/Faerun/Ports.json")': 'Ports',
            '@Url.Content("~/data/Faerun/Cities.json")': 'Cities',
            '@Url.Content("~/data/Faerun/PortCapitals.json")': 'Port/Capitals',
            '@Url.Content("~/data/Faerun/Capitals.json")': 'Capitals',
            '@Url.Content("~/data/Faerun/Temples.json")': 'Temples',
            '@Url.Content("~/data/Faerun/Sites.json")': 'Sites',
            '@Url.Content("~/data/Faerun/Fortresses.json")': 'Fortresses',
            '@Url.Content("~/data/Faerun/Ruins.json")': 'Ruins'
        },

        wiki: {
            url: 'http://en.wikipedia.org',
            apiUrl: 'http://forgottenrealms.wikia.com',
            attribution: '',
            wikiParseMarkup: function (markup) {
                var blurb = $('<div></div>').html(markup);

                // remove links as they will not work
                blurb.find('a').each(function () { $(this).replaceWith($(this).html()); });

                //rewrite relative image links
                var isExternalRegEx = new RegExp('^(?:[a-z]+:)?//', 'i');

                blurb.find('img').not('[src^="http"],[src^="https"]').each(function() {
                    $(this).attr('src', function (index, value) {
                        if (!isExternalRegEx.test(value)) {
                            return FantasyMap.options.wiki.url + value;
                        }
                    })
                });

                // remove any references
                blurb.find('sup').remove();

                // remove cite error
                blurb.find('.mw-ext-cite-error').remove();

                // remove edit links
                blurb.find('.mw-editsection').remove();

                return blurb;
            }
        }

    },

    initialize: function (options) {

        // override the options
        window.jQuery.extend(FantasyMap.options, options);

        var map = this._map = L.map('map', {
            minZoom: this.options.map.minZoom,
            maxZoom: this.options.map.maxZoom,
            zoomControl: false
        });

        // assign map and image dimensions
        var rc = this._rc = new L.RasterCoords(map, [this.options.image.width, this.options.image.height]);

        // set the bounds on map
        rc.setMaxBounds();

        // get the bounds
        var mapBounds = rc.getBounds();

        // set map to view whole world
        map.fitBounds(mapBounds);

        // the tile layer containing the image generated with gdal2tiles --leaflet ...
        L.tileLayer(this.options.image.TilesUrl + '/{z}/{x}/{y}.png', {
            noWrap: true,
            bounds: mapBounds
        }).addTo(map);

        // this is used for adding overlays
        var layerControl = L.control.layers(null, null, { position: 'bottomright' }).addTo(map);

        // set position of zoom control
        var zoomControl = new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

        // alter distanceTo
        FantasyMap.overrideDistanceTo(this.options.image.meterPerPixel);

        // this is used for search
        var poiLayers = L.layerGroup().addTo(map);

        // add search control
        var searchControl = this._searchControl = L.control.search({
            layer: poiLayers,
            initial: false,
            position: 'topleft',
            zoom: 5,
            propertyName: 'name',
            textPlaceholder: 'Search LoreMaps',
            collapsed: false
        }).addTo(map);

        // add sidebar
        var sidebarControl = this._sidebarControl = L.control.sidebar('sidebar', {
            closeButton: true,
            position: 'left',
            autoPan: false
        }).addTo(map);

        // add the attributions
        var attributionControl = map.attributionControl;
        attributionControl.setPrefix('<a href="/">LoreMaps</a>');
        attributionControl.addAttribution(this.options.image.attribution);
        attributionControl.addAttribution(this.options.wiki.attribution);


        var geojsonOpts = {

            // correctly map the geojson coordinates on the image
            coordsToLatLng: function (coords) {
                return rc.unproject(coords);
            },

            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    opacity: 0.7,
                    title: feature.properties.name
                })
            },

            onEachFeature: function onEachFeature(feature, layer) {
                layer.on({
                    click: function (e) {
                        FantasyMap.openWikiLink(feature.properties.name);
                    }
                });
            }

        };

        // Initialise the FeatureGroup to store editable layers
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        $.each(this.options.data, function (url, text) {

            $.getJSON(url).done(function (data) {

                var geoLG = L.geoJson(data, geojsonOpts);

                poiLayers.addLayer(geoLG);

                layerControl.addOverlay(geoLG, text);

            });

        });

        // Initialise the draw control and pass it the FeatureGroup of editable layers
        var drawOptions = {
            draw: {
                    polygon: false,
                    circle: false,
                    rectangle: false,
                    marker: false,
                    polyline: {
                        metric: window.LoreMaps.UserPreferences.UseMetric
                    }
            },
            edit: {
                featureGroup: drawnItems,
                edit: false,
                remove: false
            }
        }


        // Set the button title text for the polyline button
        L.drawLocal.draw.toolbar.buttons.polyline = 'Measure distance';
        L.drawLocal.draw.handlers.polyline.tooltip.start = 'Click to start measurement.';
        L.drawLocal.draw.handlers.polyline.tooltip.cont = 'Click to continue measurement.';
        L.drawLocal.draw.handlers.polyline.tooltip.end = 'Click last point to finish measurement.';
        

        var drawControl = new L.Control.Draw(drawOptions);
        map.addControl(drawControl);

        // add hexGrid control
        var hexGridControl = this._hexGridControl = L.control.hexGrid({
            mPerPixel: this.options.image.meterPerPixel,
            minX: 0,
            minY: 0,
            maxX: this.options.image.width,
            maxY: this.options.image.height,
            rc: rc
        }).addTo(map);

        // add export to Image control
        var exportImageControl = this._exportImageControl = L.control.exportImage().addTo(map);

        exportImageControl.on('start', function (e) {
            sidebarControl.setContent('<h3>Creating image please wait...</h3>');
            sidebarControl.show();
        });

        exportImageControl.on('end', function (e) {
            sidebarControl.hide();
        });

        // add the bookmarks plugin
        var bookmarkControl = this._bookmarkControl = new L.Control.Bookmarks({
            position: 'topleft'
        }).addTo(map);
    },

    overrideDistanceTo: function (mPerPixel) {

        var rc = this._rc;

        L.LatLng.prototype.distanceTo = function (other) {

            var cursorPoint = rc.project(this),
                originalPoint = rc.project(other);

            var x = originalPoint.x - cursorPoint.x,
                y = originalPoint.y - cursorPoint.y;

            return Math.sqrt(x * x + y * y) * mPerPixel;

        };

    },

    openWikiLink: function (title) {

        var sidebar = this._sidebarControl;

        sidebar.setContent("Loading...");
        sidebar.show();

        var apiUrl = this.options.wiki.apiUrl;

        $.ajax({
            dataType: "jsonp",
            cache: true,
            url: this.options.wiki.apiUrl,
            data: {
                page: title,
                prop: "text",
                redirects: true,
                action: "parse",
                format: "json"
            }
        })
        .done(function (data) {

            if (data.parse && data.parse.text) {

                try {

                    var markup = data.parse.text["*"];

                    var blurb = FantasyMap.options.wiki.wikiParseMarkup(markup);

                    var titleHeader = $('<h2>', { text: title });

                    var output = blurb.prepend(titleHeader).html();

                    sidebar.setContent(output);

                } catch (e) {

                    throw e;
                }

            }
            else {
                sidebar.setContent("No references found for " + title);
            }

        })
        .fail(function (jqXHR, status, error) {
            sidebar.setContent('An error occurred while processing the request.');
        });

    },

};