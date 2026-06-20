import { PrismaClient } from '@prisma/client';

interface LocationData {
  name: string;
  towns: { name: string; quarters: string[] }[];
}

const LOCATIONS: LocationData[] = [
  {
    name: 'Littoral',
    towns: [
      {
        name: 'Douala I',
        quarters: ['Bonanjo', 'Akwa', 'Bali Centre', 'Ndogbati I', 'Camp Sic', 'Cité des Cocotiers'],
      },
      {
        name: 'Douala II',
        quarters: ['Deïdo', 'Bali', 'Nkongmondo', 'Bonassama', 'Ndogpassi I', 'Soboum', 'Ngodi'],
      },
      {
        name: 'Douala III',
        quarters: ['Logbessou', 'Ndogpassi II', 'Ndogpassi III', 'PK14', 'PK17', 'Cité Sic', 'Ndoghem', 'Njombe', 'Mboppi'],
      },
      {
        name: 'Douala IV',
        quarters: ['Bonabéri', 'Nyala', 'Bekoko', 'Bonalea', 'Manoka', 'Cité de la Paix'],
      },
      {
        name: 'Douala V',
        quarters: ['Bonamoussadi', 'Makepe', 'Kotto', 'Cité des Palmiers', 'Ndokoti', 'Logpom', 'Bepanda', 'Japoma', 'Cité Cicam'],
      },
      {
        name: 'Edéa I',
        quarters: ['Centre Edéa', 'Mbokompé', 'Dizangué'],
      },
      {
        name: 'Edéa II',
        quarters: ['Edéa II Rural', 'Mouanko'],
      },
      {
        name: 'Nkongsamba I',
        quarters: ['Centre Nkongsamba', 'Nkongsamba Nord'],
      },
      {
        name: 'Nkongsamba II',
        quarters: ['Nkongsamba II', 'Tombel Route'],
      },
      {
        name: 'Mbanga',
        quarters: ['Centre Mbanga', 'Njombé'],
      },
    ],
  },
  {
    name: 'Centre',
    towns: [
      {
        name: 'Yaoundé I',
        quarters: ['Centre Administratif', 'Ekoudou', 'Nlongkak', 'Messa Carrière', 'Mvog Ada'],
      },
      {
        name: 'Yaoundé II',
        quarters: ['Tsinga', 'Mvan', 'Elig-Effa', 'Oliga', 'Etam Bafia', 'Mimboman I'],
      },
      {
        name: 'Yaoundé III',
        quarters: ['Messa', 'Nkol Eton', 'Djoungolo', 'Mbala', 'Biteng', 'Mvolye'],
      },
      {
        name: 'Yaoundé IV',
        quarters: ['Mvog-Mbi', 'Biyem-Assi', 'Mimboman II', 'Nkoldongo', 'Etoudi', 'Ekounou'],
      },
      {
        name: 'Yaoundé V',
        quarters: ['Essos', 'Efoulan', 'Nkomo', 'Les Acacias', 'Nkol Eton II', 'Emana'],
      },
      {
        name: 'Yaoundé VI',
        quarters: ['Biyem-Assi Haute Cité', 'Simbock', 'Mendong', 'Nkol-Bikok', 'Cité Verte'],
      },
      {
        name: 'Yaoundé VII',
        quarters: ['Nkolbisson', 'Odza', 'Soa Ville', 'Olembe', 'Mbankomo'],
      },
      {
        name: 'Mbalmayo',
        quarters: ['Centre Mbalmayo', 'Nkoemvone'],
      },
      {
        name: 'Obala',
        quarters: ['Centre Obala'],
      },
      {
        name: 'Bafia',
        quarters: ['Centre Bafia'],
      },
    ],
  },
  {
    name: 'West',
    towns: [
      {
        name: 'Bafoussam I',
        quarters: ['Centre Commercial', 'Djétoum', 'Tamdja', 'Ndiangdam', 'Tougang', 'Kouokoua'],
      },
      {
        name: 'Bafoussam II',
        quarters: ['Bafoussam II Est', 'Bafoussam II Ouest', 'Bamendou Route', 'Kamkop'],
      },
      {
        name: 'Bafoussam III',
        quarters: ['Bafoussam III Rural', 'Koptchou', 'Baleng'],
      },
      {
        name: 'Dschang',
        quarters: ['Centre Dschang', 'Fomopéa', 'Foto', 'Bafou'],
      },
      {
        name: 'Foumban',
        quarters: ['Centre Foumban', 'Koutaba', 'Malantouen', 'Njifen'],
      },
      {
        name: 'Mbouda',
        quarters: ['Centre Mbouda', 'Babadjou Route', 'Galim'],
      },
      {
        name: 'Bangangté',
        quarters: ['Centre Bangangté', 'Bazou'],
      },
      {
        name: 'Tonga',
        quarters: ['Centre Tonga', 'Bafang Route'],
      },
    ],
  },
  {
    name: 'South West',
    towns: [
      {
        name: 'Buea',
        quarters: ['Great Soppo', 'Molyko', 'Mile 16', 'Bonduma', 'Buea Town', 'Bokwango', 'Muea', 'Mile 17'],
      },
      {
        name: 'Limbé I',
        quarters: ['Down Beach', 'New Town', 'Bota', 'Newlayout', 'CP Quarter'],
      },
      {
        name: 'Limbé II',
        quarters: ['Mabeta', 'Batoke', 'New Town Limbé', 'Lumpsum'],
      },
      {
        name: 'Limbé III',
        quarters: ['Limbé III Rural', 'Tiko Route'],
      },
      {
        name: 'Kumba I',
        quarters: ['Fiango', 'Town Ground', 'Kumba Centre', 'Mbeng'],
      },
      {
        name: 'Kumba II',
        quarters: ['Kumba II', 'Mbonge Road'],
      },
      {
        name: 'Kumba III',
        quarters: ['Kumba III Rural'],
      },
      {
        name: 'Tiko',
        quarters: ['Centre Tiko', 'Airport Quarter', 'Likomba'],
      },
      {
        name: 'Muyuka',
        quarters: ['Centre Muyuka', 'Ekona'],
      },
    ],
  },
  {
    name: 'North West',
    towns: [
      {
        name: 'Bamenda I',
        quarters: ['Commercial Avenue', 'Up Station', 'Hospital Area', 'Old Town', 'Cow Street'],
      },
      {
        name: 'Bamenda II',
        quarters: ['Nkwen', 'Ntamulung', 'Mankon', 'Mile 2'],
      },
      {
        name: 'Bamenda III',
        quarters: ['Bambili', 'Tubah', 'Bambui', 'Santa'],
      },
      {
        name: 'Wum',
        quarters: ['Centre Wum'],
      },
      {
        name: 'Kumbo',
        quarters: ['Centre Kumbo', 'Nso Fondom'],
      },
    ],
  },
  {
    name: 'South',
    towns: [
      {
        name: 'Ebolowa I',
        quarters: ['Centre Ebolowa', "Nko'ovos", 'Angalé'],
      },
      {
        name: 'Ebolowa II',
        quarters: ['Ebolowa II Rural'],
      },
      {
        name: 'Sangmélima',
        quarters: ['Centre Sangmélima', 'Nkam'],
      },
      {
        name: 'Kribi I',
        quarters: ['Centre Kribi', 'Beach Kribi', 'Grand Batanga'],
      },
      {
        name: 'Kribi II',
        quarters: ['Kribi II Rural', 'Londji'],
      },
    ],
  },
  {
    name: 'East',
    towns: [
      {
        name: 'Bertoua I',
        quarters: ['Centre Bertoua', 'Haoussa Quarter', 'Madagascar'],
      },
      {
        name: 'Bertoua II',
        quarters: ['Bertoua II Rural'],
      },
      {
        name: 'Batouri',
        quarters: ['Centre Batouri', 'Colomine'],
      },
      {
        name: 'Abong-Mbang',
        quarters: ['Centre Abong-Mbang'],
      },
    ],
  },
  {
    name: 'Adamawa',
    towns: [
      {
        name: 'Ngaoundéré I',
        quarters: ['Centre Ngaoundéré', 'Baladji', 'Marché Central', 'Dang', 'Burkina'],
      },
      {
        name: 'Ngaoundéré II',
        quarters: ['Ngaoundéré II Rural', 'Martap'],
      },
      {
        name: 'Ngaoundéré III',
        quarters: ['Ngaoundéré III Rural', 'Nyambaka'],
      },
      {
        name: 'Meiganga',
        quarters: ['Centre Meiganga'],
      },
    ],
  },
  {
    name: 'North',
    towns: [
      {
        name: 'Garoua I',
        quarters: ['Centre Garoua', 'Marché Moderne', 'Plateau', 'Poumpoumré', 'Roumdé'],
      },
      {
        name: 'Garoua II',
        quarters: ['Garoua II', 'Pitoa'],
      },
      {
        name: 'Garoua III',
        quarters: ['Garoua III Rural', 'Ngong'],
      },
      {
        name: 'Guider',
        quarters: ['Centre Guider'],
      },
      {
        name: 'Poli',
        quarters: ['Centre Poli'],
      },
    ],
  },
  {
    name: 'Far North',
    towns: [
      {
        name: 'Maroua I',
        quarters: ['Domayo', 'Kakataré', 'Pont Vert', 'Makabaye'],
      },
      {
        name: 'Maroua II',
        quarters: ['Dougoi', 'Founangué', 'Zokok'],
      },
      {
        name: 'Maroua III',
        quarters: ['Maroua III Rural', 'Dogba'],
      },
      {
        name: 'Kousseri',
        quarters: ['Centre Kousseri', 'Maltam'],
      },
      {
        name: 'Mora',
        quarters: ['Centre Mora'],
      },
    ],
  },
];

export async function seedLocations(prisma: PrismaClient): Promise<void> {
  let regionCount = 0;
  let townCount = 0;
  let quarterCount = 0;

  for (const regionData of LOCATIONS) {
    const region = await prisma.region.upsert({
      where: { name: regionData.name },
      create: { name: regionData.name },
      update: { name: regionData.name },
    });
    regionCount++;

    for (const townData of regionData.towns) {
      const town = await prisma.town.upsert({
        where: { regionId_name: { regionId: region.id, name: townData.name } },
        create: { regionId: region.id, name: townData.name },
        update: { name: townData.name },
      });
      townCount++;

      for (const quarterName of townData.quarters) {
        await prisma.quarter.upsert({
          where: { townId_name: { townId: town.id, name: quarterName } },
          create: { townId: town.id, name: quarterName },
          update: { name: quarterName },
        });
        quarterCount++;
      }
    }
  }

  console.log(`✓ Locations seeded — ${regionCount} regions, ${townCount} towns, ${quarterCount} quarters`);
}
