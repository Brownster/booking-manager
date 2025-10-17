import { query } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';

const createTestAccount = async () => {
  try {
    console.log('Creating test account...\n');

    // 1. Create test tenant
    const tenantResult = await query(
      `INSERT INTO tenants (id, name, slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name
       RETURNING *`,
      ['00000000-0000-0000-0000-000000000001', 'Test Company', 'test-company']
    );
    const tenant = tenantResult.rows[0];
    console.log('✓ Tenant created:', { id: tenant.id, name: tenant.name, slug: tenant.slug });

    // 2. Create admin user
    const passwordHash = await hashPassword('Password123!');
    const userResult = await query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (tenant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash
       RETURNING *`,
      [
        '00000000-0000-0000-0000-000000000002',
        tenant.id,
        'admin@test.com',
        passwordHash,
        'Admin',
        'User',
        'admin',
        'active'
      ]
    );
    const user = userResult.rows[0];
    console.log('✓ User created:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`
    });

    // 3. Assign Owner role to user
    const ownerRole = await query(
      `SELECT id FROM roles WHERE name = 'Owner' AND tenant_id = $1`,
      [tenant.id]
    );

    if (ownerRole.rows.length > 0) {
      await query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [user.id, ownerRole.rows[0].id]
      );
      console.log('✓ Owner role assigned');
    } else {
      console.log('⚠ Warning: Owner role not found (run migrations first)');
    }

    console.log('\n🎉 Test account created successfully!\n');
    console.log('Login credentials:');
    console.log('─────────────────────────────────');
    console.log('Email:     admin@test.com');
    console.log('Password:  Password123!');
    console.log('Tenant ID:', tenant.id);
    console.log('─────────────────────────────────\n');
    console.log('Visit: http://localhost:5173/login\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test account:', error);
    process.exit(1);
  }
};

createTestAccount();
