import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HelpRequestHistory } from "../../src/ui/components/common/HelpRequestHistory";
import { apiService } from "../../src/infrastructure/api/apiService";
vi.mock("../../src/infrastructure/api/apiService", () => ({ apiService: { analytics: { getHelpRequests: vi.fn() } } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe("Real help request history", () => {
  it("shows stored requests and offers no fake message submission", async () => {
    vi.mocked(apiService.analytics.getHelpRequests).mockResolvedValue([{ idHelpRequest: "h", idStudent: "s", aiInteractions: 3, requestedAt: "2026-10-23T12:00:00" }]);
    render(<HelpRequestHistory students={[{ idStudent: "s", studentName: "Nombre real" }]} />);
    expect(await screen.findByText("Nombre real")).toBeInTheDocument();
    expect(screen.getByText("3 interacciones con el asistente")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enviar/i })).not.toBeInTheDocument();
  });
  it("announces unavailable requests without presenting a successful empty response", async () => {
    vi.mocked(apiService.analytics.getHelpRequests).mockRejectedValue(new Error("offline"));
    render(<HelpRequestHistory students={[{ idStudent: "s", studentName: "Estudiante" }]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron consultar");
  });
});
