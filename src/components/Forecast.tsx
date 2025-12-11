import { Card, CardContent } from '@/components/ui/card'
import { type ForecastItem } from '@/services/weatherApi'

interface ForecastProps {
  forecastItems: ForecastItem[]
}

export function Forecast({ forecastItems }: ForecastProps) {
  // Group forecast items by date (using YYYY-MM-DD as key for consistency)
  const groupedByDate = forecastItems.reduce((acc, item) => {
    const date = new Date(item.dt * 1000)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
    
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(item)
    return acc
  }, {} as Record<string, ForecastItem[]>)

  // Get one forecast per day (use the one closest to 12 PM or the first one)
  const dailyForecasts = Object.entries(groupedByDate)
    .sort(([a], [b]) => a.localeCompare(b)) // Sort by date
    .map(([dateKey, items]) => {
      // Find the forecast closest to noon, or use the first one
      const noonForecast = items.find(item => {
        const hour = new Date(item.dt * 1000).getHours()
        return hour >= 11 && hour <= 14
      })
      
      const forecast = noonForecast || items[Math.floor(items.length / 2)] || items[0]
      
      // Calculate min/max temps for the day
      const temps = items.map(item => item.main.temp)
      const minTemp = Math.min(...temps)
      const maxTemp = Math.max(...temps)
      
      // Format date for display
      const date = new Date(dateKey)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const forecastDate = new Date(date)
      forecastDate.setHours(0, 0, 0, 0)
      
      let displayDate = ''
      if (forecastDate.getTime() === today.getTime()) {
        displayDate = 'Today'
      } else if (forecastDate.getTime() === tomorrow.getTime()) {
        displayDate = 'Tomorrow'
      } else {
        displayDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      }
      
      return {
        date: dateKey,
        displayDate,
        forecast,
        minTemp,
        maxTemp,
        allItems: items,
      }
    })
    .slice(0, 5) // Limit to 5 days

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDay = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <div className="space-y-4">
      {/* Daily Forecast */}
      <div>
        <h3 className="text-xl font-semibold mb-4">5-Day Forecast</h3>
        <div className="space-y-2">
          {dailyForecasts.map((day, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-24">
                      <div className="font-semibold">
                        {day.displayDate}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {day.forecast.dt_txt.split(' ')[0].split('-').slice(1).join('/')}
                      </div>
                    </div>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.forecast.weather[0].icon}.png`}
                      alt={day.forecast.weather[0].description}
                      className="w-12 h-12"
                    />
                    <div className="flex-1">
                      <div className="capitalize text-sm text-muted-foreground">
                        {day.forecast.weather[0].description}
                      </div>
                      <div className="text-xs text-muted-foreground/80 mt-1">
                        Humidity: {day.forecast.main.humidity}% | Wind: {day.forecast.wind.speed.toFixed(1)} m/s
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {Math.round(day.maxTemp)}°C
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(day.minTemp)}°C
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hourly Forecast for Next 24 Hours */}
      <div>
        <h3 className="text-xl font-semibold mb-4">24-Hour Forecast</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {forecastItems.slice(0, 8).map((item, index) => (
              <Card key={index} className="min-w-[120px]">
                <CardContent className="p-3 text-center">
                  <div className="text-sm font-medium mb-2">
                    {formatDay(item.dt)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {formatTime(item.dt)}
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                    alt={item.weather[0].description}
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <div className="font-semibold text-lg">
                    {Math.round(item.main.temp)}°C
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.weather[0].main}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

