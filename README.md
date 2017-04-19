# The Application

## Overview

The purpose of this application, is to allow end users to plot the fastest route from A to B, but also allow it to be the safest route between the two points.

## Development

The application is coded in JavaScript, and built using the Appcelerator Titanium product. Designed for use on iPhone and Android phone devices.

- [Appcelerator Studio](http://www.appcelerator.com/mobile-app-development-products)

## API Usage

The two APIs in use for this application are the OSRM backend service, and the UK Police database. The fastest route is created using a locally hosted OSRM backend server, then using the instruction coordinates from each step of the journey, a danger factor is calculated from the Police database. Note that this second step is slow due to a 15 request per second limit when using the Police database.

- [OSRM Backend](http://project-osrm.org)
- [UK Police API](https://data.police.uk)
