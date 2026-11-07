import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useDailySet } from "../../src/ui/components/common/useDailySet";
import { gameProgressService } from "../../src/infrastructure/api/gameProgressService";
import type { DailySetDTO } from "../../src/infrastructure/api/models/gameProgressModels";

vi.mock("../../src/infrastructure/api/gameProgressService", () => ({ gameProgressService: { dailySet: vi.fn() } }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); });
it("renews at server midnight without reload and refreshes on focus", async () => {
  vi.useFakeTimers();vi.setSystemTime(new Date("2030-01-02T04:59:59Z"));
  const first: DailySetDTO = {date:"2030-01-01", timeZone:"America/Lima", expiresAt:"2030-01-02T05:00:00Z", challenges:[]};
  vi.mocked(gameProgressService.dailySet).mockResolvedValueOnce(first).mockResolvedValue({...first,date:"2030-01-02",expiresAt:"2030-01-03T05:00:00Z"});
  const view=renderHook(()=>useDailySet("student"));
  await act(async()=>{});expect(view.result.current.daily?.date).toBe("2030-01-01");
  await act(async()=>{await vi.advanceTimersByTimeAsync(1100);});
  expect(view.result.current.daily?.date).toBe("2030-01-02");
  await act(async()=>{window.dispatchEvent(new Event("focus"));});
  expect(gameProgressService.dailySet).toHaveBeenCalledTimes(3);
  view.unmount();await vi.advanceTimersByTimeAsync(120000);expect(gameProgressService.dailySet).toHaveBeenCalledTimes(3);
});
it("does not show an old owner's late response after changing accounts", async()=>{
  let finish!: (daily: DailySetDTO)=>void;
  vi.mocked(gameProgressService.dailySet).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValue({date:"2030-01-02",timeZone:"America/Lima",expiresAt:"2030-01-03T05:00:00Z",challenges:[]});
  const view=renderHook(({id})=>useDailySet(id),{initialProps:{id:"first"}});
  view.rerender({id:"second"});await act(async()=>{});
  await act(async()=>{finish({date:"old-private",timeZone:"America/Lima",expiresAt:"2030-01-03T05:00:00Z",challenges:[]});});
  expect(view.result.current.daily?.date).toBe("2030-01-02");
});
