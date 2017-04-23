package main

// TODO: Remove fatal incidents on err in favour of proper error handling

// TODO: Make month dynamic for Police API call

// TODO: Find out how timeouts work in http calls

import (
	"fmt"
	"github.com/antonholmquist/jason"
	"log"
	"net/http"
	"time"
)

func main() {
	// Start the timer
	start := time.Now()

	// A struct for storing all the information we need per node
	type Node struct {
		id        string
		latitude  string
		longitude string
		incidents int
	}

	// A struct for holding information on each edge
	type Way struct {
		id    string
		Nodes []Node
	}

	// An array to encompass all of the way objects
	var ways []Way

	// Get all the ways within the bounding box
	response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];way(53.638207,-1.795287,53.653141,-1.753599);out;")

	// Get all of the ways within the return and iterate over them
	elements, _ := response.GetObjectArray("elements")
	for count, way := range elements {
		// An update on progress
		fmt.Printf("%v of %v...\n", (count + 1), len(elements))

		// Create a way object to hold this instance of way
		wayID, _ := way.GetNumber("id")
		tempWay := Way{
			id:    string(wayID),
			Nodes: []Node{},
		}

		// Extract the nodes tied to this way
		nodes, _ := way.GetNumberArray("nodes")

		// Get the first and the last node
		arr := [...]string{string(nodes[0]), string(nodes[len(nodes)-1])}

		for _, node := range arr {
			// Call the Overpass API to get the coordinates of the node
			lat, long := getCoords(node)

			// Call the Police API to get the incidents that have occured near the node
			incidentCount := contactPolice(lat, long)

			// Create a node object to contain the data, and append it to our way object
			tempNode := Node{
				id:        node,
				latitude:  lat,
				longitude: long,
				incidents: incidentCount,
			}
			tempWay.Nodes = append(tempWay.Nodes, tempNode)
		}

		// Add the temporary way into the list
		ways = append(ways, tempWay)
	}

	// Display the time take to complete
	fmt.Printf("Update took: %s", time.Since(start))
}

/******************************************************************************
* Since coordinates for a node aren't returned in the way method, they have
* to be polled individually from the Overpass API. It takes the node id as an
* input, them appends it to the URL. Once retrieved the JSON is parsed and
* the latitude and longitude extracted.
******************************************************************************/
func getCoords(node string) (string, string) {
	// Initialise variables
	var lat string = ""
	var long string = ""

	// Make the API call
	response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];node(" + node + ");out;")

	// Get the elements from within the response
	coords, _ := response.GetObjectArray("elements")
	for _, properties := range coords {
		// Extract the latitude and longitude from the JSON
		latitude, _ := properties.GetNumber("lat")
		longitude, _ := properties.GetNumber("lon")
		lat = string(latitude)
		long = string(longitude)
	}

	// Return the latitude and longitude of the node
	return lat, long
}

/******************************************************************************
* A function for allowing calls to the Overpass API, which then parses the
* response into JSON and returns it. Takes in a pre-defined URL for the http
* request.
******************************************************************************/
func httpReq(request string) *jason.Object {
	// Make a call to the Overpass API to get an individual nodes details
	resp, err := http.Get(request)
	if err != nil {
		log.Fatal(err)
	}

	// Parse the http response into readable JSON
	response, err := jason.NewObjectFromReader(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	// Close the connection
	resp.Body.Close()

	// Return the response
	return response
}

/******************************************************************************
* A function for contacting the Poice API. Takes a latitude and longitude in,
* then works out the date from three months ago before passing the request to
* the API. The three months is necessary since this tends to be how up to date
* the database is.
******************************************************************************/
func contactPolice(lat string, long string) int {
	// FIXME: Make this dynamic
	month := "2017-01"

	// Request a crime report from the given node
	resp, err := http.Get("https://data.police.uk/api/crimes-street/all-crime?lat=" + lat + "&lng=" + long + "&date=" + month)
	if err != nil {
		log.Fatal(err)
	}

	// Parse the http response into readable JSON
	response, err := jason.NewValueFromReader(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	// Close the connection
	resp.Body.Close()

	// Extract a usable array from the JSON Array
	array, err := response.Array()
	if err != nil {
		log.Fatal(err)
	}

	// Timeout to abide by the 15 requests per second usage policy
	time.Sleep(67 * time.Millisecond)

	// Return the number of incidents
	return len(array)
}
