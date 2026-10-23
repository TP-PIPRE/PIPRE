import { expect, it } from "vitest";
import { mergeRankings } from "../../src/application/usecases/mergeRankings";
it("deduplicates enrollment in multiple groups without counting scores twice", () => {
  expect(mergeRankings([
    [{ studentId: "ana", totalScore: 100, position: 1 }],
    [{ studentId: "ana", totalScore: 100, position: 1 }, { studentId: "luis", totalScore: 120, position: 2 }],
  ])).toEqual([{ studentId: "luis", totalScore: 120, position: 1 }, { studentId: "ana", totalScore: 100, position: 2 }]);
});
