export const seedDatabase = async () => {
  console.log('Seed data not implemented for Phase 1.'); // eslint-disable-line no-console
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Database seed failed', error); // eslint-disable-line no-console
      process.exit(1);
    });
}
