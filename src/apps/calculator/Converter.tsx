import { useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { Button, EmptyState } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { CURRENCIES, convertCurrency, useRates, type Currency } from '../../system/currency';
import { UNIT_KINDS, convertValue, unitName } from '../../system/units';
import { format } from './calculator';
import styles from './Calculator.module.css';

const KINDS = [...UNIT_KINDS, { id: 'currency', name: 'Money', units: [...CURRENCIES] as string[] }];

/** A row of chips to pick one unit. */
function UnitPicker({
  label,
  units,
  value,
  onChange,
}: {
  label: string;
  units: string[];
  value: string;
  onChange: (unit: string) => void;
}) {
  return (
    <div className={styles.unitRow} role="radiogroup" aria-label={label}>
      <span className="label">{label}</span>
      <div className={styles.units}>
        {units.map((unit) => (
          <Pressable
            key={unit}
            role="radio"
            aria-checked={unit === value}
            className={`${styles.unit} ${unit === value ? styles.unitOn : ''}`}
            onClick={() => onChange(unit)}
          >
            {unitName(unit)}
          </Pressable>
        ))}
      </div>
    </div>
  );
}

/**
 * Converts the number on the calculator's display: length, weight, volume,
 * speed, temperature and money (ECB rates, saved for offline use).
 */
export function Converter({ value, onUse }: { value: number; onUse: (value: string) => void }) {
  const [kind, setKind] = useState('length');
  const units = KINDS.find((item) => item.id === kind)!.units;
  const [from, setFrom] = useState<Record<string, string>>({
    length: 'km',
    mass: 'kg',
    volume: 'l',
    speed: 'km/h',
    temp: 'c',
    currency: 'CHF',
  });
  const [to, setTo] = useState<Record<string, string>>({
    length: 'mi',
    mass: 'lb',
    volume: 'gal',
    speed: 'mph',
    temp: 'f',
    currency: 'EUR',
  });
  const rates = useRates();

  const result =
    kind === 'currency'
      ? convertCurrency(value, from[kind] as Currency, to[kind] as Currency, rates.data)
      : convertValue(value, from[kind], to[kind]);
  // Money in cents; everything else to 8 significant digits
  const shown =
    result === null ? '--' : kind === 'currency' ? (Math.round(result * 100) / 100).toFixed(2) : format(Number(result.toPrecision(8)));

  return (
    <div className={styles.converter}>
      <div className={styles.kinds}>
        {KINDS.map((item) => (
          <Pressable key={item.id} className={`${styles.unit} ${item.id === kind ? styles.unitOn : ''}`} onClick={() => setKind(item.id)}>
            {item.name}
          </Pressable>
        ))}
      </div>

      <div className={styles.result}>
        <span className="label">
          {format(value)} {unitName(from[kind])} =
        </span>
        <DotNumber value={shown} size={shown.replace(/[^0-9]/g, '').length > 6 ? 28 : 40} instant />
        <span className="label">{unitName(to[kind])}</span>
      </div>

      {kind === 'currency' && !rates.data ? (
        <EmptyState
          kind={rates.status === 'loading' ? 'loading' : 'error'}
          title={rates.status === 'loading' ? 'Getting rates' : 'No rates yet'}
          message="Exchange rates need the internet once. After that they work offline."
        />
      ) : (
        <>
          <UnitPicker label="From" units={units} value={from[kind]} onChange={(unit) => setFrom({ ...from, [kind]: unit })} />
          <UnitPicker label="To" units={units} value={to[kind]} onChange={(unit) => setTo({ ...to, [kind]: unit })} />
          {kind === 'currency' && rates.data && <p className={styles.note}>European Central Bank rates from {rates.data.date}.</p>}
        </>
      )}

      <div className={styles.converterButtons}>
        <Button
          onPress={() => {
            setFrom({ ...from, [kind]: to[kind] });
            setTo({ ...to, [kind]: from[kind] });
          }}
        >
          Swap
        </Button>
        <Button kind="primary" disabled={result === null} onPress={() => onUse(shown)}>
          Use result
        </Button>
      </div>
    </div>
  );
}
