'use client';
import { useMemo } from 'react';
import Script from 'next/script';

export default function NonceScriptExample({ nonce, code }: { nonce: string; code: string }) {
  const __html = useMemo(()=>code,[code]);
  // Inline execution with nonce (no 'unsafe-inline' required)
  return <Script id='nonce-inline' nonce={nonce} strategy='afterInteractive' dangerouslySetInnerHTML={{ __html }} />;
}
