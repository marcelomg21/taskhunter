//Create a single global variable
var MAPAPP = {};
MAPAPP.markers = [];
MAPAPP.currentInfoWindow;
MAPAPP.pathName = window.location.pathname;
var map;
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();

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
        populateTracking(response);
    });
};

//Initialize our Google Map
function initialize() {
    
    /*var center = new google.maps.LatLng(39.9543926,-75.1627432);
    
    var mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: center,
    };
    
    var mapCanvas = $('#map_canvas')[0];
    
    map = new google.maps.Map(mapCanvas, mapOptions);*/
    //map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    
    directionsDisplay = new google.maps.DirectionsRenderer();
 
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -30.036786, lng: -51.150565},
      zoom: 13
    });
    
    directionsDisplay.setMap(map);
    
};

function populateTracking(data) {
    //For each item in our JSON, add a new map marker
    var infowindow = new google.maps.InfoWindow();

      var marker, i;
      var request = {
        travelMode: google.maps.TravelMode.DRIVING
      };
    
      for (i = 0; i < data.length; i++) {
        marker = new google.maps.Marker({
          position: new google.maps.LatLng(data[i].location.coordinates[0], data[i].location.coordinates[1]),
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
            infowindow.setContent(data[i].location.coordinates[0]);
            infowindow.open(map, marker);
          }
        })(marker, i));

        if (i == 0) request.origin = marker.getPosition();
        else if (i == data.length - 1) request.destination = marker.getPosition();
        else {
          if (!request.waypoints) request.waypoints = [];
          request.waypoints.push({
            location: marker.getPosition(),
            stopover: true
          });
        }

      }
    
    /*$.each(data, function(i, ob) {
        var marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(this.location.coordinates[0], this.location.coordinates[1]),
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        //var start = new google.maps.LatLng(this.location.coordinates[0], this.location.coordinates[1]);
        //var end = new google.maps.LatLng(this.location.coordinates[0], this.location.coordinates[1]);

        /*var content = '<h1 class="mt0"><a href="' + marker.website + '" target="_blank" title="' + 'marker.shopname' + '">' + 'marker.shopname' + '</a></h1><p>' + 'marker.details' + '</p>';
        marker.infowindow = new google.maps.InfoWindow({
            content: content,
            maxWidth: 400
        });

        google.maps.event.addListener(marker, 'click', function() {
            if (MAPAPP.currentInfoWindow) MAPAPP.currentInfoWindow.close();
            marker.infowindow.open(map, marker);
            MAPAPP.currentInfoWindow = marker.infowindow;
        });
        MAPAPP.markers.push(marker);
        
    });*/
    
    var bounds = new google.maps.LatLngBounds();
    //bounds.extend(start);
    //bounds.extend(end);

    map.fitBounds(bounds);
    
    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);
        } else {
            alert("Directions Request from " + status);
        }
    });

    /*directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            directionsDisplay.setMap(map);
        } else {
            alert("Directions Request from " + status);
        }
    });*/
    
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
