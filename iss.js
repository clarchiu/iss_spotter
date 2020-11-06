const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = function(callback) {
  // use request to fetch IP address from JSON API
  request('https://api64.ipify.org/?format=json', (err, res, body) => {
  // error can be set if invalid domain, user is offline, etc.
    if (err) return callback(err, null);

    // if non-200 status, assume server err
    if (res.statusCode !== 200) {
      const msg = `Status Code ${res.statusCode} when fetching IP. Response: ${body}`;
      return callback(Error(msg), null);
    }

    const ip = JSON.parse(body).ip;
    callback(null, ip);
  });
};

/**
 * Makes a single API request to retrieve geographical location (lat/lon) for the given ip address
 * @param {The ip address to query} ip 
 * @param {A callback fn to pass back an error or an object of resulting lat/lon pair } callback 
 * Returns (via Callback)
 *  - An error, if any (nullable)
 *  - The lat/lon pair as an object
 */
const fetchCoordsByIP = function(ip, callback) {
  request(`http://ip-api.com/json/${ip}`, (err, res, body) => {
    if (err) return callback(err, null);

    if (res.statusCode !== 200) {
      const msg = `Status Code ${res.statusCode} when fetching coordinates. Response: ${body}`;
      return callback(Error(msg), null);
    }

    const data = JSON.parse(body);
    if (data.status === 'fail') {
      return callback(Error(`Coordinates api returned status fail. Response: ${body}`), null);
    }

    callback(null, { lat: data.lat, lon: data.lon });
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  const URL = `http://api.open-notify.org/iss-pass.json?lat=${coords.lat}&lon=${coords.lon}&n=5`;
  request(URL, (err, res, body) => {
    if (err) return callback(err, null);

    if (res.statusCode !== 200) {
      const msg = `Status Code ${res.statusCode} when fetching iss data. Response: ${body}`;
      return callback(Error(msg), null);
    }

    const data = JSON.parse(body);
    if (data.message === 'failure') {
      return callback(Error(`ISS api returned status fail. Response: ${body}`), null);
    }

    callback(null, data.response);
  }); 
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results. 
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */ 
const nextISSTimesForMyLocation = function(callback) {
  // empty for now
  fetchMyIP((error, ip) => {
    if (error) return callback(err, null);

    fetchCoordsByIP(ip, (error, coords) => {
      if (error) return callback(err, null);

      fetchISSFlyOverTimes(coords, (error, issTimes) => {
        if (error) return callback(err, null);

        callback(null, issTimes);
      })
    });
  });
}

module.exports = { nextISSTimesForMyLocation };