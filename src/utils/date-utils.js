/**
 * Date Utilities
 */

/**
 * Filter by Time Range
 */
function filterByTimeRange(data, range, date = null) {
  if (!data || data.length === 0) return [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  return data.filter(log => {
    if (!log.work_date) return false;

    const logDate = new Date(log.work_date);
    const logYear = logDate.getFullYear();
    const logMonth = logDate.getMonth() + 1;
    const logDay = logDate.getDate();

    if (range === 'day') {
      // Specific day (use date if provided, otherwise use today)
      const targetDate = date ? new Date(date) : now;
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();
      return logYear === targetYear && logMonth === targetMonth && logDay === targetDay;
    } else if (range === 'month') {
      // Specific month
      const targetYear = date ? new Date(date).getFullYear() : currentYear;
      const targetMonth = date ? new Date(date).getMonth() + 1 : currentMonth;
      return logYear === targetYear && logMonth === targetMonth;
    } else if (range === 'year') {
      // Specific year
      const targetYear = date ? parseInt(date) : currentYear;
      return logYear === targetYear;
    }

    return false;
  });
}

/**
 * Calculate Summary
 */
function calculateSummary(data) {
  if (!data || data.length === 0) {
    return {
      totalHours: 0,
      totalComps: 0,
      totalKeys: 0,
      totalEffects: 0,
      totalDays: 0
    };
  }

  const uniqueDates = new Set();
  let totalHours = 0;
  let totalComps = 0;
  let totalKeys = 0;
  let totalEffects = 0;

  data.forEach(log => {
    if (log.work_date) {
      uniqueDates.add(log.work_date);
      totalHours += log.work_hours || 0;
      totalComps += log.composition_count || 0;
      totalKeys += log.keyframe_count || 0;
      totalEffects += log.effect_count || 0;
    }
  });

  return {
    totalHours,
    totalComps,
    totalKeys,
    totalEffects,
    totalDays: uniqueDates.size
  };
}