/*==================================================
 *  Thumbnail Multi Track Based Layout
 *==================================================
 */
<<<<<<< HEAD


Timeline.ThumbnailMultiTrackBasedLayout = function(params) {
=======
define(function() {
var ThumbnailMultiTrackBasedLayout = function(params) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    this._eventSource = params.eventSource;
    this._ether = params.ether;
    this._theme = params.theme;
    
    // all in pixels
    this._thumbnailWidth = params.thumbnailWidth;
    this._thumbnailHeight = params.thumbnailHeight;
    this._labelWidth = params.labelWidth;
    this._trackHeight = params.trackHeight;
    
    this._laidout = false;
    
    var layout = this;
    if (this._eventSource != null) {
        this._eventSource.addListener({
            onAddMany: function() {
                layout._laidout = false;
            }
        });
    }
};

<<<<<<< HEAD
Timeline.ThumbnailMultiTrackBasedLayout.prototype.initialize = function(timeline) {
    this._timeline = timeline;
};

Timeline.ThumbnailMultiTrackBasedLayout.prototype.getTrack = function(evt) {
=======
ThumbnailMultiTrackBasedLayout.prototype.initialize = function(timeline) {
    this._timeline = timeline;
};

ThumbnailMultiTrackBasedLayout.prototype.getTrack = function(evt) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    if (!this._laidout) {
        this._tracks = [];
        this._layout();
        this._laidout = true;
    }
    return this._tracks[evt.getID()];
};

<<<<<<< HEAD
Timeline.ThumbnailMultiTrackBasedLayout.prototype.getTrackCount = function() {
=======
ThumbnailMultiTrackBasedLayout.prototype.getTrackCount = function() {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    if (!this._laidout) {
        this._tracks = [];
        this._layout();
        this._laidout = true;
    }
    return this._trackCount;
};

<<<<<<< HEAD
Timeline.ThumbnailMultiTrackBasedLayout.prototype._layout = function() {
=======
ThumbnailMultiTrackBasedLayout.prototype._layout = function() {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    if (this._eventSource == null) {
        return;
    }
    
    var thumbnailTracks = Math.ceil(this._thumbnailHeight / this._trackHeight);
    
    var layout = this;
    var theme = this._theme;
    
    var streams = [];
    
    var fill = function() {
        for (var i = 0; i < thumbnailTracks; i++) {
            streams.push(Number.NEGATIVE_INFINITY);
        }
    }
    var search = function(streamIndex, pixel) {
        for (; streamIndex < streams.length - thumbnailTracks; streamIndex++) {
            var matched = true;
            for (var j = 0; j < thumbnailTracks; j++) {
                if (streams[streamIndex + j] > pixel) {
                    matched = false;
                    break;
                }
            }
            
            if (matched) {
                break;
            }
        }
        return streamIndex;
    }
    
    fill();
    
    var layoutEvent = function(evt) {
        var date = evt.getStart();
        var pixel = Math.round(layout._ether.dateToPixelOffset(date));
       
        var streamIndex = search(0, pixel);
        if (streamIndex >= streams.length - thumbnailTracks) {
            fill();
            streamIndex = search(streamIndex, pixel);
        }
        
        for (var i = 0; i < thumbnailTracks; i++) {
            streams[streamIndex + i] = pixel + layout._thumbnailWidth;
        }
        streams[streamIndex] = pixel + layout._thumbnailWidth + layout._labelWidth;
        
        layout._tracks[evt.getID()] = streamIndex;
    };
    
    var iterator = this._eventSource.getAllEventIterator();
    while (iterator.hasNext()) {
        var evt = iterator.next();
        layoutEvent(evt);
    }
    
    this._trackCount = streams.length;
<<<<<<< HEAD
};
=======
};

    return ThumbnailMultiTrackBasedLayout;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
