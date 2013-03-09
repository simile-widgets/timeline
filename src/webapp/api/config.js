var domain = "http://api.simile-widgets.org/";
var timeline_version = "3.0.0";
var ajax_version = "3.0.0";
requirejs.config({
    "baseUrl": domain + "timeline/" + timeline_version + "/",
    "paths": {
        "jquery": domain + "ajax/" + ajax_version + "/lib/jquery",
        "i18n": domain + "ajax/" + ajax_version + "/lib/i18n"
    },
    "packages": [
        {
            "name": "simile-ajax",
            "location": domain + "ajax/" + ajax_version,
            "main": "config"
        }
    ]
});
