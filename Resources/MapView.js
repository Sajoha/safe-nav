/**
 * @author Sam Haig
 */

var Map = require('ti.map');

function MapView() {
    var mapWin = Ti.UI.createWindow();

    // var mountainView = Map.createAnnotation({
    //     latitude: 37.390749,
    //     longitude: -122.081651,
    //     title: "Appcelerator Headquarters",
    //     subtitle: 'Mountain View, CA',
    //     pincolor: Map.ANNOTATION_RED,
    //     myid: 1 // Custom property to uniquely identify this annotation.
    // });

    var mapview = Map.createView({
        mapType: Map.NORMAL_TYPE,
        region: {
            latitude: 13.386624,
            longitude: 52.505366,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        },
        animate: true,
        regionFit: true,
        userLocation: true,
        annotations: []
    });

    mapWin.add(mapview);

    // Query the API server

    var url = 'https://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.385983,52.496891?steps=true'
    // var url = "http://192.168.0.39:5000/route/v1/driving/53.848611,-1.663822;53.870108,-1.727657?steps=true";

    // Parse the response
    var client = Ti.Network.createHTTPClient({
        onload: function(e) {
            var response = JSON.parse(this.responseText);
            var count = 0;
            for(var i = 0; i < response.routes[0].legs[0].steps.length; i++) {
                for(var k = 0; k < response.routes[0].legs[0].steps[i].intersections.length; k++) {
                    Ti.API.info(response.routes[0].legs[0].steps[i].intersections[k].location[0] + ',' + response.routes[0].legs[0].steps[i].intersections[k].location[1]);
                    mapview.addAnnotation(Map.createAnnotation({
                        latitude: response.routes[0].legs[0].steps[i].intersections[k].location[0],
                        longitude: response.routes[0].legs[0].steps[i].intersections[k].location[1],
                        title: count,
                        subtitle: 'Mountain View, CA',
                        pincolor: Map.ANNOTATION_RED,
                        myid: count // Custom property to uniquely identify this annotation.
                    }));
                    count++;
                }
            }
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

    mapWin.open();
};

module.exports = MapView;
