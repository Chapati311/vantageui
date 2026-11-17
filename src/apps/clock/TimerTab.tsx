import { useEffect, useRef, useState } from "react";
import { CircleButton } from "../../components/CircleButton";
import { DotNumber } from "../../components/DotNumber";
import { PauseIcon, PlayIcon, ResetIcon } from "../../components/glyphs";
import { Button, Dial, Sheet, ScrollWheel } from "../../components/kit";
import { Pressable } from "../../components/Pressable";
import { runAction } from "../../system/actions";
import {
  setPreset,
  setTimerVertical,
  timerRemaining,
  useClockState,
} from "./clockStore";
import { formatCountdown } from "./format";
import styles from "./Clock.module.css";

const MINUTE = 60_000;
const MINUTE_OPTIONS = Array.from({ length: 99 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} min`,
}));
const RING = 2 * Math.PI * 46;

/**
 * Timer. Set it by turning the ring of dots (one soft click per minute) or
 * with a preset pill (hold a pill to change it). While running: huge dot
 * numbers on their side, and a ring that empties in the accent.
 */
export function TimerTab() {
  const { timer, presets, vertical } = useClockState();
  const [, setTick] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [editMinutes, setEditMinutes] = useState(5);
  const holdTimer = useRef(0);
  const held = useRef(false);

  useEffect(() => {
    if (timer.status !== "running") return;
    const interval = window.setInterval(() => setTick((tick) => tick + 1), 250);
    return () => window.clearInterval(interval);
  }, [timer.status]);

  const remaining = timerRemaining(timer);
  const minutes = Math.round(timer.durationMs / MINUTE);
  const setting = timer.status === "idle";
  const done = timer.status === "done";

  if (setting) {
    return (
      <div className={styles.timer}>
        <div className={styles.dialBox}>
          <Dial
            label="Timer"
            size="large"
            dots={61}
            steps={60}
            value={Math.min(60, minutes) / 60}
            onChange={(value) =>
              void runAction("timer.setDuration", {
                minutes: Math.max(1, Math.round(value * 60)),
              })
            }
          >
            <DotNumber value={String(minutes).padStart(2, "0")} size={64} />
            <span className="label">Minutes</span>
          </Dial>
        </div>
        <div className={styles.presets}>
          {presets.map((preset, index) => (
            <Pressable
              key={index}
              className={`${styles.preset} ${preset === minutes ? styles.presetOn : ""}`}
              onPointerDown={() => {
                held.current = false;
                holdTimer.current = window.setTimeout(() => {
                  held.current = true;
                  setEditMinutes(preset);
                  setEditing(index);
                }, 500);
              }}
              onPointerUp={() => window.clearTimeout(holdTimer.current)}
              onPointerLeave={() => window.clearTimeout(holdTimer.current)}
              onClick={() =>
                !held.current &&
                void runAction("timer.setDuration", { minutes: preset })
              }
            >
              {preset}
            </Pressable>
          ))}
        </div>
        <div className={styles.buttons}>
          <CircleButton
            label={vertical ? "Numbers flat" : "Numbers on their side"}
            small
            onClick={() => setTimerVertical(!vertical)}
          >
            <span className={styles.orientation}>{vertical ? "↕" : "↔"}</span>
          </CircleButton>
          <CircleButton
            label="Start"
            onClick={() => void runAction("timer.start", {})}
          >
            <PlayIcon />
          </CircleButton>
        </div>
        <Sheet
          open={editing !== null}
          onClose={() => setEditing(null)}
          title="Preset"
        >
          <ScrollWheel
            label="Minutes"
            options={MINUTE_OPTIONS}
            value={editMinutes}
            onChange={setEditMinutes}
          />
          <Button
            kind="primary"
            wide
            onPress={() => {
              if (editing !== null) setPreset(editing, editMinutes);
              setEditing(null);
            }}
          >
            Save
          </Button>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={`${styles.timer} ${done ? styles.timerDone : ""}`}>
      <div className={styles.runningBox}>
        <svg
          className={styles.runningRing}
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle className={styles.ringTrack} cx="50" cy="50" r="46" />
          <circle
            className={styles.ringLeft}
            cx="50"
            cy="50"
            r="46"
            strokeDasharray={`${RING * (remaining / timer.durationMs)} ${RING}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <time
          className={vertical ? styles.turned : styles.flat}
          aria-label={`${formatCountdown(remaining)} left`}
        >
          <DotNumber
            value={formatCountdown(remaining)}
            size={vertical ? 64 : 40}
          />
        </time>
      </div>
      {done ? (
        <Button
          kind="primary"
          onPress={() => void runAction("timer.reset", {})}
        >
          Stop
        </Button>
      ) : (
        <div className={styles.buttons}>
          <CircleButton
            label="Reset"
            onClick={() => void runAction("timer.reset", {})}
          >
            <ResetIcon />
          </CircleButton>
          {timer.status === "running" ? (
            <CircleButton
              label="Pause"
              onClick={() => void runAction("timer.pause", {})}
            >
              <PauseIcon />
            </CircleButton>
          ) : (
            <CircleButton
              label="Resume"
              onClick={() => void runAction("timer.start", {})}
            >
              <PlayIcon />
            </CircleButton>
          )}
        </div>
      )}
    </div>
  );
}
