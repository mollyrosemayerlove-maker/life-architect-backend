import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Connect to PostgreSQL. You can set DATABASE_URL in your backend/.env file.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/life_architect';

const client = new Client({
  connectionString
});

async function runSeed() {
  try {
    await client.connect();
    console.log("✅ Connected to the database. Starting seed...");

    console.log("⏳ Recreating tables...");
    await client.query(`
      DROP TABLE IF EXISTS habit_completion CASCADE;
      DROP TABLE IF EXISTS energy_levels CASCADE;
      DROP TABLE IF EXISTS chat_history CASCADE;
      DROP TABLE IF EXISTS schedule_blocks CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        constraints_json JSONB,
        ai_profile_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE schedule_blocks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        day_of_week VARCHAR(20),
        start_time TIME,
        end_time TIME,
        block_type VARCHAR(50),
        description TEXT,
        source VARCHAR(50),
        is_locked BOOLEAN DEFAULT false
      );

      CREATE TABLE chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_message TEXT,
        ai_response_json JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE energy_levels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        time_of_day TIME,
        energy_rating INTEGER CHECK (energy_rating >= 1 AND energy_rating <= 5),
        logged_date DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE habit_completion (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        habit_name VARCHAR(255),
        completed_date DATE DEFAULT CURRENT_DATE
      );
    `);
    console.log("✅ Tables created successfully.");

    // 2. Insert Users
    console.log("⏳ Inserting Users...");
    const u1Constraints = {
      work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      work_start_time: "06:00",
      work_end_time: "16:00",
      commute_home_to_work_minutes: 15,
      commute_work_to_gym_minutes: 15,
      commute_gym_to_home_minutes: 30,
      gym_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      gym_start_time: "16:15",
      gym_end_time: "18:00",
      morning_buffer_minutes: 45,
      evening_buffer_minutes: 120,
      personal_business_hours_per_day: 1.5,
      preferred_sleep_start: "22:30",
      preferred_sleep_end: "06:00",
      preferred_goal: "Business Growth"
    };

    const usersQuery = `
      INSERT INTO users (email, password, constraints_json, ai_profile_json)
      VALUES 
        ($1, 'hashed_pw_placeholder', $2, '{"role": "Driven Professional"}'),
        ($3, 'hashed_pw_placeholder', '{"work_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "work_start_time": "09:00", "work_end_time": "17:00", "preferred_goal": "Work-Life Balance"}', '{"role": "Corporate 9-5"}'),
        ($4, 'hashed_pw_placeholder', '{"work_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "preferred_goal": "Startup Grind", "flexible_hours": true}', '{"role": "Entrepreneur"}')
      RETURNING id;
    `;
    const usersRes = await client.query(usersQuery, [
      'user1_example@life.test', JSON.stringify(u1Constraints), 
      'user2_corporate@life.test', 
      'user3_entrepreneur@life.test'
    ]);
    const user1Id = usersRes.rows[0].id;
    console.log("✅ Users inserted.");

    // 3. Insert blocks for User 1 (1 week)
    console.log("⏳ Inserting Schedule Blocks...");
    const blocksParams = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Helper to add block format strings for batch insert
    const addBlock = (day, start, end, type, desc) => {
      blocksParams.push(`(${user1Id}, '${day}', '${start}', '${end}', '${type}', '${desc}', 'AI', false)`);
    };

    days.forEach(day => {
      addBlock(day, '05:10', '05:55', 'routine', 'Morning Routine (shower, journal, breakfast)');
      addBlock(day, '05:55', '06:10', 'commute', 'Commute to Work');
      addBlock(day, '06:10', '16:00', 'work', 'Focused Work Block'); // Shifted start time slightly to reflect actual arrival
      addBlock(day, '16:00', '16:15', 'commute', 'Commute Work to Gym');
      addBlock(day, '16:15', '18:00', 'workout', 'Gym Time');
      addBlock(day, '18:00', '18:30', 'commute', 'Commute Gym to Home');
      addBlock(day, '18:30', '20:00', 'business', 'Personal Business Focus');
      addBlock(day, '20:00', '20:45', 'routine', 'Dinner prep and dishes');
      addBlock(day, '22:30', '06:00', 'sleep', 'Sleep'); 
    });

    addBlock('Saturday', '08:00', '12:00', 'business', 'Weekend Business Sprint');
    addBlock('Saturday', '12:00', '22:30', 'flex', 'Flexible Weekend Time');
    addBlock('Sunday', '19:00', '20:00', 'planning', 'Weekly Planning Session');
    addBlock('Sunday', '20:00', '22:30', 'flex', 'Evening Wind-down');

    await client.query(`
      INSERT INTO schedule_blocks (user_id, day_of_week, start_time, end_time, block_type, description, source, is_locked)
      VALUES ${blocksParams.join(',')}
    `);
    console.log("✅ Schedule blocks inserted for User 1.");

    // 4. Chat History
    console.log("⏳ Inserting Chat History...");
    await client.query(`
      INSERT INTO chat_history (user_id, user_message, ai_response_json, timestamp)
      VALUES 
        (${user1Id}, 'I want to shift my business time earlier today.', '{"message": "I can swap your dinner and business time, or cut your workout 30m short. What do you prefer?"}', NOW() - INTERVAL '3 days'),
        (${user1Id}, 'Swap dinner and business time.', '{"message": "Done. Business is now 18:30-20:00 and Dinner is 20:00-20:45. Validated without overlaps."}', NOW() - INTERVAL '3 days')
    `);
    
    // 5. Energy Levels
    await client.query(`
      INSERT INTO energy_levels (user_id, time_of_day, energy_rating, logged_date)
      VALUES 
        (${user1Id}, '06:30', 4, CURRENT_DATE - 1),
        (${user1Id}, '14:00', 2, CURRENT_DATE - 1),
        (${user1Id}, '17:00', 5, CURRENT_DATE - 1),
        (${user1Id}, '20:00', 3, CURRENT_DATE - 1)
    `);

    // 6. Habit Completion
    await client.query(`
      INSERT INTO habit_completion (user_id, habit_name, completed_date)
      VALUES 
        (${user1Id}, 'journal', CURRENT_DATE - 1),
        (${user1Id}, 'workout', CURRENT_DATE - 1),
        (${user1Id}, 'business_focus', CURRENT_DATE - 1)
    `);
    console.log("✅ Chat, Energy, and Habit data inserted.");

    console.log("🎉 Database seeded successfully! Your MVP data is ready to use.");
  } catch (err) {
    console.error("❌ Seeding error:", err);
  } finally {
    await client.end();
  }
}

runSeed();
