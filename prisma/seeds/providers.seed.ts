import { PrismaClient, VerificationStatus, AvailabilityStatus } from '@prisma/client';
import * as argon2 from 'argon2';

interface ProviderRow {
  name: string;
  email: string;
  password: string;
  phone: string | null;
  type: string;
  city: string | null;
  state: string;
  address: string | null;
  category_name: string;
  star_count: number | null;
  rating_count: number | null;
  lat: number | null;
  lng: number | null;
}

const PROVIDERS: ProviderRow[] = [
  { name: 'Chrono Foods', email: 'ChronoFoods@test.com', password: 'ChronoFoods123', phone: '+237 6 50 67 00 87', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Makepe - Rhône Poulenc, Douala, Cameroon', category_name: 'Delivery services', star_count: 0, rating_count: 0, lat: 4.0605537, lng: 9.7382479 },
  { name: 'Bridge Delivery Company', email: 'BridgeDeliveryCompany@test.com', password: 'BridgeDeliveryCompany123', phone: '+237 6 91 91 91 16', type: 'Delivery Enterprise', city: null, state: 'Centre', address: 'Porte 201 Immeuble PICOM, Face Centre Gestion Covid19, Zoé, Yaoundé, Cameroon', category_name: 'Consumer advice centers,Software companies,Delivery services', star_count: 4, rating_count: 1, lat: 3.8556457, lng: 11.5221625 },
  { name: 'Rata-grab', email: 'Ratagrab@test.com', password: 'Ratagrab123', phone: '+237 6 82 19 51 27', type: 'Delivery Enterprise', city: null, state: 'Adamawa', address: null, category_name: 'Companies,Logistics services,Delivery services,Service establishments', star_count: 0, rating_count: 0, lat: 7.3696175, lng: 12.2940041 },
  { name: 'Errand Services', email: 'ErrandServices@test.com', password: 'ErrandServices123', phone: '+237 6 78 84 43 97', type: 'Independent Rider', city: 'Douala', state: 'Littoral', address: 'Nouvelle route Omnisport, 2ème rué de pavée Douala, Cameroon', category_name: 'Delivery services', star_count: 4.7, rating_count: 10, lat: 4.0512661, lng: 9.723224 },
  { name: 'Fast Home Delivery', email: 'FastHomeDelivery@test.com', password: 'FastHomeDelivery123', phone: '+237 6 78 39 84 47', type: 'Independent Rider', city: 'Buea', state: 'Southwest', address: 'Happicam opposite Eta Palace Hotel, Molyko Cite, Buea, Cameroon', category_name: 'Delivery services', star_count: 0, rating_count: 0, lat: 4.1525482, lng: 9.2935539 },
  { name: 'Brainz SA', email: 'BrainzSA@test.com', password: 'BrainzSA123', phone: '+237 6 97 08 28 23', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Marche central, Douala, Cameroon', category_name: 'Delivery services', star_count: 0, rating_count: 0, lat: 4.023981, lng: 9.7148813 },
  { name: 'Epsilon Flash', email: 'EpsilonFlash@test.com', password: 'EpsilonFlash123', phone: '+237 6 94 57 01 27', type: 'Independent Rider', city: 'Douala', state: 'Littoral', address: 'Facebook, Douala, Cameroon', category_name: 'Delivery services', star_count: 0, rating_count: 0, lat: 4.0505441, lng: 9.7323331 },
  { name: 'DILE Services', email: 'DILEServices@test.com', password: 'DILEServices123', phone: '+237 6 77 97 16 47', type: 'Independent Rider', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services', star_count: 0, rating_count: 0, lat: 4.0605537, lng: 9.7382479 },
  { name: 'Pro Service.', email: 'ProService@test.com', password: 'ProService123', phone: '+237 6 54 05 12 56', type: 'Independent Rider', city: 'Kumba', state: 'Southwest', address: 'iTECH CENTER LTD KUMBA ICT, Lido street beside lake side radio, Kumba, Cameroon', category_name: 'Delivery services', star_count: 0, rating_count: 0, lat: 4.6333268, lng: 9.4450439 },
  { name: 'Fatafat Cameroon', email: 'FatafatCameroon@test.com', password: 'FatafatCameroon123', phone: '+237 6 80 38 37 69', type: 'Independent Rider', city: 'Douala', state: 'Littoral', address: 'kako Home - Rhône poulenc Makepe, 8330, Douala, Cameroon', category_name: 'Delivery services,Markets', star_count: 4.5, rating_count: 4, lat: 4.0832571, lng: 9.7533608 },
  { name: 'DHL International Cameroon', email: 'DHLInternationalCameroon@test.com', password: 'DHLInternationalCameroon123', phone: '+237 22 23 13 58', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Immeuble Stamatiades, Rue de l\'Indépendance, BP 5416, Yaoundé, Cameroon', category_name: 'Delivery services,Courier services,Shipping companies', star_count: null, rating_count: null, lat: 3.85, lng: 11.5021 },
  { name: 'Express Mail Service (EMS)', email: 'ExpressMailServiceEMS@test.com', password: 'ExpressMailServiceEMS123', phone: '+237 2 22 50 70 00', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Campost, Yaoundé Centre ville, Yaoundé, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'UPS Cameroun - Agence Yaoundé', email: 'UPSCamerounAgenceYaound@test.com', password: 'UPSCamerounAgenceYaound123', phone: '+237 22 22 95 55', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: '549, Immeuble T-BELLA, Avenue de l\'Indépendance, Yaoundé, Cameroon', category_name: 'Delivery services,Courier services,Shipping companies', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'Chronopost Yaoundé', email: 'ChronopostYaound@test.com', password: 'ChronopostYaound123', phone: '+237 22 22 15 75', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Immeuble Jaco, Yaoundé, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'MTA DC - Messagerie et Tourisme pour l\'Afrique', email: 'MTADCMessagerieetTourismepourlAfrique@test.com', password: 'MTADCMessagerieetTourismepourlAfrique123', phone: '+237 22 14 69 22', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Immeuble ex-SGBC, face Cathédrale, 2è étage, Yaoundé, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'SOLEX Yaoundé', email: 'SOLEXYaound@test.com', password: 'SOLEXYaound123', phone: '+237 33 43 63 25', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Carrefour ABBIA, face marche de fleurs, Yaoundé, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'ETS Angel Export', email: 'ETSAngelExport@test.com', password: 'ETSAngelExport123', phone: '+237 699929255', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Yaoundé, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'UPS Cameroun', email: 'UPSCameroun@test.com', password: 'UPSCameroun123', phone: '+237 233 430 973', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: '1310, Avenue De Gaulle, B.P. 2666, Douala, Cameroon', category_name: 'Delivery services,Courier services,Shipping companies', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Chronopost Douala - Siège social', email: 'ChronopostDoualaSigesocial@test.com', password: 'ChronopostDoualaSigesocial123', phone: '+237 33 42 70 48', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Rue Drouot - Bonejang, Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Afrik Cargo Network', email: 'AfrikCargoNetwork@test.com', password: 'AfrikCargoNetwork123', phone: '+237 243628611', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'No.4 Rue Kotto, Douala, Cameroon', category_name: 'Delivery services,Logistics services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'P-Rush Delivery', email: 'PRushDelivery@test.com', password: 'PRushDelivery123', phone: '+237 654946565', type: 'Independent Rider', city: 'Douala', state: 'Littoral', address: 'Bonamoussadi, Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0817, lng: 9.7394 },
  { name: 'GPS Pour Tous', email: 'GPSPourTous@test.com', password: 'GPSPourTous123', phone: '+237 698043445', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Rue Pau, Akwa, Près de l\'Hôtel Beau Séjour, Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0505, lng: 9.7055 },
  { name: 'Lazoto Express', email: 'LazotoExpress@test.com', password: 'LazotoExpress123', phone: '', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: '800 Rue King Akwa, BP 18513, Douala, Cameroon', category_name: 'Delivery services,Courier services,Logistics services', star_count: null, rating_count: null, lat: 4.0505, lng: 9.7055 },
  { name: 'AB Universal Logistics', email: 'ABUniversalLogistics@test.com', password: 'ABUniversalLogistics123', phone: '+237 681564875', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'PMB 1632, Douala, Cameroon', category_name: 'Delivery services,Logistics services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Gespros Shipping', email: 'GesprosShipping@test.com', password: 'GesprosShipping123', phone: '+237 233424706', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: '32, Rue Gallieni Akwa, Beside Hotel la Falaise, PO BOX 5866, Douala, Cameroon', category_name: 'Delivery services,Logistics services,Shipping companies', star_count: null, rating_count: null, lat: 4.0461, lng: 9.704 },
  { name: 'FedEx Cameroon', email: 'FedExCameroon@test.com', password: 'FedExCameroon123', phone: '+237 620930676', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services,Courier services,Shipping companies', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Global Freightage Services LTD', email: 'GlobalFreightageServicesLTD@test.com', password: 'GlobalFreightageServicesLTD123', phone: '+237 243708988', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'No. 706, Boulevard de la Republique, Bali, Douala, Cameroon', category_name: 'Delivery services,Logistics services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'HLOG Cameroon', email: 'HLOGCameroon@test.com', password: 'HLOGCameroon123', phone: '+237 22218635', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Immeuble La Finale, Rue Joffre AKWA I, B.P. 15442, Douala, Cameroon', category_name: 'Delivery services,Logistics services', star_count: null, rating_count: null, lat: 4.0505, lng: 9.7055 },
  { name: 'Aqua Cargo and Freight Ltd', email: 'AquaCargoandFreightLtd@test.com', password: 'AquaCargoandFreightLtd123', phone: '+237 671462942', type: 'Delivery Enterprise', city: 'Buea', state: 'Southwest', address: 'Buea Long Street, SWR / Guiche Unique Bonanjo, Douala, Cameroon', category_name: 'Delivery services,Logistics services,Courier services', star_count: 4, rating_count: 1, lat: 4.1543, lng: 9.2857 },
  { name: 'Fastmoves Services Limited', email: 'FastmovesServicesLimited@test.com', password: 'FastmovesServicesLimited123', phone: '+237 681179778', type: 'Delivery Enterprise', city: 'Buea', state: 'Southwest', address: 'Premier League Building, Mayors Street, Molyko, Buea, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.1543, lng: 9.2857 },
  { name: 'Cameroon Cargo Logistics Inc', email: 'CameroonCargoLogisticsInc@test.com', password: 'CameroonCargoLogisticsInc123', phone: '+237 33077369', type: 'Delivery Enterprise', city: 'Limbe', state: 'Southwest', address: 'BP 1360, Rue Pau, Akwa Douala / Branch: Limbe, SWR, Cameroon', category_name: 'Delivery services,Courier services,Logistics services', star_count: null, rating_count: null, lat: 4.0236, lng: 9.2057 },
  { name: 'Call Maimo', email: 'CallMaimo@test.com', password: 'CallMaimo123', phone: '+237 670621229', type: 'Independent Rider', city: 'Bamenda', state: 'Northwest', address: 'Ndamukong Street, Mile 2 Nkwen, Bamenda, Cameroon', category_name: 'Delivery services,Courier services', star_count: 5, rating_count: 3, lat: 5.9597, lng: 10.1456 },
  { name: 'Solex Agence Bafoussam Tamdja', email: 'SolexAgenceBafoussamTamdja@test.com', password: 'SolexAgenceBafoussamTamdja123', phone: '', type: 'Delivery Enterprise', city: 'Bafoussam', state: 'West', address: 'Bafoussam, West Region, Cameroon', category_name: 'Delivery services,Courier services,Shipping and mailing services', star_count: 3.6, rating_count: 5, lat: 5.4666, lng: 10.4235 },
  { name: 'Conglomérat', email: 'Conglomrat@test.com', password: 'Conglomrat123', phone: '+237 695918346', type: 'Independent Rider', city: 'Ngaoundéré', state: 'Adamawa', address: 'Ngaoundéré, Adamawa Region, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 7.3232, lng: 13.5843 },
  { name: 'DHL Service Point Garoua', email: 'DHLServicePointGaroua@test.com', password: 'DHLServicePointGaroua123', phone: '', type: 'Delivery Enterprise', city: 'Garoua', state: 'North', address: 'Garoua, North Region, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 9.3022, lng: 13.3964 },
  { name: 'CAMPOST Maroua', email: 'CAMPOSTMaroua@test.com', password: 'CAMPOSTMaroua123', phone: '', type: 'Delivery Enterprise', city: 'Maroua', state: 'Far North', address: 'Maroua, Far North Region, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 10.5915, lng: 14.3195 },
  { name: 'CAMPOST Ebolowa', email: 'CAMPOSTEbolowa@test.com', password: 'CAMPOSTEbolowa123', phone: '', type: 'Delivery Enterprise', city: 'Ebolowa', state: 'South', address: 'Ebolowa, South Region, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 2.9, lng: 11.15 },
  { name: 'CAMPOST Bertoua', email: 'CAMPOSTBertoua@test.com', password: 'CAMPOSTBertoua123', phone: '', type: 'Delivery Enterprise', city: 'Bertoua', state: 'East', address: 'Bertoua, East Region, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.5833, lng: 13.6833 },
  { name: 'FSxpress Courses', email: 'FSxpressCourses@test.com', password: 'FSxpressCourses123', phone: '+237 679 427 713', type: 'Delivery Enterprise', city: 'Yaoundé', state: 'Centre', address: 'Yaoundé, Cameroon', category_name: 'Delivery services,Grocery delivery services,Courier services', star_count: null, rating_count: null, lat: 3.8667, lng: 11.5167 },
  { name: 'Vitesse Delivery', email: 'VitesseDelivery@test.com', password: 'VitesseDelivery123', phone: '+237 682830388', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Makepe Bloc L, Douala, Cameroon', category_name: 'Delivery services,Courier services,Food delivery', star_count: null, rating_count: null, lat: 4.0833, lng: 9.753 },
  { name: 'Wakavite', email: 'Wakavite@test.com', password: 'Wakavite123', phone: '+237 650959090', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: '454 Rue Richard Bell Bali, Carrefour Kayo Elie, Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0452, lng: 9.699 },
  { name: 'Livraison Express', email: 'LivraisonExpress@test.com', password: 'LivraisonExpress123', phone: '+237 657634414', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Makepe BM, Douala, Cameroon', category_name: 'Delivery services,Courier services,Food delivery,Grocery delivery services', star_count: null, rating_count: null, lat: 4.0833, lng: 9.753 },
  { name: 'GO Livraisons Express', email: 'GOLivraisonsExpress@test.com', password: 'GOLivraisonsExpress123', phone: '+237 698308698', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Cameroun Demenageurs', email: 'CamerounDemenageurs@test.com', password: 'CamerounDemenageurs123', phone: '+237 671036145', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services,Logistics services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Yango Delivery Cameroon', email: 'YangoDeliveryCameroon@test.com', password: 'YangoDeliveryCameroon123', phone: null, type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Spreeloop', email: 'Spreeloop@test.com', password: 'Spreeloop123', phone: '+237 659418466', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services,Food delivery', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
  { name: 'Reeyo', email: 'Reeyo@test.com', password: 'Reeyo123', phone: '+237 674353039', type: 'Delivery Enterprise', city: 'Buea', state: 'Southwest', address: 'Buea, Cameroon', category_name: 'Delivery services,Food delivery,Grocery delivery services', star_count: null, rating_count: null, lat: 4.1543, lng: 9.2857 },
  { name: 'FRET Export Express Cameroun', email: 'FRETExportExpressCameroun@test.com', password: 'FRETExportExpressCameroun123', phone: '+237 675650424', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Bâtiment de la gare Camrail de Bessengue, 1er étage porte 142, Douala, Cameroon', category_name: 'Delivery services,Logistics services,Courier services', star_count: null, rating_count: null, lat: 4.0472, lng: 9.7248 },
  { name: 'EasyFlash', email: 'EasyFlash@test.com', password: 'EasyFlash123', phone: '+237 694431749', type: 'Delivery Enterprise', city: 'Douala', state: 'Littoral', address: 'Douala, Cameroon', category_name: 'Delivery services,Courier services', star_count: null, rating_count: null, lat: 4.0511, lng: 9.7679 },
];

// Indexes of the three highest-rated providers → isFeatured = true
// i3 Errand Services (4.7/10), i9 Fatafat (4.5/4), i31 Call Maimo (5.0/3)
const FEATURED_INDEXES = new Set([3, 9, 31]);

// Junk filter tags not worth exposing in description
const SKIP_CATEGORIES = new Set([
  'Delivery services',
  'Service establishments',
  'Companies',
  'Consumer advice centers',
  'Software companies',
  'Shipping and mailing services',
  'Markets',
]);

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '') return null;
  const clean = raw.trim().replace(/[\s\-.]/g, '');
  if (clean.startsWith('+237')) return clean;
  if (clean.startsWith('237')) return '+' + clean;
  return '+237' + clean;
}

function placeholderPhone(index: number): string {
  // Generates +237690XXXXXX — never conflicts with real 6XX numbers used above
  return `+237690${String(index).padStart(6, '0')}`;
}

function mapRegion(state: string): string {
  if (state === 'Southwest') return 'South West';
  if (state === 'Northwest') return 'North West';
  return state;
}

function mapProviderType(
  type: string,
  category: string,
): 'independent_rider' | 'courier_company' | 'logistics_company' {
  if (type === 'Independent Rider') return 'independent_rider';
  if (category.includes('Logistics services') || category.includes('Shipping companies')) {
    return 'logistics_company';
  }
  return 'courier_company';
}

function buildDescription(category: string): string | null {
  const tags = category
    .split(',')
    .map((c) => c.trim())
    .filter((c) => !SKIP_CATEGORIES.has(c));
  return tags.length > 0 ? tags.join(', ') : null;
}

const REGION_CAPITALS: Record<string, string> = {
  Centre: 'Yaoundé',
  Adamawa: 'Ngaoundéré',
  North: 'Garoua',
  'Far North': 'Maroua',
  South: 'Ebolowa',
  East: 'Bertoua',
  West: 'Bafoussam',
  'North West': 'Bamenda',
  'South West': 'Buea',
  Littoral: 'Douala',
};

function resolveCity(city: string | null, state: string): string {
  if (city) return city;
  const region = mapRegion(state);
  return REGION_CAPITALS[region] ?? region;
}

export async function seedProviders(prisma: PrismaClient): Promise<void> {
  const providerRole = await prisma.role.findFirst({ where: { code: 'provider' } });
  if (!providerRole) throw new Error('provider role not found — seed roles before providers');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < PROVIDERS.length; i++) {
    const row = PROVIDERS[i];

    const validPhone = normalizePhone(row.phone);
    const userPhone = validPhone ?? placeholderPhone(i);

    // Only hash the password when the user doesn't exist yet — argon2 is slow
    // and there is no reason to re-hash on every re-seed.
    const existingUser = await prisma.user.findFirst({
      where: { email: row.email },
      select: { id: true },
    });

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const passwordHash = await argon2.hash(row.password);
      const newUser = await prisma.user.create({
        data: {
          fullName: row.name,
          email: row.email,
          phone: userPhone,
          passwordHash,
          accountStatus: 'active',
          phoneVerifiedAt: new Date(),
        },
      });
      userId = newUser.id;
    }

    // UserRole: use findFirst+create to avoid compound-null upsert issues
    const existingRole = await prisma.userRole.findFirst({
      where: { userId, roleId: providerRole.id, agencyId: null },
    });
    if (!existingRole) {
      await prisma.userRole.create({
        data: { userId, roleId: providerRole.id },
      });
    }

    const providerType = mapProviderType(row.type, row.category_name);
    const baseCity = resolveCity(row.city, row.state);
    const serviceCoverage = mapRegion(row.state) + ' region';
    const description = buildDescription(row.category_name);
    const ratingAverage = row.star_count ?? 0;
    const ratingCount = row.rating_count ?? 0;
    const verificationStatus: VerificationStatus = ratingAverage > 0 ? VerificationStatus.verified : VerificationStatus.unverified;
    const isFeatured = FEATURED_INDEXES.has(i);

    // Check if profile already exists and whether any tracked field has changed.
    const existingProfile = await prisma.providerProfile.findFirst({
      where: { userId },
      select: {
        id: true, providerType: true, displayName: true, baseCity: true,
        serviceCoverage: true, ratingAverage: true, ratingCount: true,
        verificationStatus: true, isFeatured: true,
      },
    });

    const profileData = {
      providerType,
      displayName: row.name,
      description,
      serviceCoverage,
      baseCity,
      phoneNumber: validPhone,
      businessAddress: row.address,
      businessLat: row.lat,
      businessLng: row.lng,
      priceInTown: 1000,
      priceInRegion: 1500,
      ratingAverage,
      ratingCount,
      verificationStatus,
      availabilityStatus: AvailabilityStatus.available,
      isFeatured,
    };

    if (!existingProfile) {
      await prisma.providerProfile.create({ data: { userId, ...profileData } });
      created++;
    } else {
      // Only write to DB if at least one tracked field differs
      const changed =
        existingProfile.providerType !== providerType ||
        existingProfile.displayName !== row.name ||
        existingProfile.baseCity !== baseCity ||
        existingProfile.serviceCoverage !== serviceCoverage ||
        Number(existingProfile.ratingAverage) !== ratingAverage ||
        existingProfile.ratingCount !== ratingCount ||
        existingProfile.verificationStatus !== verificationStatus ||
        existingProfile.isFeatured !== isFeatured;

      if (changed) {
        await prisma.providerProfile.update({ where: { id: existingProfile.id }, data: profileData });
        updated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`✓ Providers seeded — ${created} created, ${updated} updated, ${skipped} unchanged`);
}
