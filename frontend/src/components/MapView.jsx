import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

function Recenter({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], 11)
  }, [map, lat, lon])
  return null
}

export default function MapView({ lat, lon, label }) {
  return (
    <MapContainer center={[lat, lon]} zoom={11} className="h-72 w-full rounded shadow">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]} icon={icon}>
        <Popup>{label}</Popup>
      </Marker>
      <Recenter lat={lat} lon={lon} />
    </MapContainer>
  )
}
