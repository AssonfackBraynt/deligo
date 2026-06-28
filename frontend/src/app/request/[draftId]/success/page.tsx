'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Copy, MessageCircle, Route } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { useRequestDraft } from '@/features/request/use-request-draft';
import type { RequestDraft } from '@/features/request/request-types';

const RECEPTIONIST_NUMBER = '237694374748';

function buildWhatsAppMessage(draft: RequestDraft | undefined, trackingCode: string, baseUrl: string): string {
  const lines: string[] = [
    '🚚 *New DeliGo Delivery Request*',
    '',
  ];

  if (draft?.deliveryType) {
    lines.push(`*Type:* ${draft.deliveryType.replace(/_/g, ' ')}`);
  }

  lines.push('');
  lines.push('*📦 Item Details*');
  if (draft?.itemName) lines.push(`Item: ${draft.itemName}`);
  if (draft?.itemDescription) lines.push(`Description: ${draft.itemDescription}`);
  if (draft?.category) lines.push(`Category: ${draft.category}`);
  if (draft?.quantity) lines.push(`Quantity: ${draft.quantity}`);
  if (draft?.weightKg) lines.push(`Weight: ${draft.weightKg} kg`);
  if (draft?.sizeLabel) lines.push(`Size: ${draft.sizeLabel}`);
  if (draft?.isFragile) lines.push(`⚠️ Fragile item`);
  if (draft?.specialInstructions) lines.push(`Notes: ${draft.specialInstructions}`);

  lines.push('');
  lines.push('*📍 Pickup*');
  const pickupLocation = [draft?.pickupQuarterName, draft?.pickupTownName, draft?.pickupRegionName]
    .filter(Boolean).join(', ');
  if (pickupLocation) lines.push(`Location: ${pickupLocation}`);
  if (draft?.pickupLandmark) lines.push(`Landmark: ${draft.pickupLandmark}`);

  lines.push('');
  lines.push('*🏁 Destination*');
  const destLocation = [draft?.destinationQuarterName, draft?.destinationTownName, draft?.destinationRegionName]
    .filter(Boolean).join(', ');
  if (destLocation) lines.push(`Location: ${destLocation}`);
  if (draft?.destinationLandmark) lines.push(`Landmark: ${draft.destinationLandmark}`);

  if (draft?.providerMode || draft?.selectedProviderName) {
    lines.push('');
    lines.push('*🤝 Provider*');
    if (draft?.selectedProviderName) lines.push(`Selected: ${draft.selectedProviderName}`);
    else if (draft?.providerMode) lines.push(`Mode: ${draft.providerMode.replace(/_/g, ' ')}`);
    if (draft?.desiredRewardAmount) lines.push(`Reward offered: ${draft.desiredRewardAmount.toLocaleString()} FCFA`);
  }

  lines.push('');
  lines.push(`*🔖 Tracking Code: ${trackingCode}*`);
  lines.push(`Track your delivery here: ${baseUrl}/track/${trackingCode}`);
  lines.push('');
  lines.push('Please follow up with the assigned provider to ensure prompt delivery.');

  return lines.join('\n');
}

export default function RequestSuccessPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const draft = useRequestDraft(draftId);
  const trackingCode = draft?.publicTrackingCode ?? '';
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappHref = trackingCode
    ? `https://wa.me/${RECEPTIONIST_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(draft, trackingCode, typeof window !== 'undefined' ? window.location.origin : 'https://deligo.cm'))}`
    : '#';

  return (
    <main className="min-h-screen py-8 sm:py-12">
      <Container size="sm">
        <Card>
          <CardContent className="text-center">
            <CheckCircle2 className="mx-auto text-success" size={54} aria-hidden="true" />
            <h1 className="mt-5 text-3xl font-semibold text-foreground">Request posted!</h1>
            <p className="mt-3 text-muted-foreground">
              Your delivery request is now live. Verified providers will be notified based on your
              selected fulfillment mode.
            </p>

            <div className="mt-6 rounded-lg bg-muted p-5">
              <p className="text-sm text-muted-foreground">Your tracking code</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-foreground">
                {trackingCode || '—'}
              </p>
              {trackingCode && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Copy size={14} aria-hidden="true" />
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Save this code — you can track your request any time at{' '}
              <span className="font-medium">deligo.cm/track/[code]</span> without an account.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                asChild
                size="lg"
                className={!trackingCode ? 'pointer-events-none opacity-50' : ''}
              >
                <Link href={trackingCode ? routes.tracking(trackingCode) : '#'}>
                  <Route size={19} aria-hidden="true" />
                  Track Request
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className={`bg-[#25D366] text-white hover:bg-[#1ebe5d]${!trackingCode ? ' pointer-events-none opacity-50' : ''}`}
              >
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={19} aria-hidden="true" />
                  Share on WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
