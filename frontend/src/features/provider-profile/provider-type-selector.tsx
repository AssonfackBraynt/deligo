'use client';

import { Bike, Building2, Truck } from 'lucide-react';
import { RadioCard } from '@/components/ui/radio-card';
import type { ProviderType } from './profile-types';

const TYPES = [
  {
    value: 'independent_rider' as ProviderType,
    title: 'Independent Rider',
    description:
      'A solo rider offering personal delivery services. You operate in specific cities with a defined coverage area.',
    icon: <Bike size={20} aria-hidden="true" />,
  },
  {
    value: 'courier_company' as ProviderType,
    title: 'Courier Company',
    description:
      'A registered courier business with a fixed address. You handle multiple deliveries with a team of riders.',
    icon: <Building2 size={20} aria-hidden="true" />,
  },
  {
    value: 'logistics_company' as ProviderType,
    title: 'Logistics Company',
    description:
      'A large-scale logistics operation providing comprehensive delivery and freight services across regions.',
    icon: <Truck size={20} aria-hidden="true" />,
  },
];

type Props = {
  value: ProviderType | undefined;
  onChange: (type: ProviderType) => void;
  error?: string;
};

export function ProviderTypeSelector({ value, onChange, error }: Props) {
  return (
    <div>
      <div className="space-y-3">
        {TYPES.map((t) => (
          <RadioCard
            key={t.value}
            title={t.title}
            description={t.description}
            icon={t.icon}
            selected={value === t.value}
            onClick={() => onChange(t.value)}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
