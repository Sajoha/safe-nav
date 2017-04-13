/**
 * @author Sam Haig
 */

// TODO: Make pins placeable

// TODO: Remove old route when a new one is created

// TODO: Find out how long press works

// TODO: Import this back into the app.js

var Map = require('ti.map');

function MapView() {
    // Create the route window object
    var mapWin = Ti.UI.createWindow();
    var map = Map.createView();

    // Get the users current location, and configure the map view
    Titanium.Geolocation.getCurrentPosition(function(e) {
        map.mapType = Map.NORMAL_TYPE,
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
        // Method variables
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
        getRoute(startNode, endNode, function(routePoints) {
            map.addRoute(Map.createRoute({
                points: routePoints,
                color: "#f00",
                width: 5.0
            }));
        });
    });
    map.add(currentButton);

    // Open the window
    mapWin.open();

    // Add an start pin, currently in a street away from the centre of Huddersfield
    map.addAnnotation(Map.createAnnotation({
        latitude: 53.643306,
        longitude: -1.758004,
        title: 'Start',
        animate: true,
        pincolor: Map.ANNOTATION_RED
    }));

    // Add an end pin, currently on the University of Huddersfield
    map.addAnnotation(Map.createAnnotation({
        latitude: 53.640894,
        longitude: -1.778847,
        title: 'End',
        animate: true,
        pincolor: Map.ANNOTATION_GREEN
    }));
};
module.exports = MapView;

function getRoute(startPin, endPin, done) {
    // Query the API server with the given coordinates
    var url = 'http://192.168.0.39:5000/route/v1/driving/' + startPin.longitude + ',' + startPin.latitude + ';' + endPin.longitude + ',' + endPin.latitude + '?steps=true';
    Ti.API.info('Route request sent to: ' + url);

    // Instantiate the routePoints object
    var routePoints = [];

    // Parse the response
    var client = Ti.Network.createHTTPClient({
        onload: function(e) {
            var response = JSON.parse(this.responseText);
            // Concatinate all of the JSON coordinates into an array
            for(var i = 0; i < response.routes[0].legs[0].steps.length; i++) {
                for(var k = 0; k < response.routes[0].legs[0].steps[i].intersections.length; k++) {
                    var coord = {
                        latitude: response.routes[0].legs[0].steps[i].intersections[k].location[1],
                        longitude: response.routes[0].legs[0].steps[i].intersections[k].location[0],
                    };
                    routePoints.push(coord);
                }
            }
            // Return the results
            done(routePoints);
        },
        onerror: function(e) {
            Ti.API.debug(e.error);
            alert('Cannot reach navigation API!');
        },
        timeout: 5000
    });

    // Prepare the connection.
    client.open("GET", url);

    // Send the request.
    client.send();
}
