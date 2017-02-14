/**
* Plotting page
* 
* This is the page where the user will give the destinations that
* they want to go between. They will be presented with two text boxes
* where they can give a route start and finish address.
*/

// Create the route window
var routeWin = Ti.UI.createWindow({
	
});

// Route view, where all the UI elements are contained
var routeView = Ti.UI.createView({
	layout: 'vertical',
	backgroundColor: '#349CC2',
	height: Ti.UI.FILL,
	width: Ti.UI.FILL
});
routeWin.add(routeView);

// Page title
var titleLbl = Ti.UI.createLabel({
	text: 'Hello world',
	color: '#EDA60F',
	top: '25dp',
	center: 'horizontal'
});
routeView.add(titleLbl);

// From label
var fromLbl = Ti.UI.createLabel({
	text: 'Start Point:',
	color: '#EDA60F',
	top: '10%',
	left: '5%'
});
routeView.add(fromLbl);

// The starting address of the route
var fromTxt = Ti.UI.createTextField({
	borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	width: '90%',
	top: '1%'
});
routeView.add(fromTxt);

// To label
var toLbl = Ti.UI.createLabel({
	text: 'End Point:',
	color: '#EDA60F',
	top: '5%',
	left: '5%'
});
routeView.add(toLbl);

// The end address of the route
var toTxt = Ti.UI.createTextField({
	borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	width: '90%',
	top: '1%'
});
routeView.add(toTxt);

// The activation button for the page
var goBtn = Ti.UI.createButton({
	title: 'Plot Route!',
	color: '#349CC2',
	backgroundColor: '#EDA60F',
	width: '90%',
	top: '20%'
});
routeView.add(goBtn);

goBtn.addEventListener('click', function(e) {
	var map = require('map.js');
});

// Start the current page
routeWin.open();
