define(["simile-ajax/simile-ajax-api"], function(SimileAjax) {
    var Timeline = {
        // Note: version is also stored in the build.xml file
        "version": "pre 2.4.0",  // use format 'pre 1.2.3' for trunk versions
        "ajax_lib_version": SimileAjax.version,
        "display_version": null,
        "HORIZONTAL": 0,
        "VERTICAL": 1,
        "_defaultTheme": null,
        "urlPrefix": null,
        "serverLocale": null,
        "clientLocale": null,
        "timelines": null
    };

    // cf method Timeline.writeVersion
    Timeline.display_version = Timeline.version + ' (with Ajax lib ' + Timeline.ajax_lib_version + ')';

    Timeline.getDefaultLocale = function() {
        return Timeline.clientLocale;
    };

    Timeline.getTimelineFromID = function(timelineID) {
        return Timeline.timelines[timelineID];
    };

    return Timeline;
});

