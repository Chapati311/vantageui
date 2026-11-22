import { WidgetGallery } from '../../shell/home/WidgetGallery';

/**
 * Customise > Widget store: the full store of ready-made widgets (the same one
 * as the home screen's edit mode). Added widgets go on the home screen, on the
 * first free spot.
 */
export function WidgetStorePage({ onBack }: { onBack: () => void }) {
  return <WidgetGallery open page={0} onClose={onBack} />;
}
