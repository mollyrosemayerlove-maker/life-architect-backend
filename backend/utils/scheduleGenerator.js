// Generates a mock schedule based on constraints. 
// In a full implementation, this uses algorithmic loops or a secondary prompt to map constraints to specific block objects.

export const generateWeeklySchedule = (constraints) => {
  const blocks = [];
  const days = constraints.work_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  days.forEach(day => {
    // Scaffold Work Block
    if (constraints.work_start_time && constraints.work_end_time) {
      blocks.push({
        day_of_week: day,
        start_time: constraints.work_start_time,
        end_time: constraints.work_end_time,
        block_type: "work",
        description: "Focused Work Block",
        source: "ai_suggestion",
        is_locked: false,
        completed: false
      });
    }

    // Gym Block
    if (constraints.gym_days && constraints.gym_days.includes(day)) {
      if (constraints.gym_start_time && constraints.gym_end_time) {
        blocks.push({
          day_of_week: day,
          start_time: constraints.gym_start_time,
          end_time: constraints.gym_end_time,
          block_type: "workout",
          description: "Gym Time",
          source: "ai_suggestion",
          is_locked: false,
          completed: false
        });
      }
    }
    
    // Sleep Block
    if (constraints.preferred_sleep_start && constraints.preferred_sleep_end) {
       blocks.push({
        day_of_week: day,
        start_time: constraints.preferred_sleep_start,
        end_time: "23:59:59", // simplification
        block_type: "sleep",
        description: "Sleep",
        source: "ai_suggestion",
        is_locked: false,
        completed: false
      });
    }
  });

  return blocks;
};
