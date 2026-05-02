"use client";

import { useCallback, useRef, useState } from "react";
import type { CollageSnapshot } from "./types";

const MAX_HISTORY = 50;

interface HistoryState {
  past: CollageSnapshot[];
  present: CollageSnapshot;
  future: CollageSnapshot[];
}

export interface UseCollageHistoryReturn {
  snapshot: CollageSnapshot;
  /** Replace the current snapshot AND push the previous one onto undo stack. */
  commit: (next: CollageSnapshot | ((prev: CollageSnapshot) => CollageSnapshot)) => void;
  /**
   * Replace the current snapshot WITHOUT touching history.
   * Use during continuous interactions (e.g. slider dragging) and call `commit`
   * on the final value when the interaction ends.
   */
  setTransient: (next: CollageSnapshot | ((prev: CollageSnapshot) => CollageSnapshot)) => void;
  /** Promote the current transient state into a new history entry. */
  flushTransient: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Generic snapshot-based undo/redo for the whole collage state.
 *
 * - `commit` is the normal mutator — it records history.
 * - `setTransient` is for high-frequency edits (slider drags) that shouldn't
 *   each create an entry; pair it with `flushTransient` on drag end.
 */
export function useCollageHistory(initial: CollageSnapshot): UseCollageHistoryReturn {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });

  // Snapshot at the start of the current transient interaction (the entry
  // we should push onto `past` when the user finally commits).
  const transientBaselineRef = useRef<CollageSnapshot | null>(null);

  const commit = useCallback(
    (next: CollageSnapshot | ((prev: CollageSnapshot) => CollageSnapshot)) => {
      setState((prev) => {
        const baseline = transientBaselineRef.current ?? prev.present;
        transientBaselineRef.current = null;
        const resolved = typeof next === "function" ? (next as (p: CollageSnapshot) => CollageSnapshot)(prev.present) : next;
        if (resolved === baseline) {
          return { past: prev.past, present: resolved, future: [] };
        }
        const newPast = [...prev.past, baseline].slice(-MAX_HISTORY);
        return { past: newPast, present: resolved, future: [] };
      });
    },
    []
  );

  const setTransient = useCallback(
    (next: CollageSnapshot | ((prev: CollageSnapshot) => CollageSnapshot)) => {
      setState((prev) => {
        if (transientBaselineRef.current === null) {
          transientBaselineRef.current = prev.present;
        }
        const resolved = typeof next === "function" ? (next as (p: CollageSnapshot) => CollageSnapshot)(prev.present) : next;
        return { ...prev, present: resolved, future: [] };
      });
    },
    []
  );

  const flushTransient = useCallback(() => {
    setState((prev) => {
      const baseline = transientBaselineRef.current;
      transientBaselineRef.current = null;
      if (!baseline || baseline === prev.present) return prev;
      const newPast = [...prev.past, baseline].slice(-MAX_HISTORY);
      return { past: newPast, present: prev.present, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      transientBaselineRef.current = null;
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      transientBaselineRef.current = null;
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  return {
    snapshot: state.present,
    commit,
    setTransient,
    flushTransient,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
