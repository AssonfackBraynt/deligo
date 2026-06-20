export type CustomerContact = {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string | null;
  whatsappNumber: string;
  paymentNumber: string | null;
  email: string | null;
  preferredLanguage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateContactInput = {
  fullName: string;
  phone?: string;
  whatsappNumber: string;
  /** Omit to default to whatsappNumber on the backend. */
  paymentNumber?: string;
  email?: string;
  preferredLanguage?: string;
};

export type UpdateContactInput = Partial<CreateContactInput>;
