// Example development configuration for loading SimileAjax
requirejs.config({
    "baseUrl": "http://localhost/~ryanlee/dev/timeline/scripts/",
    "urlArgs": "bust=" + (new Date()).getTime(),
    "paths": {
        "simile-ajax": "http://localhost/~ryanlee/dev/simile-ajax/scripts/simile-ajax-api.js"
    }
});

requirejs(
    ["require", "../timeline-api"],
    function(require, Timeline) {
        Timeline.load();
        // part of the point of Timeline is being available everywhere
        window.Timeline = Timeline;
    }
);
