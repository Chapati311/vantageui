import { useState } from 'react';
import { BellIcon, MoonIcon, WifiIcon } from '../../components/glyphs';
import { Row, SearchField, Section, Toggle } from '../../components/kit';

const CITIES = ['Zurich', 'Tokyo', 'New York', 'London'];

/** Search field, sections and every kind of row. */
export function KitLists() {
  const [query, setQuery] = useState('');
  const [wifi, setWifi] = useState(true);
  const [quiet, setQuiet] = useState(false);
  const [cities, setCities] = useState(CITIES);

  const shown = cities.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <SearchField value={query} onChange={setQuery} placeholder="Search cities" />

      <Section label="Swipe left to delete" note={shown.length ? undefined : 'No city matches your search.'}>
        {shown.map((city) => (
          <Row key={city} title={city} onDelete={() => setCities((list) => list.filter((name) => name !== city))} />
        ))}
      </Section>

      <Section label="Rows">
        <Row title="Title only" />
        <Row title="With a detail" detail="A second, quieter line" />
        <Row title="With a value" value="On" />
        <Row icon={<BellIcon />} title="With an icon" value="3" onPress={() => undefined} />
        <Row title="Opens a page" onPress={() => undefined} />
      </Section>

      <Section label="Controls in rows" note="A Toggle on the right replaces the chevron.">
        <Row icon={<WifiIcon />} title="Toggle on" trailing={<Toggle label="Toggle on" on={wifi} onChange={setWifi} />} />
        <Row icon={<MoonIcon />} title="Toggle off" trailing={<Toggle label="Toggle off" on={quiet} onChange={setQuiet} />} />
        <Row title="Disabled" detail="Can't be changed right now" disabled trailing={<Toggle label="Disabled" on={false} onChange={() => undefined} disabled />} />
      </Section>

      <Section label="Destructive">
        <Row title="Restore all cities" onPress={() => setCities(CITIES)} />
        <Row title="Delete all cities" destructive onPress={() => setCities([])} />
      </Section>

      <Section label="Search field states" card={false}>
        <SearchField value="" onChange={() => undefined} placeholder="Empty" />
        <SearchField value="Typed text" onChange={() => undefined} placeholder="Filled" />
        <SearchField value="" onChange={() => undefined} placeholder="Disabled" disabled />
      </Section>
    </>
  );
}
