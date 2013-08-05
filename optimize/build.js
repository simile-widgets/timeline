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
    },
    // r.js does not provide a way to include all language bundles, so force
    "deps": [
        "nls/cs/days",
        "nls/cs/months",
        "nls/cs/timeline",
        "nls/days",
        "nls/de/months",
        "nls/de/timeline",
        "nls/es/months",
        "nls/es/timeline",
        "nls/fr/days",
        "nls/fr/months",
        "nls/fr/timeline",
        "nls/it/months",
        "nls/it/timeline",
        "nls/months",
        "nls/nl/months",
        "nls/nl/timeline",
        "nls/pl/days",
        "nls/pl/timeline",
        "nls/pt-br/days",
        "nls/pt-br/months",
        "nls/pt-br/timeline",
        "nls/ru/months",
        "nls/ru/timeline",
        "nls/se/days",
        "nls/se/months",
        "nls/se/timeline",
        "nls/timeline",
        "nls/tr/months",
        "nls/tr/timeline",
        "nls/vi/months",
        "nls/vi/timeline",
        "nls/zh/days",
        "nls/zh/months",
        "nls/zh/timeline"
    ]
})
