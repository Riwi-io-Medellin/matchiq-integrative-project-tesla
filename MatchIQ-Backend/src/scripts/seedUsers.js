import bcrypt from "bcrypt";
import pool from "../config/db.js";
import "dotenv/config";

console.log("DB HOST:", process.env.DB_HOST);

async function seedUsers() {

    const PASSWORD = "Test12345!";
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    const values = [];

    for (let i = 1; i <= 1000; i++) {

        const email = `company${i}@test.com`;

        values.push(`(
            gen_random_uuid(),
            '${email}',
            '${hashedPassword}',
            'company',
            true,
            NOW()
        )`);
    }

    const query = `
        INSERT INTO users (id, email, password_hash, role, is_active, created_at)
        VALUES ${values.join(",")}
    `;

    await pool.query(query);

    console.log("10,000 usuarios candidatos creados");
    console.log("Password para todos:", PASSWORD);

}

seedUsers()
.then(() => {
    console.log("Seed completado");
    process.exit();
})
.catch((err) => {
    console.error(err);
    process.exit(1);
}); 

seedUsers();