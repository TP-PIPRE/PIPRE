import { SimuladorProvider } from "../../application/context/SimuladorProvider";
import { HardwarePanel } from "../components/Simulador/HardwarePanel";
import { Toolbox } from "../components/Simulador/Toolbox";
import { Workspace } from "../components/Simulador/Workspace";
import { Stage3D } from "../components/Simulador/Stage3D";
import { Console } from "../components/Simulador/Console";
import { MissionsPanel } from "../components/Simulador/MissionsPanel";

export const Simulador = () => {
  return (
    <SimuladorProvider>
      <div className="flex flex-col h-screen">
        <main className="flex-1 p-4 overflow-auto">
          <div className="h-full w-full max-w-[1920px] mx-auto grid grid-cols-12 grid-rows-[repeat(12,minmax(0,1fr))] gap-4">
            {/* Column 1: Hardware & Missions (3 cols) */}
            <div className="col-span-3 row-span-12 flex flex-col gap-4 min-h-0">
              <div
                className="min-h-0 panel-border flex-1 overflow-auto"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <HardwarePanel />
              </div>
              <div
                className="min-h-0 panel-border flex-1 overflow-auto"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <MissionsPanel />
              </div>
            </div>

            {/* Column 2: Logic Assembly (5 cols) */}
            <div
              className="col-span-5 row-span-12 flex flex-col panel-border min-h-0"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <div className="flex h-full">
                <div
                  className="w-1/3 border-r border-border"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <Toolbox />
                </div>
                <div className="w-2/3" style={{ backgroundColor: "var(--bg)" }}>
                  <Workspace />
                </div>
              </div>
            </div>

            {/* Column 3: Visualization & Console (4 cols) */}
            <div className="col-span-4 row-span-12 flex flex-col gap-4 min-h-0">
              <div
                className="flex-1 min-h-0 relative panel-border"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <Stage3D />
              </div>
              <div
                className="h-48 shrink-0 panel-border"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Console />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SimuladorProvider>
  );
};

export default Simulador;
