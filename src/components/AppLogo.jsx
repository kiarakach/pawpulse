import React from 'react';
import { Image } from '@/components/ui/image';

// Self-hosted (bundled) so the app has no runtime dependency on Base44's CDN.
export const LOGO_URL = '/logo.png';

export default function AppLogo({ size = 44, className = '' }) {
  return (
    <span
      className={`inline-block rounded-2xl overflow-hidden bg-white border border-white shadow-[0_8px_18px_-6px_hsl(25_95%_55%/0.5)] shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src={LOGO_URL} className="w-full h-full" focalPointX={0.5} focalPointY={0.3} />
    </span>
  );
}