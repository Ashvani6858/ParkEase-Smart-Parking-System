
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const locations = [
  {
    name: 'Delhi Central Parking',
    address: 'Connaught Place, New Delhi',
    city: 'Delhi',
    hourlyRate: 40
  },
  {
    name: 'Noida Sector 18 Parking',
    address: 'Sector 18, Noida',
    city: 'Noida',
    hourlyRate: 30
  },
  {
    name: 'Pari Chowk Parking',
    address: 'Pari Chowk, Greater Noida',
    city: 'Greater Noida',
    hourlyRate: 25
  },
  {
    name: 'Cyber City Parking',
    address: 'DLF Cyber City, Gurugram',
    city: 'Gurugram',
    hourlyRate: 50
  },
  {
    name: 'Jamner Main Market Parking',
    address: 'Main Market, Jamner',
    city: 'Jamner',
    hourlyRate: 20
  }
];

async function main() {
  console.log('Adding parking locations...');

  for (const loc of locations) {
    const existing = await prisma.parkingLocation.findFirst({
      where: {
        name: loc.name,
        city: loc.city
      }
    });

    if (existing) {
      console.log(`Already exists: ${loc.city}`);
      continue;
    }

    await prisma.parkingLocation.create({
      data: {
        ...loc,
        description: `Demo parking facility in ${loc.city}`,
        openTime: '06:00',
        closeTime: '23:00',
        floors: {
          create: [
            {
              name: 'Ground Floor',
              slots: {
                create: Array.from({ length: 15 }, (_, i) => ({
                  slotNumber: `G${i + 1}`,
                  type: 'CAR',
                  status: 'AVAILABLE'
                }))
              }
            },
            {
              name: 'First Floor',
              slots: {
                create: Array.from({ length: 15 }, (_, i) => ({
                  slotNumber: `F${i + 1}`,
                  type: 'CAR',
                  status: 'AVAILABLE'
                }))
              }
            }
          ]
        }
      }
    });

    console.log(`Added: ${loc.city}`);
  }

  console.log('All parking locations added!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
