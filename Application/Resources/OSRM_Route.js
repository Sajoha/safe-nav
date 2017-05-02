/*******************************************************************************
 * Query the OSRM API with the start and end coordinates, then parse the JSON
 * response to pull all of the coordinates required for the route, and push them
 * into an array one by one.
 *
 * @param {Object} startPin - A container for the latitude and longitude of the
 *                            start point
 * @param {Object} endPin - A container for the latitude and longitude of the
 *                          end point
 * @param {String} serverAddress - The IP of the routing server to connect to
 * @param {function} done - Callback for when the job is complete
 ******************************************************************************/
function OSRM_Route(startPin, endPin, serverAddress, done) {
	// Query the API server with the given coordinates
	var url = 'http://' + serverAddress + ':5000/route/v1/walking/' + startPin.longitude + ',' + startPin.latitude + ';' + endPin.longitude + ',' + endPin.latitude + '?steps=true&alternatives=true';

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
						incidents: 0
					};
					routePoints.push(coord);
				}
			}
			// Return the results
			done(routePoints);
		},
		onerror: function(e) {
			done(null)
		},
		// Timeout of 10 seconds
		timeout: 10000
	});

	// Prepare the connection.
	client.open("GET", url);

	// Send the request.
	client.send();
}

module.exports = OSRM_Route;
