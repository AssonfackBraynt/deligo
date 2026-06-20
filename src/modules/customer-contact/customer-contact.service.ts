import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerContact } from '@prisma/client';
import { ErrorCode } from '@common/errors/error-codes';
import { normalizeCameroonPhone } from '@common/utils/phone.util';
import { PrismaService } from '@database/prisma.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';

// ── Response projection ────────────────────────────────────────────────────────

function toResponse(c: CustomerContact) {
  return {
    id: c.id,
    userId: c.userId,
    fullName: c.fullName,
    phone: c.phone,
    whatsappNumber: c.whatsappNumber,
    paymentNumber: c.paymentNumber,
    email: c.email,
    preferredLanguage: c.preferredLanguage,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class CustomerContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerContactDto, userId?: string | null) {
    const whatsapp = normalizeCameroonPhone(dto.whatsappNumber);
    const contact = await this.prisma.customerContact.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone ? normalizeCameroonPhone(dto.phone) : null,
        whatsappNumber: whatsapp,
        paymentNumber: dto.paymentNumber ? normalizeCameroonPhone(dto.paymentNumber) : whatsapp,
        email: dto.email ?? null,
        preferredLanguage: dto.preferredLanguage ?? 'en',
        ...(userId && { userId }),
      },
    });
    return toResponse(contact);
  }

  async findAllMine(userId: string) {
    const contacts = await this.prisma.customerContact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return contacts.map(toResponse);
  }

  async findOneMine(userId: string, id: string) {
    const contact = await this.prisma.customerContact.findFirst({
      where: { id, deletedAt: null },
    });

    if (!contact) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'Contact not found.' },
      });
    }

    if (contact.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: { code: ErrorCode.Forbidden, message: 'You do not own this contact.' },
      });
    }

    return toResponse(contact);
  }

  async updateMine(userId: string, id: string, dto: UpdateCustomerContactDto) {
    // Verifies ownership before updating
    await this.findOneMine(userId, id);

    const updated = await this.prisma.customerContact.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: normalizeCameroonPhone(dto.phone) }),
        ...(dto.whatsappNumber !== undefined && {
          whatsappNumber: normalizeCameroonPhone(dto.whatsappNumber),
        }),
        ...(dto.paymentNumber !== undefined && {
          paymentNumber: normalizeCameroonPhone(dto.paymentNumber),
        }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.preferredLanguage !== undefined && { preferredLanguage: dto.preferredLanguage }),
      },
    });

    return toResponse(updated);
  }
}
