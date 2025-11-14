/**
 * Calculate distance between two geographical points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Calculate estimated travel time based on distance and travel mode
 * @param distance Distance in kilometers
 * @param mode Travel mode ('walking', 'driving', 'emergency')
 * @returns Estimated time in minutes
 */
export function calculateTravelTime(distance: number, mode: 'walking' | 'driving' | 'emergency' = 'driving'): number {
  const speedKmPerHour = {
    walking: 5,
    driving: 50,
    emergency: 80 // Emergency vehicles with sirens
  };

  const speed = speedKmPerHour[mode];
  return Math.round((distance / speed) * 60);
}

/**
 * Format travel time for display
 * @param minutes Travel time in minutes
 * @returns Formatted time string
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

/**
 * Get nearest location from a list of locations
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param locations Array of locations with lat/lng properties
 * @returns Nearest location and distance
 */
export function getNearestLocation<T extends { lat: number; lng: number }>(
  currentLat: number,
  currentLon: number,
  locations: T[]
): { location: T; distance: number } | null {
  if (locations.length === 0) return null;

  let nearest = locations[0];
  let minDistance = calculateDistance(currentLat, currentLon, nearest.lat, nearest.lng);

  for (let i = 1; i < locations.length; i++) {
    const distance = calculateDistance(currentLat, currentLon, locations[i].lat, locations[i].lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = locations[i];
    }
  }

  return { location: nearest, distance: minDistance };
}

/**
 * Sort locations by distance from a point
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param locations Array of locations to sort
 * @returns Locations sorted by distance (nearest first)
 */
export function sortLocationsByDistance<T extends { lat: number; lng: number }>(
  currentLat: number,
  currentLon: number,
  locations: T[]
): Array<T & { distance: number }> {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(currentLat, currentLon, location.lat, location.lng)
    }))
    .sort((a, b) => a.distance - b.distance);
}