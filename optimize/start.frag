(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        root.Timeline = factory();
    }
}(this, function() {
