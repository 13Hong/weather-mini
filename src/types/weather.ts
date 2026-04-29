// 城市数据类型
export interface City {
  name: string
  adcode: string
}

// 实时天气数据类型
export interface LiveWeather {
  weather: string
  temperature: string
  winddirection: string
  windpower: string
  humidity: string
}

// 天气预报数据类型
export interface ForecastWeather {
  date: string
  week: string
  weather: string
  temperature: string
  nightTemp: string
  dayTemp: string
  nightWeather: string
  dayWind: string
  dayPower: string
}

// 高德 API 实时天气响应 - lives 是数组
export interface AmapLiveWeatherData {
  province: string
  city: string
  adcode: string
  weather: string
  temperature: string
  winddirection: string
  windpower: string
  humidity: string
  reportTime: string
}

export interface AmapLiveWeatherResponse {
  status: string
  count: string
  info: string
  infocode: string
  lives: AmapLiveWeatherData[]
}

// 高德 API weatherInfo 统一响应
export interface AmapWeatherInfoResponse {
  status: string
  count: string
  info: string
  infocode: string
  lives: AmapLiveWeatherData[]
  forecasts?: {
    city: string
    adcode: string
    reportTime: string
    casts: AmapForecastData[]
  }[]
}

// 高德 API 天气预报响应（字段名与API返回一致）
export interface AmapForecastData {
  date: string
  week: string
  dayweather: string
  nightweather: string
  daytemp: string
  nighttemp: string
  daytemp_float: string
  nighttemp_float: string
  daywind: string
  nightwind: string
  daypower: string
  nightpower: string
}

export interface AmapForecastResponse {
  status: string
  count: string
  info: string
  infocode: string
  forecasts: {
    city: string
    adcode: string
    reportTime: string
    casts: AmapForecastData[]
  }[]
}

// 统一 API 响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

// 天气页面综合数据
export interface WeatherData {
  city: City
  live: LiveWeather
  forecast: ForecastWeather[]
}
