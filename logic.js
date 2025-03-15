let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
let tectonicplatesUrl  = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Create the 'street' tile layer as a second background of the map
let street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the 'gray' tile layer as a third background of the map
let grayscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
});
  
// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [36.7783, -119.4179], 
  zoom: 5
});

// Add the 'basemap' tile layer to the map.
basemap.addTo(map); 

// OPTIONAL: Step 2
// Create the layer groups, base maps, and overlays for our two sets of data, earthquakes and tectonic_plates.
// Add a control to the map that will allow the user to change which layers are visible.

// Create layer groups for earthquakes and tectonic plates
let earthquakeLayer = L.layerGroup(); 
let tectonicPlatesLayer = L.layerGroup();

// Create base maps object
let baseMaps = {
  "OpenTopoMap": basemap,
  "OpenStreetmap": street,
  "Grayscale": grayscale
};

// Create overlay maps object 
let overlayMaps = {
  "Earthquakes": earthquakeLayer, 
  "Tectonic Plates": tectonicPlatesLayer
};

// Add the layer control to the map
L.control.layers(baseMaps, overlayMaps, {
  collapsed: false // To keep the control expanded
}).addTo(map);

// Function to handle each feature 
function onEachFeature(feature, layer){
  layer.bindPopup(`Magnitude: ${feature.properties.mag}<br>Location: ${feature.properties.place}`);
}

// Make a request that retrieves the earthquake geoJSON data.
d3.json(queryUrl).then((data) => {
  // console log to check if data was received
  console.log(data);

  // This function returns the style data for each of the earthquakes we plot on the map.
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 0.6,
      fillColor: chooseColor(feature.properties.mag), // Pass magnitude to chooseColor
      color: "Red", 
      radius: getRadius(feature.geometry.coordinates[2]), // Pass depth to getRadius
      stroke: true,
      weight: 0.5
    };
  }

  // This function determines the color of the marker based on the depth of the earthquake.
  function chooseColor(magnitude) {
    if (magnitude > 5) return "red";
    else if (magnitude > 4) return "orange";
    else if (magnitude > 3) return "yellow";
    else if (magnitude > 2) return "light green";
    else return "green";
  }

  // This function determines the radius of the earthquake marker based on its magnitude.
  function getRadius(magnitude) {
    if (magnitude === 0) return 1; 
    return Math.min(magnitude * 4, 40); 
  }

  // Add a GeoJSON layer to the map once the file is loaded.
  L.geoJson(data, {
    pointToLayer: function(feature, latlng) {
      // Create a circle marker for each earthquake
      return L.circleMarker(latlng, styleInfo(feature)); 
    },

    // Set the style for each circleMarker using our styleInfo function.
    style: styleInfo,

    // Create a popup for each marker to display the magnitude and location of the earthquake after the marker has been created and styled
    onEachFeature: onEachFeature // Use the onEachFeature function defined earlier
  }).addTo(earthquakeLayer); // Add the GeoJSON data to the earthquake layer

  // OPTIONAL: Step 2
  // Add the data to the earthquake layer instead of directly to the map.
  earthquakeLayer.addTo(map);

  // Create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  // Then add all the details for the legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    // Initialize depth intervals and colors for the legend
    const grades = [0, 1, 2, 3, 4, 5]; 
    const colors = ["blue", "green", "yellow", "orange", "red"]; 

    // Loop through our depth intervals to generate a label with a colored square for each interval.
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
  };
  
  // Finally, add the legend to the map.
  legend.addTo(map);

 // OPTIONAL: Step 2
  // Make a request to get our Tectonic Plate geoJSON data.
  d3.json(tectonicplatesUrl).then(function (plateData) {
    console.log(plateData); 

    // Save the geoJSON data, along with style information, to the tectonic_plates layer.
    let tectonicPlates = L.geoJson(plateData, {
      style: {
        color: "orange", 
        weight: 2,       
        opacity: 0.7     
      }
    });

    // Then add the tectonic_plates layer to the map.
    tectonicPlates.addTo(tectonicPlatesLayer);
    tectonicPlatesLayer.addTo(map); // Add to the map
  });
});