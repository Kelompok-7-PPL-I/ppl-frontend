"use client";

import { useEffect } from "react";
import { useTrackInteraction, type InteractionItem } from "./useTrackInteraction";

/** Catat "view" saat halaman detail dibuka. Bisa dipasang di server component. */
export default function TrackView({ type, id }: { type: InteractionItem; id: number }) {
  const track = useTrackInteraction();
  useEffect(() => {
    track(type, id, "view");
  }, [track, type, id]);
  return null;
}
