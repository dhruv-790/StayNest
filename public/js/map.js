const mapDiv = document.getElementById("map");

if (mapDiv) {

const listing = JSON.parse(mapDiv.dataset.listing);
const mapToken = mapDiv.dataset.token;

const coordinates = listing.geometry.coordinates;

// create map
const map = L.map("map").setView(
    [coordinates[1], coordinates[0]],
    13
);

// Geoapify tiles
L.tileLayer(
"https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=" + mapToken,
{
    maxZoom: 20
}).addTo(map);

// RED MARKER ICON
const redIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

// marker
L.marker([coordinates[1], coordinates[0]], { icon: redIcon })
.addTo(map)
.bindPopup(`<b>${listing.title}</b><br>${listing.location}`)
.openPopup();

}