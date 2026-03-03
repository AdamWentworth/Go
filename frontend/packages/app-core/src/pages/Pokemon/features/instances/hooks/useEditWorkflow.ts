// hooks/useEditWorkflow.ts
import { useCallback, useEffect, useState } from 'react';

export type EditWorkflowPayload = {
  level: number | null;
  cp: number | null;
  ivs: { Attack: number | ''; Defense: number | ''; Stamina: number | '' };
  weight: number;
  height: number;
};

export type EditWorkflowComputed = Partial<EditWorkflowPayload> & {
  ivs?: EditWorkflowPayload['ivs'];
};

type Args = {
  validate: (
    payload: EditWorkflowPayload,
    currentBaseStats: unknown,
  ) => { validationErrors: Record<string, string | undefined>; computedValues: EditWorkflowComputed };
  currentBaseStats: unknown;
  alert: (msg: string) => void | Promise<void>;
  onPersist: (computed: { newComputedValues: EditWorkflowComputed }) => Promise<void>;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
};

export function useEditWorkflow({ validate, currentBaseStats, alert, onPersist, onStartEditing, onStopEditing }: Args) {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { if (editMode) onStartEditing?.(); }, [editMode, onStartEditing]);

  const toggleEditMode = useCallback(async (payload: EditWorkflowPayload) => {
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
