import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { Icon } from '../../components/Icon';
import { AppShell, Button, EmptyState, Row, SearchField, Section } from '../../components/kit';
import { showOnMap } from '../../system/nativeBridge';
import { useOnline } from '../../system/useOnline';
import { WEATHER_PLACE } from '../../system/weather';
import styles from './Maps.module.css';

interface Place {
  name: string;
  detail: string;
  lat: number;
  lon: number;
}

function LocateIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="7" />
    </Icon>
  );
}

/** Search places with OpenStreetMap's free search (Nominatim). */
async function searchPlaces(query: string): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Search failed');
  const results = (await response.json()) as { display_name: string; lat: string; lon: string; name?: string }[];
  return results.map((result) => {
    const [first, ...rest] = result.display_name.split(', ');
    return { name: result.name || first, detail: rest.slice(0, 3).join(', '), lat: Number(result.lat), lon: Number(result.lon) };
  });
}

/**
 * Maps: OpenStreetMap through MapLibre, tinted to the theme. Search a
 * place, see where you are, and hand off to Apple Maps for directions.
 */
export function MapsApp() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const online = useOnline();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [picked, setPicked] = useState<Place | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!container.current || !online) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [WEATHER_PLACE.longitude, WEATHER_PLACE.latitude],
      zoom: 12,
      attributionControl: { compact: true },
      dragRotate: false,
    });
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [online]);

  const show = (place: Place) => {
    setPicked(place);
    setResults(null);
    map.current?.flyTo({ center: [place.lon, place.lat], zoom: 14 });
    marker.current?.remove();
    const element = document.createElement('span');
    element.className = styles.pin;
    if (map.current) marker.current = new maplibregl.Marker({ element }).setLngLat([place.lon, place.lat]).addTo(map.current);
  };

  const locate = () => {
    if (!navigator.geolocation) return setStatus("This device can't tell where it is.");
    setStatus('Finding you');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStatus(null);
        show({ name: 'You are here', detail: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`, lat: coords.latitude, lon: coords.longitude });
      },
      () => setStatus('Location was not allowed.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (!online) {
    return (
      <AppShell title="Maps" fixed>
        <EmptyState kind="error" title="Offline" message="Maps need the internet to load." />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Maps"
      fixed
      trailing={
        <CircleButton small label="Where am I" onClick={locate}>
          <LocateIcon />
        </CircleButton>
      }
      header={
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value);
              if (!value.trim()) setResults(null);
            }}
            onSubmit={(value) => {
              if (!value.trim()) return;
              setStatus('Searching');
              searchPlaces(value)
                .then((places) => {
                  setResults(places);
                  setStatus(places.length ? null : 'Nothing found');
                })
                .catch(() => setStatus("Search didn't work. Try again."));
            }}
            placeholder="Search a place"
          />
      }
    >
      <div className={styles.mapBox}>
        <div ref={container} className={styles.map} />
        {results && results.length > 0 && (
          <div className={styles.results}>
            <Section>
              {results.map((place) => (
                <Row key={`${place.lat},${place.lon}`} title={place.name} detail={place.detail} onPress={() => show(place)} />
              ))}
            </Section>
          </div>
        )}
        {status && <span className={`label ${styles.status}`}>{status}</span>}
      </div>
      {picked && (
        <div className={styles.card}>
          <div className={styles.cardText}>
            <span className={styles.cardName}>{picked.name}</span>
            <span className={styles.cardDetail}>{picked.detail}</span>
          </div>
          <Button onPress={() => showOnMap(picked.name === 'You are here' ? `${picked.lat},${picked.lon}` : `${picked.name} ${picked.detail}`)}>Directions</Button>
        </div>
      )}
    </AppShell>
  );
}
