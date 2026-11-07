import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { geocodeSearch, selectCity, suggestCities } from '../services/api.js'
import MapView from '../components/MapView.jsx'
import { CityAssistantForm, CityAssistantHistory, useCityAssistant } from '../components/CityAssistant.jsx'

const DEBOUNCE_MS = 400
const MIN_CHARS = 3

export default function SearchPage({ visible = true }) {
  const { token } = useAuth()
  const assistant = useCityAssistant(token)
  const [city, setCity] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [active, setActive] = useState(-1)
  const skipNextFetch = useRef(false)

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    const q = city.trim()
    if (q.length < MIN_CHARS) {
      setSuggestions([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      suggestCities(q, token, controller.signal)
        .then(list => { setSuggestions(list); setActive(-1) })
        .catch(e => { if (e.name !== 'AbortError') setSuggestions([]) })
    }, DEBOUNCE_MS)
    return () => { clearTimeout(timer); controller.abort() }
  }, [city, token])

  const run = async (fn) => {
    setError('')
    setResult(null)
    setSuggestions([])
    setLoading(true)
    try {
      setResult(await fn())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const search = () => {
    if (!city.trim()) { setError('Enter a city name'); return }
    run(() => geocodeSearch(city, token))
  }

  const choose = (s) => {
    skipNextFetch.current = true
    setCity(s.label)
    run(() => selectCity(s, token))
  }

  const showAssistantCity = (name) => {
    if (city !== name) skipNextFetch.current = true
    setCity(name)
    run(() => geocodeSearch(name, token))
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      setActive(i => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault()
      setActive(i => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setSuggestions([])
    } else if (e.key === 'Enter') {
      if (active >= 0) choose(suggestions[active])
      else search()
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">City Geocoder</h1>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="min-w-0">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                className="w-full border p-2 rounded"
                placeholder="Enter city name"
                maxLength={120}
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-autocomplete="list"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={onKeyDown}
              />
              {suggestions.length > 0 && (
                <ul role="listbox" className="absolute z-[1000] left-0 right-0 bg-white border rounded shadow mt-1">
                  {suggestions.map((s, i) => (
                    <li
                      key={`${s.label}-${s.lat}-${s.lon}`}
                      role="option"
                      aria-selected={i === active}
                      className={`p-2 cursor-pointer ${i === active ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      onMouseDown={e => { e.preventDefault(); choose(s) }}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={search} disabled={loading} className="bg-blue-600 text-white px-4 rounded">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <CityAssistantForm assistant={assistant} />
          {result && (
            <div className="mt-6">
              <div className="bg-white p-4 rounded shadow mb-4">
                <p><strong>City:</strong> {result.display_name}</p>
                <p><strong>Lat:</strong> {result.lat}, <strong>Lon:</strong> {result.lon}</p>
                <p><strong>Country:</strong> {result.country || '-'}</p>
              </div>
              <MapView lat={result.lat} lon={result.lon} label={result.display_name} visible={visible} />
            </div>
          )}
        </div>
        <CityAssistantHistory assistant={assistant} onShowCity={showAssistantCity} searchLoading={loading} />
      </div>
    </div>
  )
}
