import { useMemo, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, CopyIcon } from '../../components/glyphs';
import { AppShell, Row, Section } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { setNetrunnerTool } from '../netrunner/netrunnerNav';
import { CATEGORIES, GUIDES, type Guide, type GuideCategory } from './guides';
import styles from './Guide.module.css';

const openSileo = (id: string) => (window.location.href = `sileo://package/${id}`);

/**
 * Field Guide: how to do network and device things with this jailbroken
 * iPhone - what to install (straight into Sileo), the exact commands, and the
 * Netrunner tool that does it in one tap. Own networks and devices only.
 */
export function GuideApp() {
  const [open, setOpen] = useState<Guide | null>(null);
  const [category, setCategory] = useState<GuideCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(
    () =>
      GUIDES.filter((g) => category === 'all' || g.category === category).filter(
        (g) => !query.trim() || `${g.title} ${g.summary} ${g.needs.map((n) => n.name).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [category, query],
  );

  if (open) return <GuidePage guide={open} onBack={() => setOpen(null)} />;
  return (
    <AppShell title="Field Guide">
      <input className={styles.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: ssh, scan, files, bluetooth…" aria-label="Search guides" />
      <div className={styles.chips} role="tablist" aria-label="Topics">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={category === c.id} className={styles.chip} onClick={() => setCategory(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {shown.map((guide) => (
          <Pressable key={guide.id} className={styles.card} onClick={() => setOpen(guide)}>
            <span className={styles.cardTitle}>{guide.title}</span>
            <span className={styles.cardSummary}>{guide.summary}</span>
            <span className={styles.cardNeeds}>{guide.needs.map((n) => n.name).join(' · ')}</span>
          </Pressable>
        ))}
        {shown.length === 0 && <p className={styles.note}>No guide for that yet.</p>}
      </div>
      <p className={styles.note}>Only for your own networks and devices, or ones you have permission to test.</p>
    </AppShell>
  );
}

function GuidePage({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(text);
    window.setTimeout(() => setCopied(null), 1200);
  };
  return (
    <AppShell
      title={guide.title}
      leading={
        <CircleButton small label="Back" onClick={onBack}>
          <BackIcon />
        </CircleButton>
      }
    >
      <p className={styles.lead}>{guide.summary}</p>
      {guide.netrunner && (
        <Pressable
          className={styles.doIt}
          onClick={() => {
            setNetrunnerTool(guide.netrunner!.tool);
            void runAction('app.open', { appId: 'netrunner' });
          }}
        >
          ▶ {guide.netrunner.label}
          <span>does it in one tap</span>
        </Pressable>
      )}
      <Section label="You need">
        {guide.needs.map((need) => (
          <Row
            key={need.name}
            title={need.name}
            detail={`${need.why}${need.where ? ` · ${need.where}` : ''}`}
            trailing={
              need.sileo ? (
                <button type="button" className={`${styles.install} hit-44`} onClick={() => openSileo(need.sileo!)}>
                  Install
                </button>
              ) : undefined
            }
          />
        ))}
      </Section>
      <Section label="Steps" card={false}>
        <ol className={styles.steps}>
          {guide.steps.map((step, i) => (
            <li key={i} className={styles.step}>
              {step.text && <p>{step.text}</p>}
              {step.command && (
                <button type="button" className={styles.command} onClick={() => copy(step.command!)} aria-label={`Copy: ${step.command}`}>
                  <span className={styles.where}>{step.on === 'laptop' ? 'laptop $' : 'iPhone $'}</span>
                  <code>{step.command}</code>
                  <span className={styles.copy}>{copied === step.command ? 'copied' : <CopyIcon />}</span>
                </button>
              )}
            </li>
          ))}
        </ol>
      </Section>
      {guide.notes && (
        <Section label="Good to know" card={false}>
          <ul className={styles.notes}>
            {guide.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>
      )}
      {guide.rules && <p className={styles.rules}>⚖ {guide.rules}</p>}
    </AppShell>
  );
}
