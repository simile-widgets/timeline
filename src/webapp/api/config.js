var domain = "http://api.simile-widgets.org/";
var timeline_version = "3.0.0";
var ajax_version = "3.0.0";
requirejs.config({
    "baseUrl": domain + "timeline/" + timeline_version + "/",
    "packages": [
        {
            "name": "simile-ajax",
            "location": domain + "ajax/" + ajax_version,
            "main": "config"
        },
        {
            "name": "i18n",
            "location": domain + "ajax/" + ajax_version + "/lib",
            "main": "i18n"
        }
    ]
});
