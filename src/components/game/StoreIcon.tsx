'use client';

interface StoreIconProps {
  readonly src: string;
  readonly alt: string;
}

export default function StoreIcon({ src, alt }: StoreIconProps) {
  return (
    // biome-ignore lint/performance/noImgElement: <Image> cannot handle onError fallback for broken store logos
    <img
      src={src}
      alt={alt}
      width={16}
      height={16}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
