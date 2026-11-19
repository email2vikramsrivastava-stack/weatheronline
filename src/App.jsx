import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, MapPin, LocateFixed, Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, Droplets, Wind, Sunrise, Sunset, ChevronDown, LoaderCircle, ThermometerSun, Umbrella, Compass } from 'lucide-react'

const codeInfo = (code) => {
  if (code === 0) return ['Clear sky', Sun]
  if ([1, 2].includes(code)) return ['Mostly sunny', CloudSun]
  if (code === 3) return ['Overcast', Cloud]
  if ([45, 48].includes(code)) return ['Foggy', CloudFog]
  if ([51, 53, 55, 56, 57].includes(code)) return ['Drizzle', CloudDrizzle]
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['Rain showers', CloudRain]
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['Snow', CloudSnow]
  if ([95, 96, 99].includes(code)) return ['Thunderstorms', CloudLightning]
  return ['Partly cloudy', CloudSun]
}
const weekday = (date, options = { weekday: 'short' }) => new Intl.DateTimeFormat(undefined, options).format(new Date(`${date}T12:00:00`))
const dateLong = (date) => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
const localTime = (iso, timezone) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(iso))

function App() {
  const [place, setPlace] = useState({ name: 'Amsterdam', admin: 'North Holland', country: 'Netherlands', lat: 52.3676, lon: 4.9041, timezone: 'Europe/Amsterdam' })
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [unit, setUnit] = useState('celsius')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)
  const debounce = useRef(null)
  const symbol = unit === 'celsius' ? '°' : '°'
  const tempValue = (n) => Math.round(unit === 'celsius' ? n : (n * 9 / 5) + 32)
  const unitLetter = unit === 'celsius' ? 'C' : 'F'

  const loadWeather = useCallback(async (target) => {
    setLoading(true); setError(''); setResults([]); setQuery('')
    try {
      const params = new URLSearchParams({ latitude: target.lat, longitude: target.lon, daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max', current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m', timezone: target.timezone || 'auto', forecast_days: '10', temperature_unit: 'celsius', wind_speed_unit: 'kmh' })
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      if (!response.ok) throw new Error('Weather data is unavailable right now. Please try again.')
      const data = await response.json()
      setWeather(data)
    } catch (e) { setError(e.message || 'Could not load the forecast. Please check your connection.') }
    finally { setLoading(false) }
  }, [unit])

  useEffect(() => { loadWeather(place) }, [place, loadWeather])
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    setSuggestLoading(true)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`)
        const data = await res.json(); setResults(data.results || [])
      } catch { setResults([]) }
      finally { setSuggestLoading(false) }
    }, 300)
    return () => clearTimeout(debounce.current)
  }, [query])

  const choosePlace = (p) => {
    setPlace({ name: p.name, admin: p.admin1 || '', country: p.country || '', lat: p.latitude, lon: p.longitude, timezone: p.timezone || 'auto' })
    setSearching(false)
  }
  const useLocation = () => {
    if (!navigator.geolocation) { setError('Location is not available in this browser.'); return }
    setLoading(true); setError('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=en&format=json`)
        const d = await r.json(); const p = d.results?.[0]
        setPlace({ name: p?.name || 'Your location', admin: p?.admin1 || '', country: p?.country || '', lat: coords.latitude, lon: coords.longitude, timezone: p?.timezone || 'auto' })
      } catch { setPlace({ name: 'Your location', admin: '', country: '', lat: coords.latitude, lon: coords.longitude, timezone: 'auto' }) }
    }, () => { setLoading(false); setError('Location permission was unavailable. Search for a city instead.') }, { timeout: 10000, maximumAge: 300000 })
  }
  const submitSearch = (e) => { e.preventDefault(); if (results[0]) choosePlace(results[0]) }
  const selectClass = 'weather-icon'
  const current = weather?.current
  const daily = weather?.daily
  const [summary, SummaryIcon] = current ? codeInfo(current.weather_code) : ['Loading', Sun]
  const visibleDays = daily ? daily.time.slice(0, expanded ? 10 : 5).map((date, i) => ({ date, code: daily.weather_code[i], hi: daily.temperature_2m_max[i], lo: daily.temperature_2m_min[i], rain: daily.precipitation_probability_max[i], wind: daily.wind_speed_10m_max[i], uv: daily.uv_index_max[i], sunrise: daily.sunrise[i], sunset: daily.sunset[i] })) : []
  const high = daily ? Math.max(...daily.temperature_2m_max.slice(0, 10)) : 0
  const low = daily ? Math.min(...daily.temperature_2m_min.slice(0, 10)) : 0

  return <main className="page-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Skylight home"><span className="brand-mark"><Sun size={19} strokeWidth={2.3}/></span><span>sky<span className="brand-light">light</span></span></a>
      <div className="topbar-right">
        <div className="unit-toggle" aria-label="Temperature units"><button className={unit === 'celsius' ? 'active' : ''} onClick={() => setUnit('celsius')}>°C</button><button className={unit === 'fahrenheit' ? 'active' : ''} onClick={() => setUnit('fahrenheit')}>°F</button></div>
        <button className="location-button" onClick={useLocation}><LocateFixed size={16}/> <span>Use my location</span></button>
      </div>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> YOUR DAILY FORECAST</div><h1>Weather, made<br/><span>clear.</span></h1><p>Find your kind of day, wherever you are.</p></div>
      <div className="search-wrap">
        <form className="search-box" onSubmit={submitSearch}><Search size={19} className="search-icon"/><input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setSearching(true)} placeholder="Search any city…" aria-label="Search any city"/><button type="submit" aria-label="Search"><span>Search</span><Search size={17}/></button></form>
        {searching && query.trim().length >= 2 && <div className="suggestions">
          {suggestLoading && <div className="suggestion-message"><LoaderCircle size={16} className="spin"/> Finding places…</div>}
          {!suggestLoading && results.length === 0 && <div className="suggestion-message">No cities found. Try another name.</div>}
          {!suggestLoading && results.map((r, i) => <button className="suggestion" key={`${r.id}-${i}`} onClick={() => choosePlace(r)}><MapPin size={16}/><span className="suggest-name">{r.name}</span><span className="suggest-detail">{[r.admin1, r.country].filter(Boolean).join(', ')}</span></button>)}
        </div>}
      </div>
    </section>

    <div className="content-area">
      {error && <div className="error-banner">{error}<button onClick={() => loadWeather(place)}>Try again</button></div>}
      <section className="today-layout">
        <div className="today-main card">
          <div className="today-heading"><div><div className="section-kicker">RIGHT NOW</div><h2>{place.name}</h2><div className="place-detail">{[place.admin, place.country].filter(Boolean).join(', ')}</div></div><div className="place-pin"><MapPin size={17}/></div></div>
          {loading ? <div className="loading-state"><LoaderCircle className="spin" size={26}/><span>Finding your forecast…</span></div> : current && <>
            <div className="current-weather"><div className="temperature">{tempValue(current.temperature_2m)}<span>{symbol}{unitLetter}</span></div><div className="condition"><div className="condition-icon"><SummaryIcon size={39} strokeWidth={1.6}/></div><div><strong>{summary}</strong><span>Feels like {tempValue(current.apparent_temperature)}°</span></div></div></div>
            <div className="today-range"><span>Today's range</span><strong>{tempValue(daily.temperature_2m_min[0])}° <i/> {tempValue(daily.temperature_2m_max[0])}°</strong><div className="range-track"><span style={{left: `${((daily.temperature_2m_min[0]-low)/(high-low || 1))*100}%`, width: `${((daily.temperature_2m_max[0]-daily.temperature_2m_min[0])/(high-low || 1))*100}%`}}/></div></div>
            <div className="updated"><span className="live-dot"/> Updated {localTime(current.time, weather.timezone)} local time</div>
          </>}
        </div>
        <div className="conditions-card card"><div className="section-kicker">AT A GLANCE</div><h3>Today's conditions</h3><div className="condition-grid">
          <div className="condition-stat"><div className="stat-icon peach"><ThermometerSun size={18}/></div><div><span>Feels like</span><strong>{current ? `${tempValue(current.apparent_temperature)}°` : '—'}</strong></div></div>
          <div className="condition-stat"><div className="stat-icon blue"><Droplets size={18}/></div><div><span>Humidity</span><strong>{current ? `${current.relative_humidity_2m}%` : '—'}</strong></div></div>
          <div className="condition-stat"><div className="stat-icon violet"><Wind size={18}/></div><div><span>Wind</span><strong>{current ? `${Math.round(current.wind_speed_10m)} <small>km/h</small>` : '—'}</strong></div></div>
          <div className="condition-stat"><div className="stat-icon yellow"><Umbrella size={18}/></div><div><span>Rain chance</span><strong>{daily ? `${daily.precipitation_probability_max[0]}%` : '—'}</strong></div></div>
        </div><div className="sun-times"><div><Sunrise size={17}/><span>Sunrise</span><strong>{daily ? localTime(daily.sunrise[0], weather.timezone) : '—'}</strong></div><div><Sunset size={17}/><span>Sunset</span><strong>{daily ? localTime(daily.sunset[0], weather.timezone) : '—'}</strong></div></div></div>
      </section>

      <section className="forecast-section"><div className="forecast-heading"><div><div className="section-kicker">LOOKING AHEAD</div><h2>10-day forecast</h2></div><button className="forecast-link" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'View 10 days'} <ChevronDown size={16} className={expanded ? 'flipped' : ''}/></button></div>
        <div className="forecast-card card"><div className="forecast-table-head"><span>DAY</span><span>CONDITIONS</span><span>TEMPERATURE</span><span>RAIN</span></div>
          {loading && <div className="forecast-loading"><LoaderCircle className="spin" size={20}/> Loading your 10-day outlook…</div>}
          {!loading && visibleDays.map((d, i) => { const [label, Icon] = codeInfo(d.code); return <div className={`forecast-row ${i === 0 ? 'today-row' : ''}`} key={d.date}><div className="day-name"><strong>{i === 0 ? 'Today' : weekday(d.date)}</strong><span>{i === 0 ? dateLong(d.date) : weekday(d.date, { month: 'short', day: 'numeric' })}</span></div><div className="day-condition"><span className={`mini-weather ${d.code === 0 || d.code === 1 ? 'sunny' : ''}`}><Icon size={20}/></span><span>{label}</span></div><div className="temp-range"><span>{tempValue(d.lo)}°</span><div className="range-track"><span style={{left: `${((d.lo-low)/(high-low || 1))*100}%`, width: `${((d.hi-d.lo)/(high-low || 1))*100}%`}}/></div><strong>{tempValue(d.hi)}°</strong></div><div className="rain-chance"><Droplets size={15}/><span>{d.rain ?? 0}%</span></div></div> })}
          {!loading && <div className="forecast-note"><Compass size={15}/> Daily high and low temperatures · Rain chance is the maximum expected during the day</div>}
        </div>
      </section>
      <footer><span>Made for wherever the day takes you.</span><span>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span></footer>
    </div>
    {searching && <button className="click-away" aria-label="Close search suggestions" onClick={() => setSearching(false)}/>}
  </main>
}
export default App

