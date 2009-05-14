(function() {
    var f = null;
    if (typeof Timeline_onLoad == "string") {
        f = eval(Timeline_onLoad);
        Timeline_onLoad = null;
    } else if (typeof Timeline_onLoad == "function") {
        f = Timeline_onLoad;
        Timeline_onLoad = null;
    }
    
    if (f != null) {
        f();
    }
})();