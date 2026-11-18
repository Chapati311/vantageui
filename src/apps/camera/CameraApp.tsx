import { useEffect, useRef, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { ResetIcon } from '../../components/glyphs';
import { AppShell, EmptyState } from '../../components/kit';
import { runAction } from '../../system/actions';
import { addPhoto, useFiles } from '../../system/files';
import { playSound } from '../../system/sounds';
import styles from './Camera.module.css';

const nameFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * Camera. The signature: a minimal ring shutter. Photos are saved inside
 * Vantage (Photos app); saving to the iPhone library goes through Share.
 */
export function CameraApp() {
  const video = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const { files } = useFiles();
  const lastPhoto = files.find((file) => file.kind === 'photo');
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!lastPhoto) return setThumb(null);
    const url = URL.createObjectURL(lastPhoto.blob);
    setThumb(url);
    return () => URL.revokeObjectURL(url);
  }, [lastPhoto]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't use the camera.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then((media) => {
        stream = media;
        setError(null);
        if (video.current) {
          video.current.srcObject = media;
          void video.current.play().catch(() => undefined);
        }
      })
      .catch(() => setError('Camera access was not allowed.'));
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [facing]);

  const capture = () => {
    const element = video.current;
    if (!element || !element.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (facing === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(element, 0, 0);
    playSound('toggleOn');
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    canvas.toBlob((blob) => blob && void addPhoto(blob, `Photo ${nameFormat.format(Date.now())}.jpg`), 'image/jpeg', 0.9);
  };

  if (error) {
    return (
      <AppShell title="Camera" fixed>
        <EmptyState kind="error" title="No camera" message={error} />
      </AppShell>
    );
  }

  return (
    <AppShell fixed>
      <div className={styles.camera}>
        <div className={styles.viewfinder}>
          <video ref={video} className={`${styles.video} ${facing === 'user' ? styles.mirror : ''}`} playsInline muted />
          <span className={styles.grid} aria-hidden="true" />
          {flash && <span className={styles.flash} />}
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.thumb}
            style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
            aria-label="Open Photos"
            onClick={() => void runAction('app.open', { appId: 'photos' })}
          />
          <button type="button" className={styles.shutter} aria-label="Take photo" onClick={capture}>
            <span className={styles.shutterInner} />
          </button>
          <CircleButton small label="Switch camera" onClick={() => setFacing(facing === 'environment' ? 'user' : 'environment')}>
            <ResetIcon />
          </CircleButton>
        </div>
      </div>
    </AppShell>
  );
}
