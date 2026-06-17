import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  defaultChannels: ['dashboard', 'whatsapp'],
}));
