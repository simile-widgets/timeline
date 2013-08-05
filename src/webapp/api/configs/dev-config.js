/**
 *
 * This is an example for what you should include in your own Timeline
 * development, it pulls in files individually for debugging purposes.
 * Assumes you've mounted /timeline and /ajax on a server.
 *
 * Surround your Timeline code with the following, substituting the path
 * as appropriate.
 * 
 * require(["path/to/this/file-without-js"], function() {
 *     require(["timeline"], function(Timeline) {
 *         window.Timeline = Timeline;
 *         // Your Timeline code here.
 *     });
 * });
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
            "bundle": false,
            "prefix": "/ajax/api/"
        },
        "timeline": {
            "bundle": false,
            "prefix": "/timeline/api/",
            "ajax": "/ajax/api"
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
