import { useState } from 'react';
import { Button, Row, Section as KitSection } from '../../components/kit';
import { setAppleMusicToken, signInAppleMusic, useAppleMusic } from '../../system/appleMusic';
import { connectSpotify, disconnectSpotify, redirectUri, setSpotifyClientId, useSpotify } from '../../system/spotify';
import { hasRealControls } from '../../system/phoneControls';
import { getNativeApp } from '../../system/nativeApps';
import { openApp } from '../../system/nativeBridge';
import { Section, SettingsPage } from '../settings/SettingsPage';
import styles from '../settings/SettingsApp.module.css';

/** Connect Spotify and Apple Music for the music widgets. */
export function MusicPage({ onBack }: { onBack: () => void }) {
  const spotify = useSpotify();
  const apple = useAppleMusic();
  const [clientId, setClientId] = useState(spotify.clientId);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(spotify.error);

  const onPhone = hasRealControls();
  const spotifyApp = getNativeApp('com.spotify.client');
  return (
    <SettingsPage title="Music" onBack={onBack}>
      {onPhone && (
        <Section
          label="On this iPhone"
          note="No sign-in needed: Vantage shows and controls whatever plays in ANY app (Spotify, Apple Music, YouTube...) - song, artwork, play, pause, skip - straight from iOS. Start a song and it appears in the music widget and the control center."
        >
          <Button kind="primary" onPress={() => void openApp(spotifyApp ? 'com.spotify.client' : 'com.apple.Music')}>
            {spotifyApp ? 'Open Spotify' : 'Open Music'}
          </Button>
        </Section>
      )}
      <Section
        label={onPhone ? 'Spotify account (optional)' : 'Spotify'}
        note={
          message ??
          `Make a free app at developer.spotify.com, add ${redirectUri()} as a Redirect URI (exactly), then paste its Client ID here. Play and skip need Premium.`
        }
      >
        <KitSection>
          <Row title="Status" value={spotify.connected ? 'Connected' : 'Not connected'} />
        </KitSection>
        {spotify.connected ? (
          <Button kind="destructive" onPress={disconnectSpotify}>
            Disconnect
          </Button>
        ) : (
          <>
            <input className={styles.input} placeholder="Client ID" aria-label="Spotify Client ID" value={clientId} onChange={(event) => setClientId(event.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <Button
              disabled={!clientId.trim()}
              onPress={() => {
                setSpotifyClientId(clientId);
                connectSpotify().catch((error: Error) => setMessage(error.message));
              }}
            >
              Connect Spotify
            </Button>
          </>
        )}
      </Section>

      <Section
        label="Apple Music"
        note={apple.error ?? 'MusicKit needs a developer token from an Apple Developer account. With it, sign in with your Apple ID and Apple Music plays inside Vantage.'}
      >
        <KitSection>
          <Row title="Status" value={apple.signedIn ? 'Signed in' : apple.hasToken ? 'Token added' : 'No token'} />
        </KitSection>
        <input className={styles.input} placeholder="Developer token" aria-label="MusicKit developer token" value={token} onChange={(event) => setToken(event.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        <div className={styles.buttons}>
          <Button disabled={!token.trim()} onPress={() => setAppleMusicToken(token)}>
            Save token
          </Button>
          <Button disabled={!apple.hasToken} onPress={() => void signInAppleMusic()}>
            Sign in
          </Button>
        </div>
      </Section>
    </SettingsPage>
  );
}
