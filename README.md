# Safe Nav

## Overview

### Application

This application is designed to allow an end user to find the fastest route between two points. The user can drop two pins on a map, and then a route is retrieved between the two points using the OSRM Backend service. This is drawn onto the map, whilst checking each instruction point against the UK Police database. The route is colour coded based on how much each step varies from the average crime incident count, allowing for more dangerous areas on the route to be visually seen. A heat map can also be created, visually showing the crime layout for the current map view.

### Scraper

The scraper is a GoLang tool, it first queries the Overpass API to get all the ways within a predefined bounding box. The coordinates for each node making up the way are then put through the Police database to get an incident count. Once all the incidents have been collected, a speed value is generated depending on how far the node varies from the average of the region collected, then an update.csv file is created in the appropriate format to push to the OSRM Backend server to update the map around the crime data.

## Development Tools

The application is coded in JavaScript, and built using the Appcelerator Titanium product. Designed for use on iPhone and Android phone devices.

- [Appcelerator Studio](http://www.appcelerator.com/mobile-app-development-products)

## API Usage

This project relies on three APIs; OSRM Backend, Overpass and the UK Police crime database. OSRM provides the fastest route utilising the current dataset it has to the application. Overpass is used for finding all of the ways in a certain bounding box. The Police API is used for getting all of the incidents near to a given latitude and longitude.

The OSRM Backend and Overpass API were both hosted locally on a Ubuntu server for running this project.

- [OSRM Backend](http://project-osrm.org)
- [Overpass API](http://overpass-api.de)
- [UK Police API](https://data.police.uk)

## GoLang Packages

A few GoLang tools were also used for handling MySQL data and parsing JSON response, they can be found below.

- [Go-MySQL-Driver](https://github.com/go-sql-driver/mysql)
- [Jason the JSON Parser](github.com/antonholmquist/jason)
