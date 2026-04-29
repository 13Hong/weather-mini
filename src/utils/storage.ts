import type { City } from "../types/weather";

const CITY_KEY = "weather_city";

export function getCachedCity(): City | null {
  const cityStr = uni.getStorageSync(CITY_KEY);
  if (!cityStr) return null;
  try {
    return JSON.parse(cityStr) as City;
  } catch {
    return null;
  }
}

export function setCachedCity(city: City): void {
  uni.setStorageSync(CITY_KEY, JSON.stringify(city));
}
