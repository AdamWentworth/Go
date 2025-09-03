// hooks/useEditWorkflow.ts
import { useCallback, useEffect, useState } from 'react';

type Args = {
  validate: Function;
  currentBaseStats: any;
  alert: (msg: string) => void;
  onPersist: (computed: { newComputedValues: any }) => Promise<void>;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
};

export function useEditWorkflow({ validate, currentBaseStats, alert, onPersist, onStartEditing, onStopEditing }: Args) {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { if (editMode) onStartEditing?.(); }, [editMode, onStartEditing]);

  const toggleEditMode = useCallback(async (payload: { level: any; cp: any; ivs: any; weight: any; height: any }) => {
    if (editMode) {
      const { validationErrors: vErrors, computedValues } = validate(payload, currentBaseStats);
      if (Object.keys(vErrors).length > 0) {
        alert(Object.values(vErrors).join('\n'));
        return false;
      }
      await onPersist({ newComputedValues: computedValues });
      onStopEditing?.();
    }
    setEditMode(prev => !prev);
    return true;
  }, [editMode, validate, currentBaseStats, alert, onPersist, onStopEditing]);

  return { editMode, toggleEditMode, setEditMode };
}
