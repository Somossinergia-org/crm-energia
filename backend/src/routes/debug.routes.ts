import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, nombre, role FROM users');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get('/tables', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    res.json({
      success: true,
      tables: result.rows.map(r => r.table_name),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get('/admin-password', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, password FROM users WHERE email = $1',
      ['admin@sinergia.es']
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      id: user.id,
      email: user.email,
      passwordHash: user.password,
      passwordLength: user.password.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post('/test-login', async (req: Request, res: Response) => {
  try {
    const bcrypt = require('bcryptjs');
    const { password } = req.body;

    const result = await query(
      'SELECT id, email, password FROM users WHERE email = $1',
      ['admin@sinergia.es']
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const user = result.rows[0];
    console.log('🔍 Testing login:');
    console.log('  - Input password:', password);
    console.log('  - Hash from DB:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('  - bcrypt.compare result:', isMatch);

    res.json({
      success: true,
      isMatch,
      message: isMatch ? 'Contraseña correcta' : 'Contraseña incorrecta',
    });
  } catch (err: any) {
    console.error('❌ Error en test-login:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
});

router.post('/test-save-token', async (req: Request, res: Response) => {
  try {
    const userId = '99593d8a-d713-4308-849d-ebd593b58e44';
    const token = 'test-token-' + Date.now();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    console.log('🔍 Testing saveRefreshToken:');
    console.log('  - userId:', userId);
    console.log('  - token:', token);
    console.log('  - expiresAt:', expiresAt);

    await query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, token, expiresAt, 'test-agent', '127.0.0.1']
    );

    res.json({
      success: true,
      message: 'Token saved successfully',
    });
  } catch (err: any) {
    console.error('❌ Error en test-save-token:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      error: err.toString(),
    });
  }
});

router.post('/test-activity', async (req: Request, res: Response) => {
  try {
    const userId = '99593d8a-d713-4308-849d-ebd593b58e44';

    console.log('🔍 Testing logActivity:');
    console.log('  - userId:', userId);

    await query(
      `INSERT INTO activity_log (user_id, action, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'test-action', 'Test description', '127.0.0.1']
    );

    res.json({
      success: true,
      message: 'Activity logged successfully',
    });
  } catch (err: any) {
    console.error('❌ Error en test-activity:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      error: err.toString(),
    });
  }
});

router.post('/test-full-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    console.log('🔍 Starting full login flow...');

    // Step 1: Find user
    console.log('Step 1: Finding user...');
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 AND activo = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('  ❌ User not found');
      return res.json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];
    console.log('  ✅ User found:', user.id);

    // Step 2: Compare password
    console.log('Step 2: Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('  ✅ Password match:', isMatch);

    if (!isMatch) {
      return res.json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Step 3: Generate tokens
    console.log('Step 3: Generating tokens...');
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nombre: user.nombre },
      'test-secret',
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      'test-refresh-secret',
      { expiresIn: '7d' }
    );
    console.log('  ✅ Tokens generated');

    // Step 4: Save refresh token
    console.log('Step 4: Saving refresh token...');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, expiresAt, 'test-agent', '127.0.0.1']
    );
    console.log('  ✅ Refresh token saved');

    // Step 5: Log activity
    console.log('Step 5: Logging activity...');
    await query(
      `INSERT INTO activity_log (user_id, action, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'login', 'Login desde test-agent', '127.0.0.1']
    );
    console.log('  ✅ Activity logged');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellidos: user.apellidos,
          role: user.role,
          foto_url: user.foto_url,
        },
      },
    });
  } catch (err: any) {
    console.error('❌ Error en test-full-login:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      error: err.toString(),
      stack: err.stack,
    });
  }
});

export default router;
