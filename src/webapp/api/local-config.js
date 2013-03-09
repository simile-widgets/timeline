// This is an example for what you should include in your own application
// for local development given you're using the included Jetty server to
// put Timeline up via local HTTP.
requirejs.config({
    "baseUrl": "/timeline/api/",
    "packages": [
        {
            "name": "simile-ajax",
            "location": "/ajax/api",
            "main": "local-config"
        },
        {
            "name": "i18n",
            "location": "/ajax/api/lib",
            "main": "i18n"
        }
    ]
});
