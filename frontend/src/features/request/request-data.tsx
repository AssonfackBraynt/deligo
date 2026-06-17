import {
  Banknote,
  Bike,
  BriefcaseBusiness,
  Building2,
  FileText,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { DeliveryType, ProviderSelectionMode, RequestStep } from './request-types';

export const requestSteps: { key: RequestStep; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'route', label: 'Route' },
  { key: 'item', label: 'Item' },
  { key: 'provider', label: 'Provider' },
  { key: 'contact', label: 'Contact' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
];

export const deliveryTypes: {
  value: DeliveryType;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'agency_pickup',
    title: 'Agency Pickup',
    description: 'Collect a package from an agency or station.',
    icon: <Building2 size={22} aria-hidden="true" />,
  },
  {
    value: 'document_delivery',
    title: 'Document Delivery',
    description: 'Move letters, files, contracts, or official papers.',
    icon: <FileText size={22} aria-hidden="true" />,
  },
  {
    value: 'product_delivery',
    title: 'Product Delivery',
    description: 'Deliver customer orders, parcels, and small goods.',
    icon: <Package size={22} aria-hidden="true" />,
  },
  {
    value: 'purchase_delivery',
    title: 'Purchase & Delivery',
    description: 'Have a provider buy and deliver an item.',
    icon: <ShoppingBag size={22} aria-hidden="true" />,
  },
  {
    value: 'business_delivery',
    title: 'Business Delivery',
    description: 'Recurring delivery support for shops and teams.',
    icon: <BriefcaseBusiness size={22} aria-hidden="true" />,
  },
  {
    value: 'intercity_delivery',
    title: 'Intercity Delivery',
    description: 'Send items between cities with trusted carriers.',
    icon: <Truck size={22} aria-hidden="true" />,
  },
  {
    value: 'other',
    title: 'Other',
    description: 'Use this when your delivery does not fit the list.',
    icon: <Sparkles size={22} aria-hidden="true" />,
  },
];

export const providerModes: {
  value: ProviderSelectionMode;
  label: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'open_marketplace',
    label: 'Marketplace',
    title: 'Open Marketplace',
    description: 'Verified providers submit offers after your payment is confirmed.',
    icon: <Banknote size={20} aria-hidden="true" />,
  },
  {
    value: 'recommended_provider',
    label: 'Recommended',
    title: 'Recommended Providers',
    description: 'Choose from providers ranked by distance, price, availability, rating, and verification.',
    icon: <Bike size={20} aria-hidden="true" />,
  },
  {
    value: 'search_provider',
    label: 'Search',
    title: 'Search Provider',
    description: 'Find a specific agency, courier company, or delivery service.',
    icon: <Search size={20} aria-hidden="true" />,
  },
];

export const mockProviders = [
  {
    id: 'best-match',
    name: 'Express Rider Douala',
    rating: '4.8',
    eta: '35-50 min',
    priceRange: '1,800 - 2,400 FCFA',
    tag: 'Best Match',
  },
  {
    id: 'fastest',
    name: 'Akwa Quick Courier',
    rating: '4.6',
    eta: '25-40 min',
    priceRange: '2,100 - 2,800 FCFA',
    tag: 'Fastest',
  },
  {
    id: 'cheapest',
    name: 'Bonaberi Carrier Network',
    rating: '4.4',
    eta: '45-70 min',
    priceRange: '1,500 - 2,000 FCFA',
    tag: 'Cheapest',
  },
];
