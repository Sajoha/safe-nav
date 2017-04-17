// TODO: Make pins placeable

// TODO: Remove old route when a new one is created

// TODO: Find out how long press works

// TODO: Import this back into the app.js

// Imports
var
    TiMap = require('ti.map'),
    Route = require('./OSMR_Route.js'),
    Police = require('./Police_Check.js');

// Create the route window object
var mapWin = Ti.UI.createWindow();
var map = TiMap.createView();

// Get the users current location, and configure the map view
Titanium.Geolocation.getCurrentPosition(function(e) {
    map.mapType = TiMap.NORMAL_TYPE,
        map.region = {
            latitude: e.coords.latitude,
            longitude: e.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        },
        map.animate = true,
        map.regionFit = true,
        map.userLocation = true
});
mapWin.add(map);

// Button for setting the view back to the current location
var currentButton = Ti.UI.createButton({
    title: 'Calculate',
    top: '80%',
    left: '5%',
    width: 100,
    height: 50
});

// Collect the route points, and draw them onto the map
currentButton.addEventListener('click', function(e) {
    drawRoute();
});
map.add(currentButton);

// Open the window
mapWin.open();

// Add an start pin, currently in a street away from the centre of Huddersfield
map.addAnnotation(TiMap.createAnnotation({
    latitude: 53.643306,
    longitude: -1.758004,
    title: 'Start',
    animate: true,
    pincolor: TiMap.ANNOTATION_RED
}));

// Add an end pin, currently on the University of Huddersfield
map.addAnnotation(TiMap.createAnnotation({
    latitude: 53.640894,
    longitude: -1.778847,
    title: 'End',
    animate: true,
    pincolor: TiMap.ANNOTATION_GREEN
}));

function drawRoute() {
    // Function variables
    var startNode,
        endNode;

    // Extract the start node and the end node
    for(var i = 0; i < map.annotations.length; i++) {
        if(map.annotations[i].title === 'Start') {
            startNode = map.annotations[i];
        } else if(map.annotations[i].title === 'End') {
            endNode = map.annotations[i];
        }
    }

    // Pass the pins to the method extraction function, then draw the route
    Route(startNode, endNode, function(routePoints) {
        routePoints.forEach(function(node) {
            Police(node.latitude, node.longitude, function(policeIncidents) {
                setTimeout(function() {
                    map.addAnnotation(TiMap.createAnnotation({
                        latitude: node.latitude,
                        longitude: node.longitude,
                        title: policeIncidents,
                        animate: false,
                        pincolor: TiMap.ANNOTATION_RED
                    }));
                }, timeout);
            });
        });

        map.addRoute(TiMap.createRoute({
            points: routePoints,
            color: "#f00",
            width: 5.0
        }));
    });
}
