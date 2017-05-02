// Imports
var
	TiMap = require('ti.map'),
	Route = require('./OSRM_Route.js'),
	Police = require('./Police_Check.js');

// Array for holding the route objects
var segments = [];
// Array for holding the heat map tiles
var tiles = [];
// Boolean for whether or not to use the Police API
var usePolice = true;

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

// Button for zooming into the map view
var zoomIn = Ti.UI.createButton({
	title: '+',
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '5%',
	right: '2%',
	width: 30,
	height: 30
});
// Update the map view by zooming in
zoomIn.addEventListener('click', function(e) {
	map.setLocation({
		latitude: map.region.latitude,
		longitude: map.region.longitude,
		latitudeDelta: (map.region.latitudeDelta / 1.50),
		longitudeDelta: (map.region.longitudeDelta / 1.50),
		animate: true
	});
});
map.add(zoomIn);

// Button for zooming out in the map view
var zoomOut = Ti.UI.createButton({
	title: '-',
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '10%',
	right: '2%',
	width: 30,
	height: 30
});
// Update the map view by zooming out
zoomOut.addEventListener('click', function(e) {
	map.setLocation({
		latitude: map.region.latitude,
		longitude: map.region.longitude,
		latitudeDelta: (map.region.latitudeDelta * 1.50),
		longitudeDelta: (map.region.longitudeDelta * 1.50),
		animate: true
	});
});
map.add(zoomOut);

// Button for setting the view back to the current location
var currentLocation = Ti.UI.createButton({
	title: 'o',
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '15%',
	right: '2%',
	width: 30,
	height: 30
});
// Update the map view with the current location
currentLocation.addEventListener('click', function(e) {
	Titanium.Geolocation.getCurrentPosition(function(e) {
		map.setLocation({
			latitude: e.coords.latitude,
			longitude: e.coords.longitude,
			latitudeDelta: 0.01,
			longitudeDelta: 0.01,
			animate: true
		});
	});
});
map.add(currentLocation);

// Button for toggling whether or not the route uses real time police data
var togglePolice = Ti.UI.createButton({
	title: ('Police: ' + usePolice),
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '75%',
	right: '2%',
	width: 100,
	height: 35
});
// Toggle the option
togglePolice.addEventListener('click', function(e) {
	(usePolice) ? (usePolice = false) : (usePolice = true);
	togglePolice.setTitle('Police: ' + usePolice);
});
map.add(togglePolice);

// Button for getting a route based on the fastest route available
var plotVanilla = Ti.UI.createButton({
	title: 'Fastest Route',
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '80%',
	right: '2%',
	width: 100,
	height: 35
});
// Call the route draw against the vanilla server
plotVanilla.addEventListener('click', function(e) {
	drawRoute('192.168.0.18');
});
map.add(plotVanilla);

// Button for getting a route based on the safest route available
var plotPolice = Ti.UI.createButton({
	title: 'Safest Route',
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '85%',
	right: '2%',
	width: 100,
	height: 35
});
// Call the route draw against the updated server
plotPolice.addEventListener('click', function(e) {
	drawRoute('192.168.0.17');
});
map.add(plotPolice);

// Button for loading a heat map over the interface
var loadMap = Ti.UI.createButton({
	title: 'Load Heat Map',
	backgroundColor: '#ffffff',
	borderRadius: 10,
	top: '90%',
	right: '2%',
	width: 150,
	height: 35
});
// Display the heat map
loadMap.addEventListener('click', function(e) {
	display();
});
map.add(loadMap);

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

/*******************************************************************************
 * Helper for removing all of the route objects from the map.
 *
 * @param {function} done - Callback for when the job is complete
 ******************************************************************************/
function clearRoute(done) {
	// Remove the old route if it exists
	segments.forEach(function(segment) {
		map.removeRoute(segment);
	});
	segments = [];
	done();
}


/*******************************************************************************
 * Helper for retrieving which pin is the start pin, and which is the end pin.
 *
 * @param {function} done - Callback for when the job is complete
 ******************************************************************************/
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

/*******************************************************************************
 * Contact the routing server to get all the coordinates between the two placed
 * pins to create a route, then run each set of coordinates through the Police
 * API to get the number of incidents per node. Once all the nodes have been
 * checked, draw the route, with each segment colour coordinated depending on
 * the overall average incidents for the route.
 *
 * @param {String} serverAddress - The IP of the routing server to connect to
 ******************************************************************************/
function drawRoute(serverAddress) {
	// Get the start and end point
	getPins(function(startNode, endNode) {
		// Check if the pins have been placed
		if(startNode == null && endNode == null) {
			alert('No routing pins placed!');
		} else if(startNode == null) {
			alert('Start pin not placed!');
		} else if(endNode == null) {
			alert('End pin not placed!');
		} else {
			// Clear the old route
			clearRoute(function() {});
			// Pass the pins to the method extraction function, then draw the route
			Route(startNode, endNode, serverAddress, function(routePoints) {
				if(routePoints == null) {
					alert('Error connecting to the routing service!')
				} else {
					if(usePolice) {
						// The total amount of incidents returned from each node of the route
						callPolice(routePoints, function(routeTotal) {
							// Calculate the average incidents for the entire route
							var routeAvrg = routeTotal / routePoints.length;

							Ti.API.info('Average number of incidents per node: ' + Math.round(routeAvrg))

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
					} else {
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
							// Create the route object using the coords and colour
							var segment = TiMap.createRoute({
								points: tempRoute,
								color: 'ffff00',
								width: 5.0
							});

							// Record the route segments so they can be removed later
							segments.push(segment);

							// Draw the segment onto the map
							map.addRoute(segment);
						}
					}
				}
			});
		}
	});
}

/*******************************************************************************
 * Pass in an array of points, and then run them through the police database
 * to get the number of incidents at a given latitude and longitude. Also create
 * an average score for all of the route passed in.
 *
 * @param {Array} points - An array of coordinates to be run against the API
 * @param {function} done - Callback for when the job is complete
 ******************************************************************************/
function callPolice(points, done) {
	// Lock the UI
	lockUI();

	// Total amount of incidents on route
	var routeTotal = 0;

	// Create a progress bar to update the progress
	var progress = Ti.UI.createProgressBar({
		height: 45,
		width: '75%',
		backgroundColor: '#ffffff',
		borderRadius: 10,
		min: 0,
		max: points.length,
		value: 0,
		color: 'blue',
		message: 'Querying Coordinate 0 of ' + points.length,
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
		// Update the progress bar status
		progress.message = 'Querying Coordinate ' + ++progress.value + ' of ' + points.length;

		// Query the police database for the current position
		Police(points[points.length - i].latitude, points[points.length - i].longitude, function(policeIncidents) {
			if(policeIncidents == null) {
				policeIncidents = (routeTotal / ((points.length - i) + 1));
				Ti.API.info('Error on police request, replacing point with current average: ' + policeIncidents);
			}

			// Update the incident count for the current position
			points[points.length - i].incidents = policeIncidents;

			// Add the current positions incidents to the total
			routeTotal += policeIncidents;
			if(--i) {
				loop(i);
			} else {
				// Have to wait to callback, otherwise it does so before all API responses are in
				setTimeout(function() {
					// Remove the progress bar from the UI
					mapWin.remove(progress);

					// Free up the UI
					unlockUI();

					// Callback
					done(routeTotal);
				}, 2000);
			}
		});
	})(points.length);
}

/*******************************************************************************
 * Get the tile map for the current view, query the police database dor each tile
 * and then display it as a semi transparent view on the map with a colour
 * gradient, representitve of the average incidents per tile.
 ******************************************************************************/
function display() {
	// Get the height of the screen divided by 16 for the dimension of the squares
	var dimension = (Ti.Platform.displayCaps.platformHeight / 16);

	// Get the position of all the squares, and the map coordinates of their centre
	heatMap(function(squarePoints) {
		// Run all the squares through the police database
		callPolice(squarePoints, function(average) {

			// Calculate the average for the region on the display
			var areaAverage = average / squarePoints.length;

			for(var i = 0; i < squarePoints.length; i++) {
				// Get the colour for the segment based on how far the incident rate fluctuates from the average
				var colour = '#59ffff00';

				if(squarePoints[i].incidents <= (areaAverage * 0.5)) {
					colour = '#5900ff00';
				} else if(squarePoints[i].incidents <= (areaAverage * 1)) {
					colour = '#59ccff66';
				} else if(squarePoints[i].incidents <= (areaAverage * 1.25)) {
					colour = '#59ffcc00';
				} else if(squarePoints[i].incidents <= (areaAverage * 1.5)) {
					colour = '#59ff9933';
				} else if(squarePoints[i].incidents <= (areaAverage * 2)) {
					colour = '#59ff3300';
				}

				// Create a square on the display, with a colour dependant of the crime average
				var tile = Ti.UI.createView({
					top: squarePoints[i].y,
					left: squarePoints[i].x,
					width: dimension,
					height: dimension,
					backgroundColor: colour
				});
				// Add it to the tile array
				tiles.push(tile);
				// Add it to the display
				map.add(tile);
			}

			// Button for closing the heat map
			var close = Ti.UI.createButton({
				title: 'Close Heat Map',
				backgroundColor: '#ffffff',
				borderRadius: 10,
				top: '90%',
				right: '2%',
				width: 150,
				height: 35
			});
			// Remove all the tiles and this button
			close.addEventListener('click', function(e) {
				tiles.forEach(function(tile) {
					map.remove(tile);
				});
				tiles = [];
				map.remove(close);
			});
			map.add(close);
		});
	});
}

/*******************************************************************************
 * Get all of the tiles to fill up the screen, and the latitude longitude
 * coordinates at the centre of the tile points.
 *
 * @param {function} done - Callback for when the job is complete
 ******************************************************************************/
function heatMap(done) {
	// Dimension for each square tile
	var dimension = (Ti.Platform.displayCaps.platformHeight / 16);

	// Starting position for the tiles
	var heightPos = 0;
	var widthPos = 0;

	// Initialise an array for all the points
	var squarePoints = [];

	// Self calling loop for finding all of the tiles on the display
	(function loop(i) {
		var squarePoint = {
			y: heightPos,
			x: widthPos,
			latitude: (((heightPos + (dimension / 2)) - (map.rect.height) / 2) * (-map.region.latitudeDelta / (map.rect.height)) + map.region.latitude),
			longitude: (((widthPos + (dimension / 2)) - (map.rect.width) / 2) * (map.region.longitudeDelta / (map.rect.width)) + map.region.longitude),
			incidents: 0
		}

		squarePoints.push(squarePoint);

		--i;

		// Move the tile position to the next spot
		if((i % 9) === 0) {
			heightPos = heightPos + dimension;
			widthPos = 0;
		} else {
			widthPos = widthPos + dimension;
		}

		if(i) {
			loop(i);
		} else {
			done(squarePoints);
		}
	})(144);
}

/*******************************************************************************
 * Disable the UI, so it can't be used whilst waiting for an action to complete.
 ******************************************************************************/
function lockUI() {
	zoomIn.setEnabled(false);
	zoomOut.setEnabled(false);
	currentLocation.setEnabled(false);
	togglePolice.setEnabled(false);
	plotVanilla.setEnabled(false);
	plotPolice.setEnabled(false);
	loadMap.setEnabled(false);
	map.setEnabled(false);
}

/*******************************************************************************
 * Enables the UI again once the long action has complete.
 ******************************************************************************/
function unlockUI() {
	zoomIn.setEnabled(true);
	zoomOut.setEnabled(true);
	currentLocation.setEnabled(true);
	togglePolice.setEnabled(true);
	plotVanilla.setEnabled(true);
	plotPolice.setEnabled(true);
	loadMap.setEnabled(true);
	map.setEnabled(true);
}
