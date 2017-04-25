// TODO: Give time and distance information

// Imports
var
    TiMap = require('ti.map'),
    Route = require('./OSRM_Route.js'),
    Police = require('./Police_Check.js');

var segments = [];

// Create the route window object
var mapWin = Ti.UI.createWindow();
var map = TiMap.createView();

// Get the users current location, and configure the map view
Titanium.Geolocation.getCurrentPosition(function(e) {
    map.mapType = TiMap.HYBRID_TYPE,
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

// Listen for the user holding down on the map
map.addEventListener('longclick', function(e) {
    var dialog = Ti.UI.createOptionDialog({
        cancel: 2,
        options: ['Start Pin', 'End Pin', 'Cancel'],
        selectedIndex: 2,
        destructive: 0,
        title: 'Place Which Pin?'
    });
    // Take the option menu click
    dialog.addEventListener('click', function(evt) {
        if(evt.index === 0) {
            getPins(function(startPin, endPin) {
                // If a pin already exists, remove it
                if(typeof startPin !== 'undefined') {
                    map.removeAnnotation(startPin);
                }
                clearRoute(function() {});
                // Place a start pin
                map.addAnnotation(TiMap.createAnnotation({
                    latitude: e.latitude,
                    longitude: e.longitude,
                    title: 'Start',
                    animate: true,
                    pincolor: TiMap.ANNOTATION_RED
                }));
            });
        } else if(evt.index === 1) {
            getPins(function(startPin, endPin) {
                // If a pin already exists, remove it
                if(typeof endPin !== 'undefined') {
                    map.removeAnnotation(endPin);
                }
                clearRoute(function() {});
                // Place an end pin
                map.addAnnotation(TiMap.createAnnotation({
                    latitude: e.latitude,
                    longitude: e.longitude,
                    title: 'End',
                    animate: true,
                    pincolor: TiMap.ANNOTATION_GREEN
                }));
            })
        }
    });
    dialog.show();
});

// Open the window
mapWin.open();

function clearRoute(done) {
    // Remove the old route if it exists
    segments.forEach(function(segment) {
        map.removeRoute(segment);
    });
    segments = [];
    done();
}

function getPins(done) {
    // Declare the nodes so they're global for the function
    var startNode,
        endNode;

    // Extract the start node and the end node
    map.annotations.forEach(function(pin) {
        if(pin.title === 'Start') {
            startNode = pin;
        } else {
            endNode = pin;
        }
    });
    done(startNode, endNode);
}

function drawRoute() {
    // Get the start and end point
    getPins(function(startNode, endNode) {
        // Check if the pins have been placed
        if(startNode == null) {
            Ti.API.info('Start pin not placed');
        } else if(endNode == null) {
            Ti.API.info('End pin not placed');
        } else {
            // Clear the old route
            clearRoute(function() {});
            // Pass the pins to the method extraction function, then draw the route
            Route(startNode, endNode, function(routePoints) {
                // The total amount of incidents returned from each node of the route
                callPolice(routePoints, function(routeTotal) {
                    // Calculate the average incidents for the entire route
                    var routeAvrg = routeTotal / routePoints.length;

                    Ti.API.info(routeAvrg)

                    // Iterate over the route points
                    for(var i = 0; i < (routePoints.length - 1); i++) {
                        // Create a temporary route between two instruction points on the map
                        var tempRoute = [
                            pointA = {
                                latitude: routePoints[i].latitude,
                                longitude: routePoints[i].longitude
                            },
                            pointB = {
                                latitude: routePoints[i + 1].latitude,
                                longitude: routePoints[i + 1].longitude
                            }
                        ];

                        // Calculate the average danger factor based on the two readings at each end
                        var dangerValue = (routePoints[i].incidents + routePoints[i + 1].incidents) / 2;

                        // Get the colour for the segment based on how far the incident rate fluctuates from the average
                        var colour = '#ffff00';

                        if(dangerValue <= (routeAvrg * 0.5)) {
                            colour = '#00ff00';
                        } else if(dangerValue <= (routeAvrg * 1)) {
                            colour = '#ccff66';
                        } else if(dangerValue <= (routeAvrg * 1.25)) {
                            colour = '#ffcc00';
                        } else if(dangerValue <= (routeAvrg * 1.5)) {
                            colour = '#ff9933';
                        } else if(dangerValue <= (routeAvrg * 2)) {
                            colour = '#ff3300';
                        }

                        // Create the route object using the coords and colour
                        var segment = TiMap.createRoute({
                            points: tempRoute,
                            color: colour,
                            width: 5.0
                        });

                        // Record the route segments so they can be removed later
                        segments.push(segment);

                        // Draw the segment onto the map
                        map.addRoute(segment);
                    }
                });
            });
        }
    });
}

function callPolice(routePoints, done) {
    // Total amount of incidents on route
    var routeTotal = 0;

    var progress = Ti.UI.createProgressBar({
        top: 25,
        width: 250,
        min: 0,
        max: routePoints.length,
        value: 0,
        color: 'blue',
        message: 'Querying Coordinate 0 of ' + routePoints.length,
        font: {
            fontSize: 14,
            fontWeight: 'bold'
        },
        style: Ti.UI.iOS.ProgressBarStyle.PLAIN,
    });
    mapWin.add(progress);

    // Self calling function to get the police date for each node
    // The timeout is due to the call limit on the police database of 15 requests per second
    (function loop(i) {
        setTimeout(function() {
            // Update the progress bar status
            progress.message = 'Querying Coordinate ' + ++progress.value + ' of ' + routePoints.length;

            // Query the police database for the current position
            Police(routePoints[routePoints.length - i].latitude, routePoints[routePoints.length - i].longitude, function(policeIncidents) {
                // Update the incident count for the current position
                routePoints[routePoints.length - i].incidents = policeIncidents;

                // Add the current positions incidents to the total
                routeTotal += policeIncidents;
                if(--i) {
                    loop(i);
                } else {
                    // Have to wait to callback, otherwise it does so before all API responses are in
                    setTimeout(function() {
                        // Remove the progress bar from the UI
                        mapWin.remove(progress);
                        done(routeTotal);
                    }, 2000);
                }
            });
        }, 100)
    })(routePoints.length);
}
