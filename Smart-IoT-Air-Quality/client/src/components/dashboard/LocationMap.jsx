import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function LocationMap() {
  const position = [26.8467, 80.9462]; // Lucknow

  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4 className="mb-3">Sensor Location</h4>

        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "250px", width: "50%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={position}>
            <Popup>
              Smart Air Quality Sensor <br />
              Lucknow
            </Popup>
          </Marker>

        </MapContainer>

      </div>
    </div>
  );
}

export default LocationMap;