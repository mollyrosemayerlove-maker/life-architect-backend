import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

console.log("⚠️ USING IN-MEMORY MOCK DB ADAPTER ⚠️");

const db = {
  users: [],
  schedule_blocks: [],
  chat_history: []
};

const pool = {
  query: async (text, params) => {
    text = text.trim().toLowerCase();
    
    if (text.startsWith('insert into users')) {
      const email = params[0];
      const passwordHash = params[1];
      if (db.users.find(u => u.email === email)) {
        const err = new Error('duplicate key');
        err.code = '23505';
        throw err;
      }
      const newUser = { 
        id: crypto.randomUUID(), email, password_hash: passwordHash, 
        work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 
        work_start_time: '06:00', work_end_time: '16:00', 
        commute_home_to_work_minutes: 15, commute_work_to_gym_minutes: 15, commute_gym_to_home_minutes: 30, 
        gym_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 
        gym_start_time: '16:15', gym_end_time: '18:00', 
        preferred_sleep_start: '22:30', preferred_sleep_end: '06:00' 
      };
      db.users.push(newUser);
      return { rows: [newUser] };
    }

    if (text.startsWith('select id, email, password_hash from users')) {
      const user = db.users.find(u => u.email === params[0]);
      return { rows: user ? [user] : [] };
    }

    if (text.startsWith('select * from users')) {
       let user = db.users.find(u => u.id === params[0]);
       if (!user) {
         user = { id: params[0], email: 'test@example.com', work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], work_start_time: '06:00', work_end_time: '16:00', commute_home_to_work_minutes: 15, commute_work_to_gym_minutes: 15, commute_gym_to_home_minutes: 30, gym_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], gym_start_time: '16:15', gym_end_time: '18:00', preferred_sleep_start: '22:30', preferred_sleep_end: '06:00' };
       }
       return { rows: [user] };
    }

    if (text.startsWith('delete from schedule_blocks')) {
      const userId = params[0];
      db.schedule_blocks = db.schedule_blocks.filter(b => b.user_id !== userId || b.is_locked);
      return { rows: [] };
    }

    if (text.includes('insert into schedule_blocks')) {
      const newBlock = {
        id: crypto.randomUUID(),
        user_id: params[0],
        day_of_week: params[1],
        start_time: params[2],
        end_time: params[3],
        block_type: params[4],
        description: params[5],
        source: params[6],
        is_locked: params[7]
      };
      db.schedule_blocks.push(newBlock);
      return { rows: [newBlock] };
    }

    if (text.startsWith('select * from schedule_blocks')) {
      const blocks = db.schedule_blocks.filter(b => b.user_id === params[0]);
      return { rows: blocks };
    }

    if (text.startsWith('update schedule_blocks set is_locked')) {
      const b = db.schedule_blocks.find(x => x.id === params[1]);
      if (b) b.is_locked = params[0];
      return { rows: b ? [b] : [] };
    }

    if (text.startsWith('select now()')) {
      return { rows: [{ now: new Date().toISOString() + ' (IN-MEMORY MOCK)' }] };
    }

    return { rows: [] };
  },
  on: (event, handler) => {
    if (event === 'connect') handler();
  }
};

export default pool;
