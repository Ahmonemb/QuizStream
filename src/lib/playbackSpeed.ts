export const PLAYBACK_SPEED_OPTIONS = [
  { value: "0.5", label: "0.5x" },
  { value: "0.75", label: "0.75x" },
  { value: "1", label: "1x" },
  { value: "1.25", label: "1.25x" },
  { value: "1.5", label: "1.5x" },
  { value: "2", label: "2x" },
] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEED_OPTIONS)[number]["value"];

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = "1";

export function isPlaybackSpeed(value: string): value is PlaybackSpeed {
  return PLAYBACK_SPEED_OPTIONS.some((option) => option.value === value);
}
