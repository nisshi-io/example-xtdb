import postgres from 'postgres';
import transit from 'transit-js';

const OID = {
  boolean: 16,
  int4: 23,
  int8: 20,
  text: 25,
  json: 114,
  float8: 701,
  timestamptz: 1184,
  transit: 16384,
};

var sql = postgres({
  host: '127.0.0.1',
  port: 5440,
  database: 'xtdb',
  fetch_types: false,
  types: {
    transit: {
      to: OID.transit,
      from: [OID.transit],
      serialize: (v) => transit.writer('json').write(v),
      parse: (v) => transit.reader('json').read(v),
    },
  },
});

// Function to generate a random name
function generateRandomName() {
  const firstNames = [
    'John',
    'Jane',
    'Michael',
    'Sarah',
    'David',
    'Emily',
    'Chris',
    'Jessica',
    'Matt',
    'Ashley',
    'Ryan',
    'Amanda',
    'Josh',
    'Lauren',
    'Tyler',
    'Megan',
    'Kevin',
    'Rachel',
    'Jake',
    'Nicole',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

// Function to generate a random age between 18 and 65
function generateRandomAge() {
  return Math.floor(Math.random() * (65 - 18 + 1)) + 18;
}

// Function to create a batch of users
function createUserBatch(startId, batchSize) {
  const users = [];
  for (let i = 0; i < batchSize; i++) {
    users.push({
      _id: sql.typed.transit(startId + i),
      name: sql.typed.transit(generateRandomName()),
      age: sql.typed.transit(generateRandomAge()),
    });
  }
  return users;
}

async function insertUsersInBatches() {
  const totalUsers = 100000;
  const batchSize = 100;
  const totalBatches = Math.ceil(totalUsers / batchSize);

  console.log(
    `Starting batch insert of ${totalUsers} users in ${totalBatches} batches of ${batchSize} users each...`,
  );

  const startTime = Date.now();

  for (let batch = 0; batch < totalBatches; batch++) {
    const startId = batch * batchSize + 1;
    const currentBatchSize = Math.min(
      batchSize,
      totalUsers - batch * batchSize,
    );

    console.log(
      `Processing batch ${batch + 1}/${totalBatches}: IDs ${startId} to ${startId + currentBatchSize - 1}`,
    );

    const batchStartTime = Date.now();

    try {
      const users = createUserBatch(startId, currentBatchSize);
      await sql`insert into users ${sql(users)}`;

      const batchEndTime = Date.now();
      const batchDuration = batchEndTime - batchStartTime;

      console.log(`✓ Batch ${batch + 1} completed in ${batchDuration}ms`);
    } catch (error) {
      console.error(`✗ Error in batch ${batch + 1}:`, error);
      throw error; // Re-throw to stop execution
    }
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  console.log(
    `\n🎉 Successfully inserted ${totalUsers} users in ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`,
  );
  console.log(`Average: ${(totalDuration / totalUsers).toFixed(2)}ms per user`);
}

// Execute the batch insert
try {
  await insertUsersInBatches();
} catch (error) {
  console.error('Failed to insert users:', error);
} finally {
  sql.end();
}
