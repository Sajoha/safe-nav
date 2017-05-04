package main

import (
	"database/sql"
	"fmt"
	"github.com/antonholmquist/jason"
	_ "github.com/go-sql-driver/mysql"
	"log"
	"net/http"
	"os"
	"strconv"
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

	incidentAverage := 0

	nodeCount := 0

	// Get all the ways within the bounding box
	response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];way(53.619325,-1.874757,53.666338,-1.714106);out;") // Map of Huddersfield
	// response := httpReq("http://192.168.0.17/api/interpreter?data=[out:json];way(53.781598,-1.589220,53.816793,-1.507249);out;") // Map of Leeds

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
			// incidentCount := contactPolice(lat, long)
			incidentCount := db(lat, long)

			incidentAverage = incidentAverage + incidentCount

			nodeCount++

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

	var overallAverage float64 = float64(incidentAverage) / float64(nodeCount)

	log.Printf("Writing output to file...\n")
	for _, way := range ways {
		for index, _ := range way.Nodes {
			if index != (len(way.Nodes) - 1) {
				currentNode := way.Nodes[index]
				nextNode := way.Nodes[index+1]
				var average float64 = (float64(currentNode.incidents) + float64(nextNode.incidents)) / 2
				speedSetting := getSpeed(overallAverage, average)
				fmt.Fprintf(file, "%v,%v,%v\n", currentNode.id, nextNode.id, speedSetting)
			}
		}
	}

	file.Close()

	log.Printf("Average Police recorded incidents for region: %v", (incidentAverage / nodeCount))

	// Display the time take to complete
	log.Printf("Update took: %s\n", time.Since(start))
}

/*******************************************************************************
* Since coordinates for a node aren't returned in the way method, they have
* to be polled individually from the Overpass API. It takes the node id as an
* input, them appends it to the URL. Once retrieved the JSON is parsed and
* the latitude and longitude extracted.
*******************************************************************************/
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

/*******************************************************************************
* A function for allowing calls to the Overpass API, which then parses the
* response into JSON and returns it. Takes in a pre-defined URL for the http
* request.
*******************************************************************************/
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

/*******************************************************************************
* A function for contacting the Poice API. Takes a latitude and longitude in,
* then works out the date from four months ago before passing the request to
* the API. The four months is necessary since this tends to be how up to date
* the database is.
*******************************************************************************/
func contactPolice(lat, long string) int {

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

/*******************************************************************************
* Alternative to using the online Police API, instead this queries a MySQL
* database containg data downloaded from the Police database. Faster method than
* the leaky bucket API.
*******************************************************************************/
func db(lat, long string) int {

	// Open a connection to the database
	db, err := sql.Open("mysql", "shaig:iBxDaYD8VH^cZDLPZ7U%gmqa@tcp(192.168.0.18:3306)/police")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Convert the latitude to a float
	floatLatitude, err := strconv.ParseFloat(lat, 64)
	if err != nil {
		log.Printf("Error converting latitude: %v", err)
	}

	// Convert the longitude to float
	floatLongitude, err := strconv.ParseFloat(long, 64)
	if err != nil {
		log.Printf("Error converting longitude: %v", err)
	}

	// Reduce each ccordinate to two decimal figures
	latitude := fmt.Sprintf("%.2f", floatLatitude)
	longitude := fmt.Sprintf("%.2f", floatLongitude)

	// Query the database for the amount of incidents near the new broader coordinates
	query := fmt.Sprintf("SELECT COUNT(*) FROM uk_police WHERE Latitude LIKE '%%%v%%' AND Longitude LIKE '%%%v%%'", latitude, longitude)
	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Error on database query: ", err)
	}
	defer rows.Close()

	// Initialise count as 0
	count := 0

	// Iterate over the rows
	for rows.Next() {
		err := rows.Scan(&count)
		if err != nil {
			log.Printf("Error on iterating over rows: ", err)
		}
	}

	// Check the rows for errors
	err = rows.Err()
	if err != nil {
		log.Printf("Error with rows: ", err)
	}

	// Return the number of incidents
	return count
}

/*******************************************************************************
* A formula for deciding what the new speed value for a way is, fluctuates
* depending on how far away the incident count is from the average for the
* region.
*******************************************************************************/
func getSpeed(overallAverage, average float64) int {
	if average <= (overallAverage * 0.70) {
		return 50
	} else if average <= (overallAverage * 0.85) {
		return 40
	} else if average <= (overallAverage * 1.00) {
		return 30
	} else if average <= (overallAverage * 1.25) {
		return 20
	} else {
		return 10
	}
}
