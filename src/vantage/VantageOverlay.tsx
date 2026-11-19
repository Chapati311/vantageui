import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DotLogo } from '../components/DotLogo';
import { Pressable } from '../components/Pressable';
import { SPRING } from '../theme/tokens';
import { FRAME_URL, IS_MOCK, attachFrame, cancelCard, confirmCard, onVantageClose, undoCard, useVantage, type ActionCard } from './bridge';
import { dismiss, useSummon } from './summon';
import styles from './VantageOverlay.module.css';

/** One action Vantage asked for: what it does, and Confirm / Undo when needed. */
function Card({ card }: { card: ActionCard }) {
  return (
    <motion.div
      layout
      className={styles.card}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={SPRING.ui}
    >
      <span className={`label ${styles.cardState}`}>
        {card.status === 'confirm'
          ? 'Needs your OK'
          : card.status === 'done'
            ? 'Done'
            : card.status === 'undone'
              ? 'Undone'
              : card.status === 'cancelled'
                ? 'Cancelled'
                : 'Failed'}
      </span>
      <span className={styles.cardText}>{card.text}</span>
      {card.error && <span className={styles.cardError}>{card.error}</span>}
      {card.status === 'confirm' && (
        <span className={styles.cardButtons}>
          <Pressable className={`${styles.cardButton} ${styles.primary}`} onClick={() => confirmCard(card.id)}>
            {/^(message|email|send|call)/.test(card.name.split('.').pop() ?? '') ? 'Send' : 'Confirm'}
          </Pressable>
          <Pressable className={styles.cardButton} onClick={() => cancelCard(card.id, true)}>
            Edit
          </Pressable>
          <Pressable className={styles.cardButton} onClick={() => cancelCard(card.id)}>
            Cancel
          </Pressable>
        </span>
      )}
      {card.status === 'done' && card.undo && (
        <span className={styles.cardButtons}>
          <Pressable className={styles.cardButton} onClick={() => undoCard(card.id)}>
            Undo
          </Pressable>
        </span>
      )}
    </motion.div>
  );
}

/**
 * Summoning Vantage (VANTAGE.md section 3). The overlay frame is loaded at
 * boot and stays hidden, so summoning is instant. Then:
 *  1. a mint light wave enters from the left edge (the SE's volume buttons),
 *  2. the screen dims and shrinks a little (see global.css, data-summoned),
 *  3. dots assemble into the dotted V orb, which breathes and follows the
 *     voice level; while thinking, dots orbit it,
 *  4. Vantage's own transcript and answer show in the frame; action cards
 *     slide up underneath,
 *  5. swipe down (or tap outside) to dismiss: the orb scatters.
 * Retro themes step instead of glide; Reduce motion keeps only fades.
 */
export function VantageOverlay() {
  const { open } = useSummon();
  const { vantageState, level, cards } = useVantage();
  const frame = useRef<HTMLIFrameElement>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    attachFrame('overlay', frame.current?.contentWindow ?? null);
    onVantageClose((mode) => mode === 'overlay' && dismiss());
    return () => attachFrame('overlay', null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => event.key === 'Escape' && dismiss();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  return createPortal(
    <div className={`${styles.layer} ${open ? styles.open : ''}`} aria-hidden={!open}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
          />
        )}
      </AnimatePresence>

      {/* 1. The wave from the left edge */}
      <AnimatePresence>
        {open && (
          <motion.span
            key="wave"
            className={styles.wave}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '160%', opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.9, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      <div
        className={styles.sheet}
        onPointerDown={(event) => (startY.current = event.clientY)}
        onPointerUp={(event) => {
          if (startY.current !== null && event.clientY - startY.current > 80) dismiss();
          startY.current = null;
        }}
      >
        {/* 3. The orb: the dotted V, breathing, following the voice */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="orb"
              className={`${styles.orb} ${vantageState === 'thinking' ? styles.thinking : ''}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 + (vantageState === 'listening' ? level * 0.25 : 0) }}
              exit={{ opacity: 0, scale: 1.4, filter: 'blur(6px)' }}
              transition={SPRING.ui}
            >
              <span className={styles.breathe}>
                <DotLogo animated />
              </span>
              <span className={styles.orbit} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Vantage itself: transcript and answer (pre-loaded, only shown when summoned) */}
        <iframe
          ref={frame}
          className={styles.frame}
          src={`${FRAME_URL}${FRAME_URL.includes('?') ? '&' : '?'}host=vantage-os&view=overlay`}
          title="Vantage"
          allow="microphone; autoplay; clipboard-write"
          tabIndex={open ? 0 : -1}
        />
        {IS_MOCK && open && <span className={`label ${styles.mock}`}>Test page: Vantage isn't connected yet</span>}

        <div className={styles.cards}>
          <AnimatePresence initial={false}>{open && cards.slice(0, 3).map((card) => <Card key={card.id} card={card} />)}</AnimatePresence>
        </div>
      </div>
    </div>,
    document.body,
  );
}
