// This is an example for what you should include in your own application
// for local development given you're using the included Jetty server to
// put Timeline up via local HTTP.
requirejs.config({
    "baseUrl": "/timeline/api/",
    "paths": {
        "jquery": "lib/jquery",
        "i18n": "lib/i18n",
        "timeline": "timeline-require-bundle",
        "simile-ajax": "/ajax/api/simile-ajax-require-bundle"
    }
});
