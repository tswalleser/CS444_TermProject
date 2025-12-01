const form = document.getElementById("zipForm")
const resultsList = document.getElementById("results")
let map, markersLayer;

form.addEventListener("submit", async function(event) {
    event.preventDefault();
    const zip = document.getElementById("zipcode").value;
    const coord = await geocodeZip(zip);

    if (coord) {
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
    [out:json];
    (
      node["healthcare"~"psychology|psychiatry|psychotherapist|counselling"](around:${radius},${lat},${lon});
      node["amenity"="clinic"](around:${radius},${lat},${lon});
      node["office"="psychologist"](around:${radius},${lat},${lon});
    );
    out center;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    displayResults(data.elements);
  } catch (err) {
    console.error(err);
  }
}

// Display results on map and as a list
function displayResults(elements) {
  resultsList.innerHTML = '';
  markersLayer.clearLayers();

  if (elements.length === 0) {
    resultsList.innerHTML = '<li>No resources found within 25 miles.</li>';
    return;
  }

  elements.forEach(el => {
    const lat = el.lat;
    const lon = el.lon;
    const name = el.tags.name || 'Unnamed Facility';
    const address = el.tags['addr:full'] || el.tags['addr:street'] || '';

    // Add marker
    const marker = L.marker([lat, lon]).addTo(markersLayer);
    marker.bindPopup(`<b>${name}</b><br>${address}`);

    // Add to list
    const li = document.createElement('li');
    li.textContent = `${name} - ${address}`;
    resultsList.appendChild(li);
  });
}
