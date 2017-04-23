package main

import (
	"fmt"
	"github.com/antonholmquist/jason"
	"log"
	"net/http"
	"os"
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
	// response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];way(53.649999,-1.790000,53.650141,-1.789599);out;")

	// Get all of the ways within the return and iterate over them
	elements, _ := response.GetObjectArray("elements")
	for count, way := range elements {

		// Create a way object to hold this instance of way
		wayID, _ := way.GetNumber("id")
		tempWay := Way{
			id:    string(wayID),
			Nodes: []Node{},
		}

		// Extract the nodes tied to this way
		nodes, _ := way.GetNumberArray("nodes")

		// An update on progress
		log.Printf("Checking %v of %v, contains %v nodes... ", (count + 1), len(elements), len(nodes))

		for _, node := range nodes {
			// Call the Overpass API to get the coordinates of the node
			lat, long := getCoords(string(node))

			// Call the Police API to get the incidents that have occured near the node
			incidentCount := contactPolice(lat, long)

			if incidentCount == 0 {
				log.Printf("Node %v failed...", string(node))
			}

			// Create a node object to contain the data, and append it to our way object
			tempNode := Node{
				id:        string(node),
				latitude:  lat,
				longitude: long,
				incidents: incidentCount,
			}
			tempWay.Nodes = append(tempWay.Nodes, tempNode)
		}

		// Add the temporary way into the list
		ways = append(ways, tempWay)
	}

	file, err := os.Create("update.csv")
	if err != nil {
		log.Printf("Error in file creation: %v", err)
	}

	log.Printf("Writing output to file...\n")
	for _, way := range ways {
		for index, _ := range way.Nodes {
			if index != (len(way.Nodes) - 1) {
				currentNode := way.Nodes[index]
				nextNode := way.Nodes[index+1]
				average := (currentNode.incidents + nextNode.incidents) / 2
				fmt.Fprintf(file, "%v, %v, 0, %v\n", currentNode.id, nextNode.id, average)
			}
		}
	}

	file.Close()

	// Display the time take to complete
	fmt.Printf("Update took: %s\n", time.Since(start))
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
		log.Printf("Error on HTTP request: %v", err)
	}

	// Parse the http response into readable JSON
	response, err := jason.NewObjectFromReader(resp.Body)
	if err != nil {
		log.Printf("Error parsing HTTP response: %v", err)
	}

	// Close the connection
	resp.Body.Close()

	// Return the response
	return response
}

/******************************************************************************
* A function for contacting the Poice API. Takes a latitude and longitude in,
* then works out the date from four months ago before passing the request to
* the API. The four months is necessary since this tends to be how up to date
* the database is.
******************************************************************************/
func contactPolice(lat string, long string) int {

	// Get the date in a YYYY-MM format to feed into the API call
	month := time.Now().AddDate(0, -4, 0).Format("2006-01")

	// Request a crime report from the given node
	resp, err := http.Get("https://data.police.uk/api/crimes-street/all-crime?lat=" + lat + "&lng=" + long + "&date=" + month)
	if err != nil {
		log.Printf("Error on Police HTTP request: %v", err)
	}

	// Parse the http response into readable JSON
	response, err := jason.NewValueFromReader(resp.Body)
	if err != nil {
		log.Printf("Error on parsing Police HTTP response: %v", err)
	}

	// Close the connection
	resp.Body.Close()

	// Extract a usable array from the JSON Array
	array, err := response.Array()
	if err != nil {
		log.Printf("Error converting to array: %v", err)
	}

	// Return the number of incidents
	return len(array)
}
