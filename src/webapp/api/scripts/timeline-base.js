define(["simile-ajax"], function(SimileAjax) {
    var Timeline = {
        // Note: version is also stored in the build.xml file
        "version": "3.0.0",  // use format 'pre 1.2.3' for trunk versions
        "ajax_lib_version": "3.0.0",
        "loaded": false,
        "display_version": null,
        "HORIZONTAL": 0,
        "VERTICAL": 1,
        "_defaultTheme": null,
        "urlPrefix": null,
        "serverLocale": null,
        "clientLocale": null,
        "timelines": null,
        "cssFiles": ["styles/main.css"],
        "bundledCssFile": "styles/timeline-bundle.css",
        "params": {
            "bundle": true,
            "ajax": null
        },
        "paramTypes": {
            "bundle": Boolean,
            "ajax": String
        },
        // ISO-639 language codes, ISO-3166 country codes (2 characters)
        "supportedLocales": [
            "cs",       // Czech
            "de",       // German
            "en",       // English
            "es",       // Spanish
            "fr",       // French
            "it",       // Italian
            "nl",       // Dutch (The Netherlands)
            "pl",       // Polish
            "ru",       // Russian
            "se",       // Swedish
            "tr",       // Turkish
            "vi",       // Vietnamese
            "zh"        // Chinese
        ]
    };

    // cf method Timeline.writeVersion
    Timeline.display_version = Timeline.version + ' (with Ajax lib ' + Timeline.ajax_lib_version + ')';

    return Timeline;
});

