'use client';

import { useEffect, useRef, useState } from 'react';

import { useCanvasStore } from '../_store/canvas-store';

type UseArgumentFieldOptions = {
  nodeId: string;
  name: string;
  /** The value derived from the store (already stringified). */
  externalValue: string;
};

/**
 * Keeps a local mirror of a node-argument text value so the input renders
 * exactly what was typed. The store write round-trips through React Flow's
 * internal node store (which syncs in an effect, a tick later), so binding the
 * input straight to the store makes it briefly re-render with the stale value —
 * React then resets the caret to the end. Mirroring locally avoids that, while
 * external changes (undo/redo, selecting another node) still sync in whenever
 * the field isn't being edited.
 */
export function useArgumentField({
  nodeId,
  name,
  externalValue,
}: UseArgumentFieldOptions) {
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const [value, setValue] = useState(externalValue);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setValue(externalValue);
    }
  }, [externalValue]);

  return {
    value,
    onChange: (next: string) => {
      setValue(next);
      setNodeArgument(nodeId, name, next);
    },
    onFocus: () => {
      isFocused.current = true;
    },
    onBlur: () => {
      isFocused.current = false;
    },
  };
}
