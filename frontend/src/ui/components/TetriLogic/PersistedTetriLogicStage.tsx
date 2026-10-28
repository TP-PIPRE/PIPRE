import { useEffect, useState } from "react";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";
import { apiService } from "../../../infrastructure/api/apiService";
import { sameConfig } from "../../../application/usecases/tetrilogic/rules";
import { TetriLogicStage } from "./TetriLogicStage";

export function PersistedTetriLogicStage({ config, activity }: { config: LevelConfig; activity: ActivityResponseDTO }) {
  const [state,setState] = useState<{expected?:LevelConfig;config?:LevelConfig; error?:boolean}>({});
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    apiService.tetrilogic.getTemplate(config.templateId!, controller.signal).then(data => {
      if (data?.templateId!==config.templateId || data?.version!==2 || !sameConfig(config,data?.config)) throw new Error("Incompatible template");
      if (active) setState({expected:config,config:data.config});
    }).catch(()=>{ if (active) setState({expected:config,error:true}); });
    return ()=>{active=false;controller.abort();};
  },[config,retry]);
  if (state.expected === config && state.error) return <section className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 text-center"><h1>No pudimos cargar el tablero</h1><p className="my-4 text-text-muted" role="alert">La configuración no está disponible o necesita actualizarse. Inténtalo de nuevo y, si continúa, avisa a tu docente.</p><button className="btn-secondary" onClick={()=>{setState({});setRetry(r=>r+1);}}>Reintentar</button></section>;
  if (state.expected !== config || !state.config) return <p role="status" className="p-8 text-center">Cargando tablero…</p>;
  return <TetriLogicStage levels={[state.config]} activity={activity} />;
}
