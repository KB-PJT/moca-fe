export interface Coordinates {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_METERS = 6371000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

// 두 좌표 사이의 직선 거리(하버사인 공식). 지도를 얼마나 옮겼는지 판단할 때 쓴다.
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const deltaLat = toRadians(b.latitude - a.latitude)
  const deltaLng = toRadians(b.longitude - a.longitude)
  const sinLat = Math.sin(deltaLat / 2)
  const sinLng = Math.sin(deltaLng / 2)

  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinLng * sinLng

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

export function requestCurrentPosition(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    )
  })
}
