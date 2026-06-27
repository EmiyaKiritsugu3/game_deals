'use client';
import Image from 'next/image';
import { type Deal, getHighResImage } from '../../services/api';

export function MatrixBackground({ deals }: Readonly<{ deals: Deal[] }>) {
  return (
    <>
      <div className="absolute -inset-[20%] z-0 overflow-hidden flex pointer-events-none [transform:perspective(1000px)_rotateX(20deg)_rotateZ(-5deg)]">
        <div className="flex flex-wrap content-start gap-4 w-[150%] h-[150%] opacity-70 animate-[matrixDrift_60s_linear_infinite]">
          {deals.length > 0 &&
            Array.from({ length: 15 }, (_, i) => {
              return (
                <div
                  key={i}
                  className="flex-[1_1_200px] h-[130px] rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-background"
                >
                  <Image
                    src={getHighResImage(deals[0].thumb)}
                    alt=""
                    aria-hidden={true}
                    loading="lazy"
                    width={200}
                    height={130}
                    className="w-full h-full object-cover [filter:grayscale(10%)_contrast(1.1)]"
                    unoptimized
                  />
                </div>
              );
            })}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent/0 via-30% via-70% to-background z-[1] pointer-events-none" />
    </>
  );
}
