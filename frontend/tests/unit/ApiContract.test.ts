import { beforeEach, describe, expect, it, vi } from "vitest";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import { apiService } from "../../src/infrastructure/api/apiService";
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
describe("REST contracts", () => {
  it("accepts an empty 201 activity response", async () => {
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ status: 201, data: "" });
    await expect(apiService.activities.create({ idLesson: "l1", name: "Espejos" })).resolves.toBeUndefined();
    expect(axiosInstance.post).toHaveBeenCalledWith("/activities", { idLesson: "l1", name: "Espejos" });
  });
  it("reads every page when callers request all courses", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: { content: [{ idCourse: "c1" }], number: 0, totalPages: 2 } }).mockResolvedValueOnce({ data: { content: [{ idCourse: "c2" }], number: 1, totalPages: 2 } });
    expect(await apiService.courses.getAll()).toEqual([{ idCourse: "c1" }, { idCourse: "c2" }]);
    expect(axiosInstance.get).toHaveBeenNthCalledWith(2, "/courses", { params: { page: 1, size: 100 } });
  });
  it("preserves explicit page and sort parameters", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: { content: [], number: 2, totalPages: 6 } });
    await apiService.modules.getByCourse("c1", { page: 2, size: 5, sort: ["title,asc"] });
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.get).toHaveBeenCalledWith("/modules/course/c1", { params: { page: 2, size: 5, sort: ["title,asc"] } });
  });
});
