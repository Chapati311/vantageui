import { AnimatePresence, motion } from 'motion/react';
import { AppIcon } from '../../components/AppIcon';
import { Pressable } from '../../components/Pressable';
import { getApp } from '../../system/appRegistry';
import { SPRING } from '../../theme/tokens';
import { shapeOf, type ScreenRect } from '../AppView';
import styles from './FolderView.module.css';

interface FolderViewProps {
  folder: { name: string; apps: string[] } | null;
  onOpenApp: (appId: string, from: ScreenRect) => void;
  onClose: () => void;
}

/** An open folder: a frosted card with its apps (and their names), over the dimmed home screen. */
export function FolderView({ folder, onOpenApp, onClose }: FolderViewProps) {
  return (
    <AnimatePresence>
      {folder && (
        <motion.div key="folder" className={styles.layer} data-no-gesture initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING.ui} onClick={onClose}>
          <motion.div
            className={styles.card}
            role="dialog"
            aria-label={`${folder.name} folder`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={SPRING.app}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.name}>{folder.name}</h2>
            <div className={styles.grid}>
              {folder.apps.map((id, index) => {
                const app = getApp(id);
                if (!app) return null;
                return (
                  <motion.div key={id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING.ui, delay: 0.03 * index }}>
                    <Pressable
                      className={styles.app}
                      aria-label={app.name}
                      onClick={(event) => {
                        const icon = (event.currentTarget as HTMLElement).querySelector('[data-app-icon]');
                        onClose();
                        onOpenApp(id, icon ? shapeOf(icon) : shapeOf(event.currentTarget as HTMLElement));
                      }}
                    >
                      <span className={styles.icon}>
                        <AppIcon app={app} />
                      </span>
                      <span className={styles.label}>{app.name}</span>
                    </Pressable>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
