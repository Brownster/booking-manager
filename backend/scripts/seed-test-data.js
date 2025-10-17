import { query } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';

const seedTestData = async () => {
  try {
    const tenantId = '00000000-0000-0000-0000-000000000001';

    console.log('Seeding test data for tenant:', tenantId);
    console.log('');

    // Create provider users
    const providers = [];
    for (let i = 1; i <= 3; i++) {
      const password = await hashPassword('Password123!');
      const result = await query(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'provider', 'active')
         ON CONFLICT (tenant_id, email) DO UPDATE
         SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
         RETURNING *`,
        [tenantId, `provider${i}@test.com`, password, `Provider ${i}`, `Lastname${i}`]
      );
      providers.push(result.rows[0]);
      console.log(`✓ Created provider: ${result.rows[0].email}`);
    }

    // Create client users
    const clients = [];
    for (let i = 1; i <= 5; i++) {
      const password = await hashPassword('Password123!');
      const result = await query(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'client', 'active')
         ON CONFLICT (tenant_id, email) DO UPDATE
         SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
         RETURNING *`,
        [tenantId, `client${i}@test.com`, password, `Client ${i}`, `Lastname${i}`]
      );
      clients.push(result.rows[0]);
      console.log(`✓ Created client: ${result.rows[0].email}`);
    }

    // Skip calendar and appointment creation - schema mismatch

    // Create some waitlist entries
    for (let i = 0; i < 4; i++) {
      await query(
        `INSERT INTO waitlist_entries (tenant_id, client_user_id, provider_user_id, priority, status, auto_promote, notes)
         VALUES ($1, $2, $3, $4, 'active', $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          tenantId,
          clients[i % clients.length].id,
          providers[i % providers.length].id,
          ['low', 'medium', 'high'][i % 3],
          i % 2 === 0,
          `Test waitlist entry ${i + 1}`
        ]
      );
      console.log(`✓ Created waitlist entry ${i + 1}`);
    }

    console.log('');
    console.log('🎉 Test data seeded successfully!');
    console.log('');
    console.log('Available test users:');
    console.log('─────────────────────────────────');
    console.log('Providers:');
    providers.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.email} (Password123!)`);
    });
    console.log('');
    console.log('Clients:');
    clients.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.email} (Password123!)`);
    });
    console.log('─────────────────────────────────');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
};

seedTestData();
