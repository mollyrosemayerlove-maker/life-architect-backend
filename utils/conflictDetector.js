// Detects overlaps in schedule block array

export const detectConflicts = (scheduleBlocks) => {
  const conflicts = [];
  
  // Group by day
  const blocksByDay = {};
  scheduleBlocks.forEach(b => {
    if (!blocksByDay[b.day_of_week]) blocksByDay[b.day_of_week] = [];
    blocksByDay[b.day_of_week].push(b);
  });

  // Check each day for overlaps
  Object.keys(blocksByDay).forEach(day => {
    const blocks = blocksByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i+1];

      // Simple string comparison for HH:MM
      if (current.end_time > next.start_time) {
        conflicts.push({
          block_type: current.block_type,
          day: day,
          time_range: `${current.start_time}-${current.end_time}`,
          issue: `Overlaps with ${next.block_type} (${next.start_time}-${next.end_time})`,
          severity: "high"
        });
      }
    }
  });

  return conflicts;
};
