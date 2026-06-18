import { pool } from '../config/database';
import bcrypt from 'bcrypt';

async function addUser() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const matricula = '20243l601013';
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    
    const userResult = await client.query(`
      INSERT INTO usuarios (identificador, password_hash, rol, requiere_cambio_password)
      VALUES ($1, $2, 'ALUMNO', true)
      ON CONFLICT (identificador) DO NOTHING
      RETURNING id
    `, [matricula, hash]);

    if (userResult.rows.length > 0) {
      await client.query(`
        INSERT INTO alumnos (matricula, usuario_id, nombre_completo, carrera)
        VALUES ($1, $2, 'Egapo Estudiante', 'Ingeniería en Desarrollo de Software')
        ON CONFLICT (matricula) DO NOTHING
      `, [matricula, userResult.rows[0].id]);
      console.log('Usuario agregado exitosamente.');
    } else {
      console.log('El usuario ya existía en la base de datos.');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error insertando usuario:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

addUser();
