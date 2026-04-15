import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

/**
 * Undo/redo history for the workflow canvas.
 *
 * Uses an index-based approach with a ref array so that `undo()` and `redo()`
 * can return the target state synchronously, allowing callers to immediately
 * apply `setNodes` / `setEdges` without an extra render cycle.
 *
 * Usage:
 *   const { pushHistory, undo, redo, canUndo, canRedo } = useUndoRedo();
 *
 * Call `pushHistory(nodes, edges)` after every intentional user action
 * (node added/deleted, edge connected/removed, node dragged to final position).
 * Do NOT call it on every `onNodesChange` drag-move event.
 */
export function useUndoRedo(): {
  pushHistory: (nodes: Node[], edges: Edge[]) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: boolean;
  canRedo: boolean;
} {
  // Stored as a ref so push/undo/redo are synchronous
  const historyRef = useRef<HistoryEntry[]>([]);
  // Index of the "current" committed state in historyRef
  const [index, setIndex] = useState(-1);
  const indexRef = useRef(-1);

  const updateIndex = useCallback((next: number) => {
    indexRef.current = next;
    setIndex(next);
  }, []);

  const pushHistory = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      const current = indexRef.current;
      // Discard any redo states
      const sliced = historyRef.current.slice(0, current + 1);
      sliced.push({ nodes, edges });
      // Limit depth
      if (sliced.length > MAX_HISTORY) {
        sliced.splice(0, sliced.length - MAX_HISTORY);
      }
      historyRef.current = sliced;
      updateIndex(sliced.length - 1);
    },
    [updateIndex]
  );

  const undo = useCallback((): HistoryEntry | null => {
    const current = indexRef.current;
    if (current <= 0) return null;
    const next = current - 1;
    updateIndex(next);
    return historyRef.current[next];
  }, [updateIndex]);

  const redo = useCallback((): HistoryEntry | null => {
    const current = indexRef.current;
    if (current >= historyRef.current.length - 1) return null;
    const next = current + 1;
    updateIndex(next);
    return historyRef.current[next];
  }, [updateIndex]);

  return {
    pushHistory,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < historyRef.current.length - 1,
  };
}
