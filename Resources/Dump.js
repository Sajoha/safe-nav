// Get the current date
var today = new Date();

// Go back 3 months to the latest Police record
today.setMonth(today.getMonth() - 3);

// Create a string of YYYY-DD format for the API URL.
var month = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2);

// Street ID, temporarily hardcoded!
var street = "1276660";

// Query the police database for events
var url = "https://data.police.uk/api/crimes-at-location?date=" + month + "&location_id=" + street;

// Query the API server
var client = Ti.Network.createHTTPClient({
    onload: function(e) {
        Ti.API.info("Anti-social behaviour: " + (this.responseText.match(/anti-social-behaviour/g) || []).length);
        Ti.API.info("Bicycle theft: " + (this.responseText.match(/bicycle-theft/g) || []).length);
        Ti.API.info("Burglary: " + (this.responseText.match(/burglary/g) || []).length);
        Ti.API.info("Criminal damage and arson: " + (this.responseText.match(/criminal-damage-arson/g) || []).length);
        Ti.API.info("Drugs: " + (this.responseText.match(/drugs/g) || []).length);
        Ti.API.info("Other theft: " + (this.responseText.match(/other-theft/g) || []).length);
        Ti.API.info("Possession of weapons: " + (this.responseText.match(/possession-of-weapons/g) || []).length);
        Ti.API.info("Public order: " + (this.responseText.match(/public-order/g) || []).length);
        Ti.API.info("Robbery: " + (this.responseText.match(/robbery/g) || []).length);
        Ti.API.info("Shoplifting: " + (this.responseText.match(/shoplifting/g) || []).length);
        Ti.API.info("Theft from the person: " + (this.responseText.match(/theft-from-the-person/g) || []).length);
        Ti.API.info("Vehicle crime: " + (this.responseText.match(/vehicle-crime/g) || []).length);
        Ti.API.info("Violence and sexual offences: " + (this.responseText.match(/violent-crime/g) || []).length);
        Ti.API.info("Other crime: " + (this.responseText.match(/other-crime/g) || []).length);
    },
    onerror: function(e) {
        Ti.API.debug(e.error);
        alert('Cannot reach Police database!');
    },
    timeout: 5000
});

// Prepare the connection.
client.open("GET", url);

// Send the request.
client.send();
