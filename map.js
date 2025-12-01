function waitForLeaflet(callback) {
  if (typeof L !== "undefined") {
    callback();
  } else {
    setTimeout(() => waitForLeaflet(callback), 50);
  }
}

waitForLeaflet(() => {

document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("zipForm")
const resultsList = document.getElementById("resultsList");
let map, markersLayer;

form.addEventListener("submit", async function(event) {
    event.preventDefault();
    const zip = document.getElementById("zipcode").value;
    const coord = await geocodeZip(zip);

    if (coord) {
        console.log("Geocoded coordinates:", coord);
        initMap(coord);
        searchNearby(coord);
    } else {
        alert("Invalid ZIP code. Please try again.");
    }
});

// Geocode ZIP code to get latitude and longitude
async function geocodeZip(zip) {
    const url = `https://nominatim.openstreetmap.org/search?q=${zip}&countrycodes=us&format=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }   
}

// Initialize or update the map
function initMap(coords) {
  if (!map) {
    map = L.map('map').setView([coords.lat, coords.lon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  } else {
    map.setView([coords.lat, coords.lon], 12);
    markersLayer.clearLayers();
  }
}

// Search for mental health resources using Overpass API
async function searchNearby(coords) {
  const { lat, lon } = coords; // <-- fixed destructuring
  const radius = 40234; // 25 miles in meters
  const query = `
    [out:json][timeout:25];
    (
      node["healthcare"](around:${radius},${lat},${lon});
      node["amenity"="clinic"](around:${radius},${lat},${lon});
      node["amenity"="doctors"](around:${radius},${lat},${lon});
    );
    out center;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Overpass results:", data.elements);
    displayResults(data.elements);
  } catch (err) {
    console.error("Overpass API error:", err);
    alert("Error fetching resources. Please try again later.")
  }
}

// Display results on map and as a list
function displayResults(elements) {
  resultsList.innerHTML = '';
  markersLayer.clearLayers();

  let count = 0;

  if (elements.length === 0) {
    resultsList.innerHTML = '<li>No resources found within 25 miles.</li>';
    return;
  }

  elements.forEach(function(el) {
        let lat, lon;

        if (el.type === 'node') {
            lat = el.lat;
            lon = el.lon;
        } else if (el.type === 'way' && el.center) {
            lat = el.center.lat;
            lon = el.center.lon;
        } else {
            return; // skip if coordinates not available
        }

        const name = (el.tags && el.tags.name) ? el.tags.name : 'Unnamed Facility';
        const address = (el.tags && (el.tags['addr:full'] || el.tags['addr:street'])) ? (el.tags['addr:full'] || el.tags['addr:street']) : '';

        // Filter for mental health facilities
        let isMentalHealth = false;
        if (el.tags) {
            if (el.tags.healthcare && /psychology|psychiatry|psychotherapist|counsellor|counseling/i.test(el.tags.healthcare)) {
                isMentalHealth = true;
            } else if (el.tags.office === 'psychologist') {
                isMentalHealth = true;
            } else if (el.tags.speciality && /psychology|psychiatry/i.test(el.tags.speciality)) {
                isMentalHealth = true;
            }
        }

        if (!isMentalHealth) return; // skip unrelated entries

        // Add marker
        L.marker([lat, lon]).addTo(markersLayer)
            .bindPopup('<b>' + name + '</b><br>' + address);

        // Add to list
        const li = document.createElement('li');
        li.textContent = name + ' - ' + address;
        resultsList.appendChild(li);

        count++;
    });

    if (count === 0) {
        const li = document.createElement('li');
        li.textContent = 'No mental health resources found within 25 miles.';
        resultsList.appendChild(li);
    }
  }
});
});