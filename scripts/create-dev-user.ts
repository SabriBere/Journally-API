import bcrypt from "bcrypt";
import prisma from "../api/db/db";

const SALT_ROUNDS = Number(process.env.SALT_ROUND) || 10;
const email = process.env.DEV_USER_EMAIL || "dev@journally.local";
const userName = process.env.DEV_USER_NAME || "devuser";
const password = process.env.DEV_USER_PASSWORD || "dev12345";

async function main() {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            user_name: userName,
            password: hashedPassword,
        },
        create: {
            email,
            user_name: userName,
            password: hashedPassword,
        },
    });

    console.log("Dev user ready");
    console.log(`email: ${user.email}`);
    console.log(`user_name: ${user.user_name}`);
    console.log(`password: ${password}`);
}

main()
    .catch((error) => {
        console.error("Could not create dev user:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
