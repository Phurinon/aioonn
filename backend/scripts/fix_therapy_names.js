const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning and updating TherapyTypes...");

    // We'll update the first 7 IDs to match our new structure
    const types = [
        { id: 1, title: "Shoulder Flexion", category: "arm-raise", slug: "shoulder-flexion", description: "ยกแขนไปด้านหน้า" },
        { id: 2, title: "Shoulder Abduction", category: "arm-raise", slug: "shoulder-abduction", description: "กางแขนออกด้านข้าง" },
        { id: 3, title: "Elbow Rotation", category: "arm-raise", slug: "elbow-rotation", description: "หมุนข้อศอก" },
        { id: 4, title: "Balance", category: "core", slug: "balance", description: "การฝึกทรงตัว" },
        { id: 5, title: "Standing", category: "core", slug: "standing", description: "การฝึกยืน" },
        { id: 6, title: "Muscle Training", category: "exercise", slug: "muscle-training", description: "เสริมสร้างกล้ามเนื้อ" },
        { id: 7, title: "Stretching", category: "exercise", slug: "stretching", description: "การยืดเหยียด" },
    ];

    for (const type of types) {
        await prisma.therapyTypes.upsert({
            where: { id: type.id },
            update: {
                title: type.title,
                category: type.category,
                slug: type.slug,
                description: type.description
            },
            create: {
                id: type.id,
                title: type.title,
                category: type.category,
                slug: type.slug,
                description: type.description
            }
        });
        console.log(`Updated ID ${type.id}: ${type.title}`);
    }

    // Optional: Delete or soft-delete others if needed, but for now let's just ensure these 7 exist.
    console.log("Database update complete.");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
