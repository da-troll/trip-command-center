import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTrip } from '../../context'
import type { Route } from '../../types'

// Fix Leaflet default icon issue with Vite by using custom SVG DivIcons
function makeIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z" fill="${color}" stroke="#0A0C10" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="white" opacity="0.9"/>
  </svg>`
  return L.divIcon({
    html: svg,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
    className: '',
  })
}

function DestinationIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 23 15 23s15-11.75 15-23C30 6.716 23.284 0 15 0z" fill="#F0F6FF" stroke="#0A0C10" stroke-width="1.5"/>
    <circle cx="15" cy="15" r="5" fill="#238636"/>
  </svg>`
  return L.divIcon({
    html: svg,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38],
    className: '',
  })
}

// Component to auto-fit map bounds
function BoundsAdjuster({ routes }: { routes: Route[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current) return
    const all = routes.flatMap(r => r.waypoints.map(w => [w.lat, w.lng] as [number, number]))
    if (all.length > 0) {
      map.fitBounds(all, { padding: [40, 40] })
      fitted.current = true
    }
  }, [map, routes])

  return null
}

export function Routes() {
  const { state } = useTrip()
  const { routes, groups } = state

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]))

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-3 shrink-0">
        <h2 className="text-base font-semibold text-ops-text mb-0.5">Routes</h2>
        <p className="text-xs text-ops-muted">Convergence map — all crews on one view.</p>
      </div>

      {/* Legend */}
      <div className="px-6 pb-3 flex flex-wrap gap-3 shrink-0">
        {routes.map(route => {
          const group = groupMap[route.groupId]
          return (
            <div key={route.id} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: route.color }} />
              <span className="text-xs text-ops-muted">{group?.emoji} {route.label}</span>
              {route.departureTime && (
                <span className="text-[10px] text-ops-border">
                  departs {new Date(route.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Map */}
      <div className="flex-1 mx-6 mb-6 rounded-lg overflow-hidden border border-ops-border min-h-0" style={{ minHeight: 400 }}>
        <MapContainer
          center={[38.5, -119.5]}
          zoom={6}
          style={{ height: '100%', width: '100%', background: '#0A0C10' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          <BoundsAdjuster routes={routes} />

          {routes.map(route => {
            const positions = route.waypoints.map(w => [w.lat, w.lng] as [number, number])
            const icon = makeIcon(route.color)
            const destIcon = DestinationIcon()

            return (
              <span key={route.id}>
                <Polyline
                  positions={positions}
                  pathOptions={{ color: route.color, weight: 2.5, opacity: 0.85, dashArray: '6 4' }}
                />
                {route.waypoints.map((wp, idx) => {
                  const isLast = idx === route.waypoints.length - 1
                  const useIcon = isLast ? destIcon : icon
                  return (
                    <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={useIcon}>
                      <Popup>
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                          <strong>{wp.label}</strong>
                          {wp.note && <div style={{ color: '#888', marginTop: 2 }}>{wp.note}</div>}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </span>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
