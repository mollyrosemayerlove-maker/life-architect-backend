CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  work_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  work_start_time TIME DEFAULT '06:00',
  work_end_time TIME DEFAULT '16:00',
  commute_home_to_work_minutes INTEGER DEFAULT 15,
  commute_work_to_gym_minutes INTEGER DEFAULT 15,
  commute_gym_to_home_minutes INTEGER DEFAULT 30,
  gym_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  gym_start_time TIME DEFAULT '16:15',
  gym_end_time TIME DEFAULT '18:00',
  morning_buffer_minutes INTEGER DEFAULT 45,
  evening_buffer_minutes INTEGER DEFAULT 120,
  personal_business_hours_per_day DECIMAL(5,2) DEFAULT 1.5,
  meal_prep_and_dishes_minutes INTEGER DEFAULT 45,
  preferred_sleep_start TIME DEFAULT '22:30',
  preferred_sleep_end TIME DEFAULT '06:00',
  preferred_goal VARCHAR(50) DEFAULT 'Balance',
  ai_profile JSONB DEFAULT '{}',
  constraints_json JSONB DEFAULT '{}'
);

CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  description TEXT,
  source VARCHAR(20) DEFAULT 'ai_suggestion',
  is_locked BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response_json JSONB NOT NULL,
  ai_explanation TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE energy_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_of_day VARCHAR(20) NOT NULL,
  energy_rating INTEGER NOT NULL CHECK (energy_rating >= 1 AND energy_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habit_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_name VARCHAR(100) NOT NULL,
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_schedule ON schedule_blocks(user_id, day_of_week, start_time);
CREATE INDEX idx_user_chat ON chat_history(user_id, timestamp DESC);
CREATE INDEX idx_user_energy ON energy_levels(user_id, date);
CREATE INDEX idx_user_habits ON habit_completion(user_id, completion_date);
