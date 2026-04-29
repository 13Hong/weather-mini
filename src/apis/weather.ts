import { request } from "../utils/request";
import type {
  AmapWeatherInfoResponse,
  AmapForecastData,
  LiveWeather,
  ForecastWeather,
} from "../types/weather";

const AMAP_KEY = "your_api_key_here";
const AMAP_BASE_URL = "https://restapi.amap.com/v3";

export async function getLiveWeather(
  adcode: string
): Promise<{ success: boolean; data: LiveWeather | null; error: string | null }> {
  const url = `${AMAP_BASE_URL}/weather/weatherInfo`;
  const result = await request<AmapWeatherInfoResponse>({
    url,
    data: { key: AMAP_KEY, city: adcode, extensions: "base" },
  });

  if (!result.success || !result.data) {
    return { success: false, data: null, error: result.error };
  }

  const { status, lives, info } = result.data;
  if (status !== "1" || !lives || lives.length === 0) {
    return { success: false, data: null, error: info || "获取实时天气失败" };
  }

  const live = lives[0];
  return {
    success: true,
    data: {
      weather: live.weather,
      temperature: live.temperature,
      winddirection: live.winddirection,
      windpower: live.windpower,
      humidity: live.humidity,
    },
    error: null,
  };
}

export async function getForecast(
  adcode: string
): Promise<{ success: boolean; data: ForecastWeather[] | null; error: string | null }> {
  const url = `${AMAP_BASE_URL}/weather/weatherInfo`;
  const result = await request<AmapWeatherInfoResponse>({
    url,
    data: { key: AMAP_KEY, city: adcode, extensions: "all" },
  });

  if (!result.success || !result.data) {
    return { success: false, data: null, error: result.error };
  }

  const { status, forecasts, info } = result.data;
  if (status !== "1" || !forecasts || forecasts.length === 0) {
    return { success: false, data: null, error: info || "获取天气预报失败" };
  }

  const castData = forecasts[0].casts;
  const forecastList: ForecastWeather[] = castData.map((cast: AmapForecastData) => ({
    date: cast.date,
    week: weekMap[cast.week] || cast.week,
    weather: cast.dayweather,
    temperature: `${cast.nighttemp}~${cast.daytemp}°`,
    nightTemp: cast.nighttemp,
    dayTemp: cast.daytemp,
    nightWeather: cast.nightweather,
    dayWind: cast.daywind,
    dayPower: cast.daypower,
  }));

  return {
    success: true,
    data: forecastList,
    error: null,
  };
}

const weekMap: Record<string, string> = {
  "1": "周一",
  "2": "周二",
  "3": "周三",
  "4": "周四",
  "5": "周五",
  "6": "周六",
  "7": "周日",
};
