define(["simile-ajax"], function(SimileAjax) {
    var Timeline = {
        // Note: version is also stored in the build.xml file
        "version": "3.0.0",  // use format 'pre 1.2.3' for trunk versions
        "ajax_lib_version": "3.0.0",
        "display_version": null,
        "HORIZONTAL": 0,
        "VERTICAL": 1,
        "_defaultTheme": null,
        "urlPrefix": null,
        "serverLocale": null,
        "clientLocale": null,
        "timelines": null,
        "params": {
            "bundle": true,
            "ajax": null
        },
        "paramTypes": {
            "bundle": Boolean,
            "ajax": String
        }
    };

    // cf method Timeline.writeVersion
    Timeline.display_version = Timeline.version + ' (with Ajax lib ' + Timeline.ajax_lib_version + ')';

    return Timeline;
});

