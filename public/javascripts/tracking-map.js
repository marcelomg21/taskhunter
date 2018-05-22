//Create a single global variable
var MAPAPP = {};
MAPAPP.markers = [];
MAPAPP.currentInfoWindow;
MAPAPP.pathName = window.location.pathname;
var map;

$(document).ready(function() {
    initialize();
    $('#goTracking').on('click', goTracking);
});

function goTracking(event) {
    event.preventDefault();
    
    var trackingUserBody = {
        'date_tracking': $('#dateTracking').val()
    }

    var userId = $('#userTrackingId').val();

    // Use AJAX to post the object to our adduser service
    $.ajax({
        type: 'POST',
        data: trackingUserBody,
        url: '/user/trackingUser/' + userId,
        dataType: 'JSON'
    }).done(function( response ) {
        populateTracking(MAPAPP.pathName, response);
    });
};

//Initialize our Google Map
function initialize() {
    
    var center = new google.maps.LatLng(39.9543926,-75.1627432);
    
    var mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: center,
    };
    
    var mapCanvas = $('#map_canvas')[0];
    alert(mapCanvas);
    map = new google.maps.Map(mapCanvas, mapOptions);
    //map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    
};

function populateTracking(dataType, data) {
    //For each item in our JSON, add a new map marker
        $.each(data, function(i, ob) {
            var marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(this.location.coordinates[0], this.location.coordinates[1]),
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
    	//Build the content for InfoWindow
            var content = '<h1 class="mt0"><a href="' + marker.website + '" target="_blank" title="' + 'marker.shopname' + '">' + 'marker.shopname' + '</a></h1><p>' + 'marker.details' + '</p>';
        	marker.infowindow = new google.maps.InfoWindow({
            	content: content,
            	maxWidth: 400
            });
    	//Add InfoWindow
            google.maps.event.addListener(marker, 'click', function() {
                if (MAPAPP.currentInfoWindow) MAPAPP.currentInfoWindow.close();
                marker.infowindow.open(map, marker);
                MAPAPP.currentInfoWindow = marker.infowindow;
            });
            MAPAPP.markers.push(marker);
        });
};

// Fill map with markers
function populateMarkers(dataType) {
    apiLoc = typeof apiLoc !== 'undefined' ? apiLoc : '/data/' + dataType + '.json';
    // jQuery AJAX call for JSON
    $.getJSON(apiLoc, function(data) {
        //For each item in our JSON, add a new map marker
        $.each(data, function(i, ob) {
            var marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(this.location.coordinates[0], this.location.coordinates[1]),
                shopname: this.shopname,
                details: this.details,
                website: this.website,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
    	//Build the content for InfoWindow
            var content = '<h1 class="mt0"><a href="' + marker.website + '" target="_blank" title="' + marker.shopname + '">' + marker.shopname + '</a></h1><p>' + marker.details + '</p>';
        	marker.infowindow = new google.maps.InfoWindow({
            	content: content,
            	maxWidth: 400
            });
    	//Add InfoWindow
            google.maps.event.addListener(marker, 'click', function() {
                if (MAPAPP.currentInfoWindow) MAPAPP.currentInfoWindow.close();
                marker.infowindow.open(map, marker);
                MAPAPP.currentInfoWindow = marker.infowindow;
            });
            MAPAPP.markers.push(marker);
        });
    });
};
