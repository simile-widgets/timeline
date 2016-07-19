    var jq, s, t;
    jq = require("jquery");
    s = require("simile-ajax");
    t = require("timeline");
    jq(document).ready(function() {
        s.load();
        t.load();
        window.SimileAjax = s;
    });
    return t;
}));
