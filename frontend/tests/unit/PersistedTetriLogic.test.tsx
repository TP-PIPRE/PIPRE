import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Simulador} from "../../src/ui/pages/Simulador";
import {Routes,Route} from "react-router-dom";
import {TETRILOGIC_LEVELS} from "../../src/shared/constants/levelConfigs";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import {loadCourseActivities} from "../../src/application/usecases/loadCourseActivities";
import {PersistedTetriLogicStage} from "../../src/ui/components/TetriLogic/PersistedTetriLogicStage";
import {useGameStore} from "../../src/infrastructure/store/gameStore";
vi.mock("../../src/application/usecases/loadCourseActivities",()=>({loadCourseActivities:vi.fn()}));
vi.mock("../../src/infrastructure/api/axiosInstance",()=>({default:{get:vi.fn(),post:vi.fn().mockResolvedValue({status:201})}}));
afterEach(()=>{cleanup();useGameStore.getState().stopGame();vi.clearAllMocks();});
const activity={idActivity:"a",name:"Reto elegido",environment:"tetrilogic",levelTemplate:"tetrilogic-v2-30"};
describe("Persisted TetriLogic configuration",()=>{
  it("loads level 30 by activity and resets board state when switching inside the course",async()=>{
    const course=TETRILOGIC_LEVELS.map(l=>({...activity,idActivity:`a${l.level}`,name:`Reto ${l.level}`,levelTemplate:l.templateId}));
    vi.mocked(loadCourseActivities).mockResolvedValue(course);
    vi.mocked(axiosInstance.get).mockImplementation(async url=>{
      const config=TETRILOGIC_LEVELS.find(l=>url.endsWith(l.templateId!))!;
      return {data:{templateId:config.templateId,version:2,config}};
    });
    render(<MemoryRouter initialEntries={["/simulador/c002?activity=a30"]}><Routes><Route path="/simulador/:courseId" element={<Simulador/>}/></Routes></MemoryRouter>);
    expect(await screen.findByRole("heading",{name:"Reto 30"})).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledWith("tetrilogic/templates/tetrilogic-v2-30", {signal:expect.any(AbortSignal)});
    expect(screen.getAllByRole("button",{name:/^Celda/})).toHaveLength(36);
    fireEvent.click(screen.getByRole("button",{name:"Seleccionar pieza T (t1)"}));
    fireEvent.click(screen.getByRole("button",{name:"Celda vacía, fila 1, columna 1"}));
    fireEvent.change(screen.getByLabelText("Tablero del curso"),{target:{value:"a1"}});
    await screen.findByRole("heading",{name:"Reto 1"});
    expect(screen.getAllByRole("button",{name:/^Celda/})).toHaveLength(16);
    expect(useGameStore.getState().movimientos).toBe(0);
  });
  it("does not silently use a local board when persistence is unavailable or mismatched",async()=>{
    const config=TETRILOGIC_LEVELS[29];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({data:{templateId:config.templateId,version:2,config:{...config,inventory:[]}}});
    render(<MemoryRouter><PersistedTetriLogicStage config={config} activity={activity}/></MemoryRouter>);
    await screen.findByRole("alert");
    expect(screen.queryByRole("button",{name:"Rotar pieza"})).not.toBeInTheDocument();
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({data:{templateId:config.templateId,version:2,config}});
    fireEvent.click(screen.getByRole("button",{name:"Reintentar"}));
    await waitFor(()=>expect(screen.getByRole("button",{name:"Rotar pieza"})).toBeInTheDocument());
  });

  it("hides the previous board and cancels its request when a different configuration is loading", async () => {
    const first = TETRILOGIC_LEVELS[0], last = TETRILOGIC_LEVELS[29];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({data:{templateId:first.templateId,version:2,config:first}});
    const view = render(<MemoryRouter><PersistedTetriLogicStage config={first} activity={{...activity,levelTemplate:first.templateId}} /></MemoryRouter>);
    await screen.findByRole("button",{name:"Rotar pieza"});
    const firstSignal = vi.mocked(axiosInstance.get).mock.calls[0][1]?.signal;
    let finish!: (value: { data: unknown }) => void;
    vi.mocked(axiosInstance.get).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    view.rerender(<MemoryRouter><PersistedTetriLogicStage config={last} activity={activity} /></MemoryRouter>);
    expect(firstSignal?.aborted).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tablero");
    expect(screen.queryByRole("button",{name:"Rotar pieza"})).not.toBeInTheDocument();
    expect(useGameStore.getState().status).toBe("IDLE");
    finish({data:{templateId:last.templateId,version:2,config:last}});
    await screen.findByRole("button",{name:"Rotar pieza"});
    expect(screen.getAllByRole("button",{name:/^Celda/})).toHaveLength(36);
  });

  it.each([null, {templateId:"tetrilogic-v2-30",version:1,config:TETRILOGIC_LEVELS[29]}])("rejects an invalid response envelope without opening a replacement board", async data => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({data});
    render(<MemoryRouter><PersistedTetriLogicStage config={TETRILOGIC_LEVELS[29]} activity={activity}/></MemoryRouter>);
    await screen.findByRole("alert");
    expect(screen.queryByRole("button",{name:"Rotar pieza"})).not.toBeInTheDocument();
    expect(useGameStore.getState().status).toBe("IDLE");
  });
});
