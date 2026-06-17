import { Bike, Building2, PackageCheck, Truck } from 'lucide-react';

export type PublicProvider = {
  id: string;
  name: string;
  type: string;
  city: string;
  coverage: string;
  rating: number;
  reviewCount: number;
  eta: string;
  priceRange: string;
  verified: boolean;
  featured?: boolean;
  services: string[];
  description: string;
  icon: React.ReactNode;
};

export const publicProviders: PublicProvider[] = [
  {
    id: 'express-rider-douala',
    name: 'Express Rider Douala',
    type: 'Professional Rider Network',
    city: 'Douala',
    coverage: 'Bonaberi, Akwa, Bali, Deido',
    rating: 4.8,
    reviewCount: 214,
    eta: '25-50 min',
    priceRange: '1,800 - 2,500 FCFA',
    verified: true,
    featured: true,
    services: ['Document Delivery', 'Product Delivery', 'Business Delivery'],
    description:
      'Fast city deliveries handled by verified riders with strong pickup and delivery proof practices.',
    icon: <Bike size={24} aria-hidden="true" />,
  },
  {
    id: 'akwa-quick-courier',
    name: 'Akwa Quick Courier',
    type: 'Courier Company',
    city: 'Douala',
    coverage: 'Akwa, Bonapriso, Bonamoussadi',
    rating: 4.6,
    reviewCount: 148,
    eta: '30-60 min',
    priceRange: '2,000 - 3,200 FCFA',
    verified: true,
    services: ['Agency Pickup', 'Document Delivery', 'Purchase & Delivery'],
    description:
      'Courier team focused on office documents, agency pickups, and purchase-and-delivery errands.',
    icon: <PackageCheck size={24} aria-hidden="true" />,
  },
  {
    id: 'bonaberi-carrier-network',
    name: 'Bonaberi Carrier Network',
    type: 'Independent Carrier Group',
    city: 'Douala',
    coverage: 'Bonaberi to central Douala',
    rating: 4.4,
    reviewCount: 92,
    eta: '45-75 min',
    priceRange: '1,500 - 2,200 FCFA',
    verified: true,
    services: ['Product Delivery', 'Intercity Delivery'],
    description:
      'Route-based carriers already moving between Bonaberi and central business zones.',
    icon: <Truck size={24} aria-hidden="true" />,
  },
  {
    id: 'agency-link-logistics',
    name: 'Agency Link Logistics',
    type: 'Delivery Agency',
    city: 'Yaounde',
    coverage: 'Mvan, Bastos, Mokolo, Etoudi',
    rating: 4.7,
    reviewCount: 176,
    eta: '40-80 min',
    priceRange: '2,500 - 4,500 FCFA',
    verified: true,
    services: ['Agency Pickup', 'Business Delivery', 'Intercity Delivery'],
    description:
      'Agency dispatch team for business deliveries, pickup handling, and intercity coordination.',
    icon: <Building2 size={24} aria-hidden="true" />,
  },
];

export function findProvider(providerId: string) {
  return publicProviders.find((provider) => provider.id === providerId);
}
