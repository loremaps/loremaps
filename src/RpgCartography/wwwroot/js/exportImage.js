L.Control.ExportImage = L.Control.extend({

    includes: L.Mixin.Events,

    options: {
        position: 'topleft'
    },

    initialize: function (options) {

        options = options || {};

        L.Util.setOptions(this, options);

        L.Control.prototype.initialize.call(this, this.options);
    },

    onAdd: function (map) {
        this._map = map;

        var container = this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

        L.DomEvent
          .disableClickPropagation(container)
          .disableScrollPropagation(container);

        var stop = L.DomEvent.stopPropagation;

        L.DomEvent.on(this._container, 'mousedown', stop)
                  .on(this._container, 'touchstart', stop)
                  .on(this._container, 'dblclick', stop)
                  .on(this._container, 'mousewheel', stop)
                  .on(this._container, 'MozMozMousePixelScroll', stop);

        L.DomEvent
          .on(container, 'click', this._onExportClick, this);

        var controlUI = L.DomUtil.create('a', '', container);
        controlUI.title = 'Export Image';
        controlUI.style.backgroundImage = "url('/images/Camera.png')";

        return container;
    },
    
    _onExportClick: function (e) {

        var map = this._map;
        var container = this._container;

        this.fire('start');
        var self = this;
    
        leafletImage(map, function (err, canvas) {
            
            var dataURL = canvas.toDataURL("image/jpeg", 0.8);

            download(dataURL, "export.jpg", "image/jpeg");

            self.fire('end');
        });

    }

});

L.control.exportImage = function (options) {
    return new L.Control.ExportImage(options);
} 
