package main

// TODO: Remove fatal incidents on err in favout of proper error handling

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
	start := time.Now()
	type Node struct {
		id        string
		latitude  string
		longitude string
		incidents int
	}

	type Way struct {
		id    string
		Nodes []Node
	}

	var ways []Way
	// Get all the ways within the bounding box
	response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];way(53.638207,-1.795287,53.653141,-1.753599);out;")

	elements, _ := response.GetObjectArray("elements")
	for count, way := range elements {
		fmt.Printf("%v of %v...\n", (count + 1), len(elements))
		wayID, _ := way.GetNumber("id")
		tempWay := Way{
			id:    string(wayID),
			Nodes: []Node{},
		}
		nodes, _ := way.GetNumberArray("nodes")
		arr := [...]string{string(nodes[0]), string(nodes[len(nodes)-1])}
		for _, node := range arr {
			lat, long := getCoords(node)
			incidentCount := contactPolice(lat, long)
			tempNode := Node{
				id:        node,
				latitude:  lat,
				longitude: long,
				incidents: incidentCount,
			}
			tempWay.Nodes = append(tempWay.Nodes, tempNode)
		}
		ways = append(ways, tempWay)
	}
	fmt.Println(ways)
	elapsed := time.Since(start)
	fmt.Printf("Update took: %s", elapsed)
}

func getCoords(node string) (string, string) {
	// Initialise variables
	var lat string = ""
	var long string = ""

	// Make the API call
	response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];node(" + node + ");out;")

	// Get the elements from within the response
	coords, _ := response.GetObjectArray("elements")
	for _, properties := range coords {
		latitude, _ := properties.GetNumber("lat")
		longitude, _ := properties.GetNumber("lon")
		lat = string(latitude)
		long = string(longitude)
	}

	// Return the latitude and longitude of the node
	return lat, long
}

func contactPolice(lat string, long string) int {
	// Will make this dynamic
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

	// Timeout to abide by the 15 requests per second policy
	time.Sleep(67 * time.Millisecond)

	// Return the number of incidents
	return len(array)
}

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
