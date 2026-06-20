import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ok } from '@common/dto/api-response.dto';
import { OptionalJwtAuthGuard } from '@common/guards/optional-jwt-auth.guard';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { CustomerContactService } from './customer-contact.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';

@ApiTags('Customer Contacts')
@Controller('customer-contacts')
export class CustomerContactController {
  constructor(private readonly service: CustomerContactService) {}

  /**
   * Public — no account required.
   * If a valid Bearer token is included the contact is linked to that user account.
   * The returned id should be stored client-side for use in subsequent DeliveryRequests.
   */
  @Post()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Create a customer contact. No account required. ' +
      'Pass a Bearer token to link the contact to your account.',
  })
  async create(
    @Body() dto: CreateCustomerContactDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return ok(await this.service.create(dto, user?.id));
  }

  // NOTE: /me must be declared before /:id so NestJS does not treat "me" as a UUID param.

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all contacts linked to the authenticated user account.' })
  async findAllMine(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.findAllMine(user.id));
  }

  @Get('me/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one contact by ID. Must belong to the authenticated user.' })
  async findOneMine(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.findOneMine(user.id, id));
  }

  @Patch('me/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a contact. Must belong to the authenticated user.' })
  async updateMine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerContactDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.updateMine(user.id, id, dto));
  }
}
