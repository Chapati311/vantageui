import { useState } from 'react';
import { AppShell, Button, EmptyState } from '../../components/kit';
import { VantageIcon } from '../../system/appIcons';
import { runAction } from '../../system/actions';
import { offerImport } from '../../vantage/bridge';
import { getLockIn } from './lockInStore';
import { getSessions } from './lockInStats';

/**
 * Once Vantage is connected, focus, grades, school and stats live there.
 * Lock In's data stays on the phone; this offers to send it to Vantage
 * (which saves it to your account when you're signed in).
 */
export function MovedToVantage({ onStay }: { onStay: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <AppShell title="Focus" fixed>
      <EmptyState
        icon={VantageIcon}
        title="Now in Vantage"
        message={
          sent
            ? 'Your focus data was sent. Vantage keeps it once you sign in there.'
            : 'Focus, grades, homework and stats moved into Vantage. Your focus data is still on this phone.'
        }
        action={{
          label: sent ? 'Open Vantage' : 'Send my data to Vantage',
          onPress: () => {
            if (sent) {
              void runAction('app.open', { appId: 'vantage' });
              return;
            }
            offerImport('lockin', { lockIn: getLockIn(), sessions: getSessions() });
            setSent(true);
          },
        }}
      />
      <Button onPress={onStay}>Keep using Focus here</Button>
    </AppShell>
  );
}
