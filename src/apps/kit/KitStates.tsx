import { NotesIcon } from '../../system/appIcons';
import { EmptyState, Section } from '../../components/kit';
import styles from './Kit.module.css';

/** The three states every app needs: empty, loading and error. */
export function KitStates() {
  return (
    <>
      <Section label="Empty" card={false}>
        <div className={styles.stateBox}>
          <EmptyState icon={NotesIcon} title="No notes" message="Your notes will show up here." action={{ label: 'New note', onPress: () => undefined }} />
        </div>
      </Section>
      <Section label="Loading" card={false}>
        <div className={styles.stateBox}>
          <EmptyState kind="loading" title="Loading" message="Getting the forecast." />
        </div>
      </Section>
      <Section label="Error" card={false}>
        <div className={styles.stateBox}>
          <EmptyState kind="error" title="No connection" message="Check your internet and try again." action={{ label: 'Try again', onPress: () => undefined }} />
        </div>
      </Section>
    </>
  );
}
