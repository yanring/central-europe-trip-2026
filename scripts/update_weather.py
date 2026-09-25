"""Refresh the itinerary's weather snapshot from Open-Meteo; rebuild HTML separately."""
import json
import math
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'guide-data.json'
data = json.loads(path.read_text())
weather = data['weather']
locations = list(weather['locations'].items())
variables = {
    'weather_code': ('code', 'wmo code'),
    'temperature_2m_max': ('highC', '°C'),
    'temperature_2m_min': ('lowC', '°C'),
    'precipitation_probability_max': ('precipitationProbabilityPct', '%'),
    'precipitation_sum': ('precipitationMm', 'mm'),
    'wind_speed_10m_max': ('windMaxMs', 'km/h'),
    'wind_gusts_10m_max': ('gustMaxMs', 'km/h'),
}
params = {
    'latitude': ','.join(str(loc['latitude']) for _, loc in locations),
    'longitude': ','.join(str(loc['longitude']) for _, loc in locations),
    'daily': ','.join(variables),
    'timezone': 'auto',
    'forecast_days': 16,
}
url = 'https://api.open-meteo.com/v1/forecast?' + urllib.parse.urlencode(params)
request = urllib.request.Request(url, headers={
    'User-Agent': 'CentralEuropeGuide/1.0 (https://github.com/yanring/central-europe-trip-2026)',
})
with urllib.request.urlopen(request, timeout=45) as response:
    forecasts = json.load(response)
assert isinstance(forecasts, list) and len(forecasts) == len(locations)
fetched_at = datetime.now(timezone.utc)
available = 0
for (key, loc), forecast in zip(locations, forecasts):
    assert forecast['timezone'] == loc['timezone'], key
    assert abs(forecast['latitude'] - loc['latitude']) < 0.15, key
    assert abs(forecast['longitude'] - loc['longitude']) < 0.15, key
    daily, units = forecast['daily'], forecast['daily_units']
    assert len(set(daily['time'])) == len(daily['time'])
    for variable, (_, expected_unit) in variables.items():
        assert units[variable] == expected_unit, (key, variable, units[variable])
        assert len(daily[variable]) == len(daily['time']), (key, variable)
    needed = [day['date'] for day in data['days'] if any(stop['id'] == key for stop in day['weatherLocations'])]
    loc['forecasts'] = {}
    for date in needed:
        if date not in daily['time']:
            continue
        i = daily['time'].index(date)
        values = {}
        for variable, (field, _) in variables.items():
            value = daily[variable][i]
            assert value is None or (isinstance(value, (int, float)) and math.isfinite(value))
            values[field] = round(value / 3.6, 1) if value is not None and field in ('windMaxMs', 'gustMaxMs') else value
        if values['highC'] is None or values['lowC'] is None:
            continue
        assert values['lowC'] <= values['highC']
        assert values['precipitationProbabilityPct'] is None or 0 <= values['precipitationProbabilityPct'] <= 100
        for field in ('precipitationMm', 'windMaxMs', 'gustMaxMs'):
            assert values[field] is None or values[field] >= 0
        values['leadDays'] = (datetime.fromisoformat(date).date() - fetched_at.astimezone(ZoneInfo(loc['timezone'])).date()).days
        loc['forecasts'][date] = values
        available += 1
    loc['elevationMeters'] = forecast.get('elevation')
    single_params = {**params, 'latitude': loc['latitude'], 'longitude': loc['longitude'], 'timezone': loc['timezone']}
    loc['forecastUrl'] = 'https://api.open-meteo.com/v1/forecast?' + urllib.parse.urlencode(single_params)
assert available > 0, 'No itinerary dates are within the current forecast; preserving the previous snapshot.'
weather['fetchedAt'] = fetched_at.isoformat(timespec='seconds')
weather['queryUrl'] = url
temporary = path.with_suffix('.json.tmp')
temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
temporary.replace(path)
print(f'Updated {available} date/location forecasts from Open-Meteo at {weather["fetchedAt"]}.')
