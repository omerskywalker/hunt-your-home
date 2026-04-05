"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

interface Props {
  /** IDs of items currently in-progress — drives whether polling is active */
  inProgressIds: string[];
  /** Current done-item IDs — used to detect newly completed items */
  doneIds: string[];
}

const POLL_INTERVAL_MS = 30_000;

export function RoadmapPoller({ inProgressIds, doneIds }: Props) {
  const router = useRouter();
  const prevDoneIds = useRef<Set<string>>(new Set(doneIds));

  // Detect newly completed items and fire confetti
  useEffect(() => {
    const prev = prevDoneIds.current;
    const newlyDone = doneIds.filter((id) => !prev.has(id));

    if (newlyDone.length > 0) {
      fireFireworks();
    }

    prevDoneIds.current = new Set(doneIds);
  }, [doneIds]);

  // Poll every 30s while any items are in-progress
  useEffect(() => {
    if (inProgressIds.length === 0) return;

    const id = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [inProgressIds.length, router]);

  return null;
}

function fireFireworks() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ["#39D353", "#58A6FF", "#E6EDF3", "#F0C040"];

  function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }

  frame();
}
