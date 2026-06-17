export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

export function roundMoney(value: number): number {
  return Math.round(value / 50) * 50;
}

export function roundScore(value: number): number {
  return Number(value.toFixed(4));
}

export function inverseScore(value: number, maxUsefulValue: number): number {
  if (maxUsefulValue <= 0) {
    return 0;
  }
  return clamp(1 - value / maxUsefulValue);
}

export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
