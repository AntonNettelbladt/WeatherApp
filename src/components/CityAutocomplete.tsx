import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { searchCities, type CitySuggestion } from '@/services/weatherApi'
import { cn } from '@/lib/utils'

interface CityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (city: CitySuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a city...',
  className,
  disabled,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | undefined>()

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Don't search if input is too short or empty
    if (value.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    // Debounce the API call
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(value, 5)
      setSuggestions(results)
      setIsOpen(results.length > 0)
      setSelectedIndex(-1)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSelect = (city: CitySuggestion) => {
    onChange(`${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`)
    onSelect(city)
    setIsOpen(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const getCityDisplayName = (city: CitySuggestion) => {
    return `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.country}-${city.lat}-${city.lon}`}
              type="button"
              onClick={() => handleSelect(city)}
              className={cn(
                'w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors',
                index === selectedIndex && 'bg-accent text-accent-foreground'
              )}
            >
              <div className="font-medium">{city.name}</div>
              <div className="text-sm text-muted-foreground">
                {city.state ? `${city.state}, ` : ''}
                {city.country}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

