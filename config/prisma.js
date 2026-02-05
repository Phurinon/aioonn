const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
// import { PrismaClient } from '@prisma/client'

dotenv.config();

const prisma = new PrismaClient();

module.exports = prisma;
