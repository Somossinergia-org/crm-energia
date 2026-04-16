const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Ejecutando migraciones de base de datos...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`📄 Ejecutando: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ ${file} completado\n`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⚠️  ${file} ya existe (saltando)\n`);
        } else {
          throw err;
        }
      }
    }

    console.log('🎉 ¡Todas las migraciones completadas!\n');

    // Verificar tablas
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Tablas creadas:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
