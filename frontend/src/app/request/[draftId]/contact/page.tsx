'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { RequestFlowLayout } from '@/components/layout/request-flow-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { apiClient, ApiError } from '@/lib/api-client';
import { ContactInfoForm } from '@/features/customer-contact/contact-info-form';
import {
  saveContactId,
  saveContactCache,
  loadContactId,
  loadContactCache,
  clearContactId,
  clearContactCache,
  type CachedContact,
} from '@/features/customer-contact/contact-store';
import { stripCountryCode } from '@/lib/phone';
import { useRequestStore } from '@/features/request/request-store';
import type { CreateContactInput, CustomerContact } from '@/features/customer-contact/contact-types';

export default function ContactBillingPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();
  const updateDraft = useRequestStore((s) => s.updateDraft);

  const [mode, setMode] = useState<'loading' | 'saved' | 'form'>('loading');
  const [savedContact, setSavedContact] = useState<CachedContact | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadContactCache();
    const id = loadContactId();
    if (cached && id) {
      setSavedContact(cached);
      setMode('saved');
    } else {
      setMode('form');
    }
  }, []);

  function handleUseSaved() {
    if (!savedContact) return;
    updateDraft(draftId, { customerContactId: savedContact.id });
    router.push(routes.requestReview(draftId));
  }

  // Keep savedContact in state so the form can pre-fill with it; only wipe
  // localStorage once a new contact is successfully saved.
  function handleChange() {
    setMode('form');
  }

  async function handleFormSubmit(values: CreateContactInput) {
    setServerError(null);
    try {
      const contact = await apiClient.post<CustomerContact>('/customer-contacts', values);
      clearContactId();
      clearContactCache();
      saveContactId(contact.id);
      const next: CachedContact = {
        id: contact.id,
        fullName: contact.fullName,
        whatsappNumber: contact.whatsappNumber,
        paymentNumber: contact.paymentNumber,
      };
      saveContactCache(next);
      setSavedContact(next);
      updateDraft(draftId, { customerContactId: contact.id });
      router.push(routes.requestReview(draftId));
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : 'An unexpected error occurred. Please try again.',
      );
    }
  }

  const hasDifferentPayment =
    !!savedContact?.paymentNumber &&
    savedContact.paymentNumber !== savedContact.whatsappNumber;

  const formDefaults = savedContact
    ? {
        fullName: savedContact.fullName,
        whatsappNumber: stripCountryCode(savedContact.whatsappNumber),
        ...(hasDifferentPayment && {
          paymentNumber: stripCountryCode(savedContact.paymentNumber!),
        }),
      }
    : undefined;

  return (
    <RequestFlowLayout
      draftId={draftId}
      step="contact"
      title="Contact information"
      description="No account required. We use this to send you delivery updates via WhatsApp."
      backHref={routes.requestProvider(draftId)}
    >
      {mode === 'loading' && (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      )}

      {mode === 'saved' && savedContact && (
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <CheckCircle size={22} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Saved contact</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 font-medium text-foreground">Name</dt>
                    <dd className="text-muted-foreground">{savedContact.fullName}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 font-medium text-foreground">WhatsApp</dt>
                    <dd className="text-muted-foreground">{savedContact.whatsappNumber}</dd>
                  </div>
                  {hasDifferentPayment && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 font-medium text-foreground">Payment</dt>
                      <dd className="text-muted-foreground">{savedContact.paymentNumber}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={handleUseSaved}>
                Use this contact
              </Button>
              <Button size="lg" variant="outline" onClick={handleChange}>
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'form' && (
        <Card>
          <CardContent>
            <ContactInfoForm
              defaultValues={formDefaults}
              initialSameAsWhatsapp={!hasDifferentPayment}
              onSubmit={handleFormSubmit}
              serverError={serverError}
              submitLabel="Save and continue"
            />
          </CardContent>
        </Card>
      )}
    </RequestFlowLayout>
  );
}
