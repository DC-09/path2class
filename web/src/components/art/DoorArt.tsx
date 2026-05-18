export interface DoorArtProps {
  /** Kept for API compat — the number is part of the photo itself. */
  number?: string;
}

/**
 * Hero photo of the target classroom door (Room 124). Used at hero size on
 * Destination and as a small thumbnail on Arrived. The source file lives at
 * `public/door-124.jpg`; replace it to update both screens at once.
 */
export function DoorArt(_props: DoorArtProps) {
  return (
    <img
      src="/door-124.jpg"
      alt=""
      draggable={false}
      className="w-full h-full"
      style={{ objectFit: 'cover', display: 'block' }}
    />
  );
}
