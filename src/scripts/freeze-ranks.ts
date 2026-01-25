import { pool } from '@db/index.js';
import { fetchOsuMeFromId } from '@services/osu.js';

async function freezeRanks() {
  console.log('Starting rank freeze process...');

  try {
    const { rows: users } = await pool.query(
      'SELECT user_id, username FROM users WHERE registered = true'
    );

    console.log(`Found ${users.length} registered players`);

    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        console.log(`Updating ranks for ${user.username} (${user.user_id})...`);

        const osuData = await fetchOsuMeFromId(String(user.user_id));

        await pool.query(
          `
          UPDATE users
          SET
            global_rank = $2,
            country_rank = $3,
            updated_at = now()
          WHERE user_id = $1
          `,
          [
            user.user_id,
            osuData.statistics?.global_rank ?? null,
            osuData.statistics?.country_rank ?? null,
          ]
        );

        successCount++;
      } catch (err: any) {
        failureCount++;
        console.error(`Failed to update ${user.username}:`, err.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\nRank freeze complete!');
    if (failureCount > 0) {
      console.log(`Success: ${successCount}`);
      console.log(`Failures: ${failureCount}`);
    }
  } catch (err: any) {
    console.error('Error during rank freeze:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

freezeRanks();
