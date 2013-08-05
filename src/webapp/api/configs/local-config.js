/**
 *
 * This is an example for what you should include in your own application
 * for bundled demos.  It's what the RequireJS-based bundle demos use in
 * the Timeline examples.
 *
 */

requirejs.config({
    "baseUrl": "/timeline/api/",
    "paths": {
        "jquery": "lib/jquery",
        "i18n": "lib/i18n",
        "timeline": "timeline-bundle",
        "simile-ajax": "/ajax/api/simile-ajax-bundle"
    }
});
