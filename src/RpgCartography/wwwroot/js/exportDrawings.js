L.Control.ExportDrawings = L.Control.extend({

    includes: L.Mixin.Events,
    
    options: {
        position: 'topleft',
        layer: null
    },
    
    onAdd: function (map) {

        var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function () {

                var jsons = [],
                    json;

                var drawLayer = this._layer;

                $.each(drawLayer.getLayers(), function (index, layer) {
                    json = layer.toGeoJSON();
                    json.properties["name"] = layer.options.title;
                    jsons.push(json);
                });

                var geoCol = {
                    type: 'FeatureCollection',
                    features: jsons
                };

                console.log(JSON.stringify(geoCol));
            });

        var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-edit', controlDiv);
        controlUI.title = 'Export drawings';
        controlUI.href = '#';

        controlDiv._layer = this.options.layer;

        return controlDiv;
    }

});