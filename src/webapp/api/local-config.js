// This is an example for what you should include in your own application
// for local development given you're using the included Jetty server to
// put Timeline up via local HTTP.
requirejs.config({
    "baseUrl": "/timeline/api/",
    "paths": {
        "jquery": "/ajax/api/lib/jquery",
        "i18n": "/ajax/api/lib/i18n"
    },
    "packages": [
        {
            "name": "simile-ajax",
            "location": "/ajax/api",
            "main": "simile-ajax-api"
        }
    ]
});
