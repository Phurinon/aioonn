const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    try { 
        const types = await prisma.therapyTypes.findMany(); 
        console.log("DB_DATA_START");
        console.log(JSON.stringify(types, null, 2)); 
        console.log("DB_DATA_END");
    } catch (e) {
        console.error(e);
    } finally { 
        await prisma.$disconnect(); 
    } 
} 
main();
