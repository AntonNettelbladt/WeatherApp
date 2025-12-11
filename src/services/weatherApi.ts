// OpenWeatherMap API service
// Get your free API key from https://openweathermap.org/api

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || ''
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

export interface WeatherData {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  coord: {
    lat: number
    lon: number
  }
}

export interface WeatherError {
  message: string
  cod?: string
}

export interface CitySuggestion {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

export interface ForecastItem {
  dt: number
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
    temp_min: number
    temp_max: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  dt_txt: string
}

export interface ForecastData {
  list: ForecastItem[]
  city: {
    name: string
    country: string
    coord: {
      lat: number
      lon: number
    }
  }
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const response = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  )
  
  if (!response.ok) {
    const error: WeatherError = await response.json()
    throw new Error(error.message || 'Failed to fetch weather data')
  }
  
  return response.json()
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const response = await fetch(
    `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  )
  
  if (!response.ok) {
    const error: WeatherError = await response.json()
    throw new Error(error.message || 'Failed to fetch weather data')
  }
  
  return response.json()
}

export async function getForecastByCoords(lat: number, lon: number): Promise<ForecastData> {
  const response = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  )
  
  if (!response.ok) {
    const error: WeatherError = await response.json()
    throw new Error(error.message || 'Failed to fetch forecast data')
  }
  
  return response.json()
}

export async function getForecastByCity(city: string): Promise<ForecastData> {
  const response = await fetch(
    `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  )
  
  if (!response.ok) {
    const error: WeatherError = await response.json()
    throw new Error(error.message || 'Failed to fetch forecast data')
  }
  
  return response.json()
}

export async function searchCities(query: string, limit: number = 5): Promise<CitySuggestion[]> {
  if (!query.trim() || query.length < 2) {
    return []
  }

  try {
    // Use OpenStreetMap Nominatim API (free, no API key required)
    // This is more reliable than OpenWeatherMap's geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'WeatherApp/1.0', // Required by Nominatim
        },
      }
    )
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    if (!Array.isArray(data)) {
      return []
    }
    
    return data
      .filter((item: any) => item.type === 'city' || item.type === 'town' || item.type === 'administrative')
      .slice(0, limit)
      .map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        country: item.address?.country || '',
        state: item.address?.state || item.address?.region || '',
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }))
  } catch (error) {
    console.error('Error fetching city suggestions:', error)
    return []
  }
}

