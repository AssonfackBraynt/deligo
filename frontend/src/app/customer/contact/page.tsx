'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { Container } from '@/components/layout/container';
import { PublicHeader } from '@/components/layout/public-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ContactInfoForm } from '@/features/customer-contact/contact-info-form';
import { saveContactId, saveContactCache, loadContactId } from '@/features/customer-contact/contact-store';
import type { CreateContactInput, CustomerContact } from '@/features/customer-contact/contact-types';

export default function CustomerContactPage() {
  const [created, setCreated] = useState<CustomerContact | null>(null);
  const [storedId, setStoredId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setStoredId(loadContactId());
  }, []);

  async function handleSubmit(values: CreateContactInput) {
    setServerError(null);
    try {
      const contact = await apiClient.post<CustomerContact>('/customer-contacts', values);
      saveContactId(contact.id);
      saveContactCache({ id: contact.id, fullName: contact.fullName, whatsappNumber: contact.whatsappNumber, paymentNumber: contact.paymentNumber });
      setStoredId(contact.id);
      setCreated(contact);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : 'An unexpected error occurred. Please try again.',
      );
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="py-10">
        <Container className="max-w-lg space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Your contact information</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No account required. We use this to send you delivery updates.
            </p>
          </div>

          {storedId && !created && (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              A contact is already saved on this device.{' '}
              <span className="font-mono text-xs">{storedId}</span>
              <br />
              Submit the form below to create a new one.
            </div>
          )}

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-foreground">Contact details</h2>
            </CardHeader>
            <CardContent>
              <ContactInfoForm
                onSubmit={handleSubmit}
                serverError={serverError}
                submitLabel="Save and continue"
              />
            </CardContent>
          </Card>

          {created && (
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <CheckCircle size={22} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Contact saved successfully</p>
                    <dl className="space-y-1 text-muted-foreground">
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 font-medium text-foreground">Contact ID</dt>
                        <dd className="break-all font-mono text-xs">{created.id}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 font-medium text-foreground">Linked to account</dt>
                        <dd>{created.userId ? 'Yes' : 'No (anonymous)'}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 font-medium text-foreground">Name</dt>
                        <dd>{created.fullName}</dd>
                      </div>
                      {created.phone && (
                        <div className="flex gap-2">
                          <dt className="w-36 shrink-0 font-medium text-foreground">Phone</dt>
                          <dd>{created.phone}</dd>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 font-medium text-foreground">WhatsApp</dt>
                        <dd>{created.whatsappNumber}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 font-medium text-foreground">Payment number</dt>
                        <dd>
                          {created.paymentNumber}
                          {created.paymentNumber === created.whatsappNumber && (
                            <span className="ml-2 text-xs text-muted-foreground">(same as WhatsApp)</span>
                          )}
                        </dd>
                      </div>
                      {created.email && (
                        <div className="flex gap-2">
                          <dt className="w-36 shrink-0 font-medium text-foreground">Email</dt>
                          <dd>{created.email}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="pt-1 text-xs text-muted-foreground/70">
                      This ID is saved in your browser. It will be used automatically when you post a
                      delivery request.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </main>
    </>
  );
}
