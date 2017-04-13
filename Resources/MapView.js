/**
 * @author Sam Haig
 */

var Map = require('ti.map');

function MapView() {
    // Create the route window object
    var mapWin = Ti.UI.createWindow();

    // Create a map object, and insert it in the window
    var mapview = Map.createView({
        mapType: Map.NORMAL_TYPE,
        region: {
            latitude: 52.505366,
            longitude: 13.386624,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        },
        animate: true,
        regionFit: true,
        userLocation: true,
        annotations: []
    });
    mapWin.add(mapview);

    // Collect the route points, and draw them onto the map
    getRoute(function(routePoints) {
        var route = Map.createRoute({
            points: routePoints,
            color: "#f00",
            width: 5.0
        });
        mapview.addRoute(route);
    });

    mapWin.open();
};

module.exports = MapView;

function getRoute(done) {
    // Query the API server with the given coordinates
    var url = 'https://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.385983,52.496891?steps=true'
    // var url = "http://192.168.0.39:5000/route/v1/driving/53.848611,-1.663822;53.870108,-1.727657?steps=true";

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
