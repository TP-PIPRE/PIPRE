/** A student enrolled in several groups must appear once in the global ranking. */
export function mergeRankings<T extends { studentId: string; totalScore: number; position: number }>(groups: T[][]): T[] {
  const byStudent = new Map<string, T>();
  for (const entry of groups.flat()) {
    const previous = byStudent.get(entry.studentId);
    if (!previous || entry.totalScore > previous.totalScore) byStudent.set(entry.studentId, entry);
  }
  return [...byStudent.values()].sort((a, b) => b.totalScore - a.totalScore).map((entry, i) => ({ ...entry, position: i + 1 }));
}
