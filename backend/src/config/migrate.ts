import fs from 'fs';
import path from 'path';
import { pool } from './database';

// Ejecuta todas las migrations SQL en orden
async function migrate() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Ejecutando ${files.length} migrations...`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await pool.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (error: any) {
      // Ignorar errores de "ya existe"
      if (error.code === '42P07' || error.code === '42710') {
        console.log(`  ~ ${file} (ya existe, omitido)`);
      } else {
        console.error(`  ✗ ${file}:`, error.message);
        throw error;
      }
    }
  }

  console.log('Migrations completadas.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Error en migrations:', err);
  process.exit(1);
});
