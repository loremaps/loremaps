// Write your Javascript code.

(function (window, document) {

    var LoreMaps = {};

    if (!window.LoreMaps) {
        window.LoreMaps = LoreMaps;
    }


    LoreMaps.UserPreferences = {
        UseMetric: false,

        load: function () {
            this.UseMetric = JSON.parse(localStorage.getItem('UseMetricLM') || false);
        },
        
        save: function () {
            localStorage.setItem('UseMetricLM', this.UseMetric);
        }
    }


    if (typeof (Storage) === "undefined") {
        throw 'Web Storage is not supported';
    }

    LoreMaps.UserPreferences.load();


}(window, document));

