import { PrismaClient } from "../src/generated/prisma";
import { STANDARD_CHEMICALS } from "../src/lib/chemistry/chemicals";

const prisma = new PrismaClient();

// Two pools, no auth. Stable ids so re-seeding is idempotent.
async function main() {
  await prisma.pool.upsert({
    where: { id: "lynn" },
    update: {},
    create: {
      id: "lynn",
      name: "Lynn's Pool",
      volumeGallons: 3700, // measured: 9' x 13' x 52"
      surface: "plaster", // editable in the app
      stripId: "easytest-7in1",
      chemicals: STANDARD_CHEMICALS as object,
    },
  });

  await prisma.pool.upsert({
    where: { id: "madeline" },
    update: {},
    create: {
      id: "madeline",
      name: "Madeline's Pool",
      volumeGallons: 15000, // placeholder — set via the volume estimator in the app
      surface: "plaster",
      stripId: "easytest-7in1",
      chemicals: STANDARD_CHEMICALS as object,
    },
  });

  console.log("Seeded Lynn's Pool and Madeline's Pool.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
