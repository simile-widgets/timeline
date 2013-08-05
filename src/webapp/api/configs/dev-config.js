/**
 *
 * This is an example for what you should include in your own Timeline
 * development, it pulls in files individually for debugging purposes.
 * Assumes you've mounted /timeline and /ajax on a server.
 *
 */

requirejs.config({
    "baseUrl": "/timeline/api/",
    "paths": {
        "jquery": "lib/jquery",
        "i18n": "lib/i18n"
    },
    "config": {
        // Uncomment to force use of chosen locale for testing
        // "i18n": {
        //     "locale": "zh"
        // },
        "simile-ajax": {
            "bundle": false
        },
        "timeline": {
            "bundle": false,
            "ajax": "/ajax/api/"
        }
    },
    "packages": [
        {
            "name": "simile-ajax",
            "main": "simile-ajax",
            "location": "/ajax/api/"
        }
    ]
});

require(["timeline"], function(Timeline) {
    window.Timeline = Timeline;
});
