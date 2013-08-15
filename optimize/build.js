({
    "baseUrl": "../src/webapp/api/",
    "name": "lib/almond",
    "include": ["timeline"],
    "out": "../build/timeline-api.js",
    "wrap": {
        "startFile": "start.frag",
        "endFile": "end.frag"
    },
    "paths": {
        "jquery": "lib/jquery",
        "i18n": "lib/i18n",
        "simile-ajax": "../../ajax/api/simile-ajax-api"
    }
})
