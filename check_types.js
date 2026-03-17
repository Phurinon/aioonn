const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.therapyTypes.findMany({
    where: { id: { in: [15, 16, 17, 18, 19, 20] } }
  });
  console.log(JSON.stringify(types, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
