import Image from 'next/image';

export function Gallery({ images, altPrefix }: { images: string[]; altPrefix: string }) {
  if (!images.length) return null;

  return (
    <div className="gallery" role="list">
      {images.map((src, idx) => (
        <div key={src} className="gallery__item watermarked" role="listitem">
          <Image
            src={src}
            alt={`${altPrefix} — фото ${idx + 1}`}
            width={900}
            height={1200}
            className="gallery__img"
            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
}
