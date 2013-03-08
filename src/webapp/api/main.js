var tlreq = requirejs.config({
    "baseUrl": "/timeline/api/",
    "packages": [
        {
            "name": "simile-ajax",
            "location": "/ajax/api"
        },
        {
            "name": "i18n",
            "location": "/ajax/api/lib",
            "main": "i18n"
        }
    ]
});

tlreq(
    ["require", "./timeline-api"],
    function(require, Timeline) {
        Timeline.load();
        // part of the point of Timeline is being available everywhere
        window.Timeline = Timeline;
    }
);
