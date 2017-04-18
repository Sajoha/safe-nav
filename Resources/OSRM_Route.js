function OSRM_Route(startPin, endPin, done) {
    // Query the API server with the given coordinates
    var url = 'http://192.168.0.17:5000/route/v1/driving/' + startPin.longitude + ',' + startPin.latitude + ';' + endPin.longitude + ',' + endPin.latitude + '?steps=true&alternatives=true';
    Ti.API.info('OSRM: ' + url);

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

module.exports = OSRM_Route;
