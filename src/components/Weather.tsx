import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getWeatherByCoords, getForecastByCoords, type WeatherData, type ForecastData, type CitySuggestion } from '@/services/weatherApi'
import { CityAutocomplete } from '@/components/CityAutocomplete'
import { Forecast } from '@/components/Forecast'
import { MapPin, Loader2 } from 'lucide-react'

export function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingForecast, setLoadingForecast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('current')

  // Fetch forecast when weather data changes
  useEffect(() => {
    if (weatherData) {
      setLoadingForecast(true)
      getForecastByCoords(weatherData.coord.lat, weatherData.coord.lon)
        .then((forecast) => {
          setForecastData(forecast)
        })
        .catch((err) => {
          console.error('Failed to fetch forecast:', err)
          // Don't show error for forecast, just log it
        })
        .finally(() => {
          setLoadingForecast(false)
        })
    }
  }, [weatherData])

  // Request location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            setLocationAllowed(true)
            const data = await getWeatherByCoords(
              position.coords.latitude,
              position.coords.longitude
            )
            setWeatherData(data)
            setError(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch weather data')
          } finally {
            setLoading(false)
          }
        },
        (err) => {
          setLocationAllowed(false)
          setLoading(false)
          // Don't show error if user denied - they can search instead
          if (err.code !== err.PERMISSION_DENIED) {
            setError('Failed to get your location')
          }
        }
      )
    } else {
      setLocationAllowed(false)
      setError('Geolocation is not supported by your browser')
    }
  }, [])

  const handleCitySelect = async (city: CitySuggestion) => {
    setLoading(true)
    setError(null)
    setSearchQuery('')

    try {
      const data = await getWeatherByCoords(city.lat, city.lon)
      setWeatherData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationAllowed(true)
          const data = await getWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude
          )
          setWeatherData(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch weather data')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Please enable location access or search for a city.')
        } else {
          setError('Failed to get your location')
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Weather App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Form */}
            <div className="flex gap-2">
              <div className="flex-1">
                <CityAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSelect={handleCitySelect}
                  placeholder="Search for a city..."
                  disabled={loading}
                />
              </div>
              {locationAllowed === false && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseLocation}
                  disabled={loading}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use Location
                </Button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && !weatherData && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Weather Data */}
            {weatherData && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-2">{weatherData.name}</h2>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {weatherData.coord.lat.toFixed(2)}°, {weatherData.coord.lon.toFixed(2)}°
                    </span>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">Current</TabsTrigger>
                    <TabsTrigger value="forecast">Forecast</TabsTrigger>
                  </TabsList>

                  <TabsContent value="current" className="space-y-4 mt-4">
                    <div className="flex items-center justify-center gap-4 py-6">
                      <img
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                        alt={weatherData.weather[0].description}
                        className="w-24 h-24"
                      />
                      <div>
                        <div className="text-5xl font-bold">
                          {Math.round(weatherData.main.temp)}°C
                        </div>
                        <div className="text-xl text-muted-foreground capitalize">
                          {weatherData.weather[0].description}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Feels Like</div>
                        <div className="text-2xl font-semibold">
                          {Math.round(weatherData.main.feels_like)}°C
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Humidity</div>
                        <div className="text-2xl font-semibold">{weatherData.main.humidity}%</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Wind Speed</div>
                        <div className="text-2xl font-semibold">
                          {weatherData.wind.speed.toFixed(1)} m/s
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Pressure</div>
                        <div className="text-2xl font-semibold">{weatherData.main.pressure} hPa</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="forecast" className="mt-4">
                    {loadingForecast ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : forecastData ? (
                      <Forecast forecastItems={forecastData.list} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Forecast data unavailable</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Initial State - No data, no loading, no error */}
            {!loading && !weatherData && !error && locationAllowed === false && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">Search for a city to get weather information</p>
                <Button variant="outline" onClick={handleUseLocation}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

