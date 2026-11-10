package com.pipre.backend.domain.entities.game;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pipre.backend.domain.exceptions.BusinessException;
import java.util.*;

/** Server implementation of the active games. Historical TetriLogic constraints are deliberately ignored. */
public final class BoardRules {
    public static final String STARS_VERSION = "game-stars-v1";
    private static final JsonNodeFactory JSON = JsonNodeFactory.instance;
    private static final Map<String,int[][]> SHAPES = Map.of(
        "O",new int[][]{{0,0},{1,0},{0,1},{1,1}},
        "I",new int[][]{{0,0},{1,0},{2,0},{3,0}},
        "T",new int[][]{{0,0},{1,0},{2,0},{1,1}},
        "S",new int[][]{{1,0},{2,0},{0,1},{1,1}},
        "Z",new int[][]{{0,0},{1,0},{1,1},{2,1}},
        "L",new int[][]{{0,0},{0,1},{0,2},{1,2}},
        "J",new int[][]{{1,0},{1,1},{0,2},{1,2}});
    private BoardRules() {}

    public static String canonicalTemplate(String game, String template) {
        if (!Set.of("neonflow","tetrilogic").contains(game) || template==null)
            throw new BusinessException("Juego o plantilla no válidos.");
        String prefix=game+"-v2-";
        String value=template;
        if (game.equals("neonflow") && template.matches("neonflow-([3-9]|[12][0-9]|30)"))
            value=prefix+template.substring("neonflow-".length());
        if (!value.matches(java.util.regex.Pattern.quote(prefix)+"([1-9]|[12][0-9]|30)"))
            throw new BusinessException("Esta plantilla anterior se conserva como práctica; los logros requieren un nivel oficial v2.");
        return value;
    }
    public static String ruleset(String game) { return game.equals("neonflow") ? "neonflow-raycast-v1" : "tetrilogic-counts-v1"; }
    public static ObjectNode initialState() {
        ObjectNode state=JSON.objectNode();state.set("pieces",JSON.arrayNode());
        for (String counter:List.of("moves","resets","helps","failedChecks","rejections"))state.put(counter,0);
        state.put("lastActionRejected",false);return state;
    }

    public static ObjectNode apply(String game, JsonNode config, JsonNode current, BoardAction action) {
        if (action.type()==null || !Set.of("PLACE","ROTATE","RETURN","RESET","HELP","CHECK","REJECT").contains(action.type()))
            throw new BusinessException("Tipo de acción no admitido.");
        if (action.rotation()!=null && !Set.of(0,90,180,270).contains(action.rotation()))
            throw new BusinessException("El giro debe ser 0, 90, 180 o 270 grados.");
        if (action.source()!=null && !Set.of("DRAFT","STATIC").contains(action.source()))
            throw new BusinessException("Origen de acción no admitido.");
        ObjectNode next=(ObjectNode)current.deepCopy();next.put("lastActionRejected",false);
        switch(action.type()) {
            case "RESET" -> { next.set("pieces",JSON.arrayNode());increment(next,"resets");return next; }
            case "HELP" -> { increment(next,"helps");return next; }
            case "REJECT" -> { reject(next);return next; }
            case "CHECK" -> { boolean solved=isSolved(game,config,next);next.put("lastCheckMatched",solved);if(!solved)increment(next,"failedChecks");return next; }
            default -> {}
        }
        if (action.type().equals("ROTATE") && "DRAFT".equals(action.source()))return next;
        if (game.equals("tetrilogic") && action.type().equals("ROTATE")) {
            boolean placed=false;for(JsonNode piece:next.path("pieces"))if(piece.path("id").asText().equals(action.pieceId()))placed=true;
            if(!placed){applyTetri(config,next,action);return next;}
        }
        boolean applied=game.equals("tetrilogic") ? applyTetri(config,next,action) : applyNeon(config,next,action);
        if(applied)increment(next,"moves");else reject(next);
        return next;
    }
    private static void increment(ObjectNode state,String key) {
        int value=state.path(key).asInt();
        if(value==Integer.MAX_VALUE)throw new BusinessException("Se alcanzó el límite de acciones de la sesión.");
        state.put(key,value+1);
    }
    private static void reject(ObjectNode state) { increment(state,"rejections");state.put("lastActionRejected",true); }

    private static boolean applyTetri(JsonNode config,ObjectNode state,BoardAction action) {
        JsonNode definition=null;
        for(JsonNode piece:config.path("inventory"))if(piece.path("id").asText().equals(action.pieceId()))definition=piece;
        if(definition==null)throw new BusinessException("La pieza no pertenece al inventario de este nivel.");
        ArrayNode pieces=(ArrayNode)state.path("pieces");
        int previous=-1;for(int i=0;i<pieces.size();i++)if(pieces.get(i).path("id").asText().equals(action.pieceId()))previous=i;
        if(action.type().equals("RETURN")) { if(previous<0)return false;pieces.remove(previous);return true; }
        if(action.type().equals("ROTATE")&&previous<0)return true; // Tray orientation is committed by PLACE.
        JsonNode old=previous<0?null:pieces.get(previous);
        if(action.type().equals("PLACE")&&(action.x()==null||action.y()==null))throw new BusinessException("La colocación necesita coordenadas.");
        int x=action.x()!=null?action.x():old.path("x").asInt();
        int y=action.y()!=null?action.y():old.path("y").asInt();
        int rotation=action.rotation()!=null?action.rotation():old==null?0:old.path("rotation").asInt();
        ObjectNode candidate=JSON.objectNode().put("id",action.pieceId()).put("type",definition.path("type").asText())
            .put("x",x).put("y",y).put("rotation",rotation);
        ArrayNode proposed=pieces.deepCopy();if(previous>=0)proposed.remove(previous);proposed.add(candidate);
        if(!legalTetri(config,proposed))return false;
        state.set("pieces",proposed);return true;
    }
    private static boolean applyNeon(JsonNode config,ObjectNode state,BoardAction action) {
        if(action.x()==null||action.y()==null)throw new BusinessException("La acción necesita coordenadas.");
        int x=action.x(),y=action.y();
        if(x<0||y<0||x>=config.path("width").asInt()||y>=config.path("height").asInt())return false;
        if(at(config.path("emitter").path("position"),x,y))return false;
        for(JsonNode block:config.path("blocked"))if(at(block,x,y))return false;
        for(JsonNode receptor:config.path("receptors"))if(at(receptor.path("position"),x,y))return false;
        ArrayNode pieces=(ArrayNode)state.path("pieces");int previous=-1;
        for(int i=0;i<pieces.size();i++)if(at(pieces.get(i),x,y))previous=i;
        if(action.type().equals("RETURN")) { if(previous<0)return false;pieces.remove(previous);return true; }
        if(action.type().equals("ROTATE")) {
            if(previous<0||!pieces.get(previous).path("type").asText().equals("MIRROR_90"))return false;
            ObjectNode piece=(ObjectNode)pieces.get(previous);
            piece.put("rotation",action.rotation()!=null?action.rotation():(piece.path("rotation").asInt()+90)%360);return true;
        }
        if(previous>=0)return false;
        if(action.component()==null||!Set.of("MIRROR_90","FILTER").contains(action.component()))throw new BusinessException("Componente óptico no válido.");
        ObjectNode piece=JSON.objectNode().put("type",action.component()).put("x",x).put("y",y);
        if(action.component().equals("MIRROR_90"))piece.put("rotation",action.rotation()==null?0:action.rotation());
        else { if(action.color()==null||!Set.of("red","green","blue").contains(action.color()))throw new BusinessException("Filtro no válido.");piece.put("color",action.color()); }
        pieces.add(piece);return true;
    }
    private static boolean at(JsonNode value,int x,int y) { return value.path("x").asInt(-1)==x&&value.path("y").asInt(-1)==y; }
    public static boolean isSolved(String game,JsonNode config,JsonNode state) {
        return game.equals("tetrilogic")?solvedTetri(config,state.path("pieces")):traceNeon(config,state.path("pieces")).solved();
    }

    public static NeonHintDiagnosis diagnoseNeon(JsonNode config, JsonNode state) {
        NeonTrace trace = traceNeon(config, state.path("pieces"));
        if (trace.solved()) return new NeonHintDiagnosis("SOLVED", "RULE_HINT", null, null, true);
        String type = trace.key().equals("FILTER_COLOR_MISMATCH") ? "COLOR_HINT" : "POSITION_HINT";
        return new NeonHintDiagnosis(trace.key(), type, trace.x(), trace.y(), false);
    }
    private static int[][] shape(String type,int rotation) {
        int[][] definition=SHAPES.get(type);if(definition==null)return null;
        int[][] shape=Arrays.stream(definition).map(int[]::clone).toArray(int[][]::new);
        for(int r=0;r<rotation;r+=90) {
            int minX=Integer.MAX_VALUE,minY=Integer.MAX_VALUE;
            for(int[] cell:shape){int x=-cell[1];cell[1]=cell[0];cell[0]=x;minX=Math.min(minX,cell[0]);minY=Math.min(minY,cell[1]);}
            for(int[] cell:shape){cell[0]-=minX;cell[1]-=minY;}
        }
        return shape;
    }
    private static boolean legalTetri(JsonNode config,JsonNode pieces) {
        Set<String> ids=new HashSet<>();Set<Long> occupied=new HashSet<>();
        int width=config.path("boardSize").path("cols").asInt(),height=config.path("boardSize").path("rows").asInt();
        for(JsonNode piece:pieces) {
            String id=piece.path("id").asText(),type=piece.path("type").asText();boolean known=false;
            for(JsonNode definition:config.path("inventory"))if(id.equals(definition.path("id").asText())&&type.equals(definition.path("type").asText()))known=true;
            if(!known||!ids.add(id)||!piece.path("x").isInt()||!piece.path("y").isInt()||!piece.path("rotation").isInt())return false;
            int rotation=piece.path("rotation").asInt();if(!Set.of(0,90,180,270).contains(rotation))return false;
            int[][] shape=shape(type,rotation);if(shape==null)return false;
            for(int[] offset:shape) {
                long x=(long)piece.path("x").asInt()+offset[0],y=(long)piece.path("y").asInt()+offset[1];
                if(x<0||y<0||x>=width||y>=height||!occupied.add(y*width+x))return false;
            }
        }
        return true;
    }
    private static boolean solvedTetri(JsonNode config,JsonNode pieces) {
        if(!pieces.isArray()||!legalTetri(config,pieces)||config.path("constraints").isEmpty())return false;
        int[] rows=new int[config.path("boardSize").path("rows").asInt()],cols=new int[config.path("boardSize").path("cols").asInt()];
        for(JsonNode piece:pieces)for(int[] offset:shape(piece.path("type").asText(),piece.path("rotation").asInt())) {
            rows[piece.path("y").asInt()+offset[1]]++;cols[piece.path("x").asInt()+offset[0]]++;
        }
        for(JsonNode goal:config.path("constraints")) {
            int[] counts=goal.path("orientation").asText().equals("row")?rows:cols;
            if(counts[goal.path("line").asInt()]!=goal.path("targetCount").asInt())return false;
        }
        return true;
    }
    private record NeonTrace(boolean solved, String key, Integer x, Integer y) {}
    private static NeonTrace traceNeon(JsonNode config, JsonNode pieces) {
        int width=config.path("width").asInt(),height=config.path("height").asInt();
        Map<Integer,JsonNode> cells=new HashMap<>();
        for(JsonNode block:config.path("blocked"))cells.put(block.path("y").asInt()*width+block.path("x").asInt(),JSON.objectNode().put("type","BLOCK"));
        for(JsonNode receptor:config.path("receptors"))cells.put(receptor.path("position").path("y").asInt()*width+receptor.path("position").path("x").asInt(),JSON.objectNode().put("type","RECEPTOR").put("color",receptor.path("color").asText()));
        JsonNode emitter=config.path("emitter");String color=emitter.path("color").asText();
        int x=emitter.path("position").path("x").asInt(),y=emitter.path("position").path("y").asInt();
        for(JsonNode piece:pieces) {
            int px=piece.path("x").asInt(-1),py=piece.path("y").asInt(-1),key=py*width+px;
            if(px<0||py<0||px>=width||py>=height||cells.containsKey(key)||(px==x&&py==y))return new NeonTrace(false,"UNLIT_RECEPTOR",null,null);
            if(!Set.of("MIRROR_90","FILTER").contains(piece.path("type").asText()))return new NeonTrace(false,"UNLIT_RECEPTOR",px,py);
            if(piece.path("type").asText().equals("MIRROR_90")&&!Set.of(0,90,180,270).contains(piece.path("rotation").asInt(-1)))return new NeonTrace(false,"UNLIT_RECEPTOR",px,py);
            cells.put(key,piece);
        }
        if(config.path("receptors").isEmpty())return new NeonTrace(false,"UNLIT_RECEPTOR",null,null);
        int dx=emitter.path("direction").path("dx").asInt(),dy=emitter.path("direction").path("dy").asInt();
        Set<Integer> lit=new HashSet<>();Set<String> visited=new HashSet<>();
        for(int step=0;step<width*height*4;step++) {
            if(x<0||y<0||x>=width||y>=height)break;
            if(!visited.add(x+":"+y+":"+dx+":"+dy))return new NeonTrace(false,"CYCLIC_PATH",x,y);
            int key=y*width+x;JsonNode cell=cells.get(key);
            if(cell!=null) {
                String type=cell.path("type").asText();
                if(type.equals("BLOCK"))return new NeonTrace(false,"BLOCKED_PATH",x,y);
                if(type.equals("FILTER")&&!cell.path("color").asText().equals(color))return new NeonTrace(false,"FILTER_COLOR_MISMATCH",x,y);
                if(type.equals("RECEPTOR")){if(cell.path("color").asText().equals(color))lit.add(key);break;}
                if(type.equals("MIRROR_90")){boolean slash=cell.path("rotation").asInt()%180==0;int nx=slash?-dy:dy;dy=slash?-dx:dx;dx=nx;}
            }
            x+=dx;y+=dy;
        }
        for(JsonNode receptor:config.path("receptors")) {
            int rx=receptor.path("position").path("x").asInt(),ry=receptor.path("position").path("y").asInt();
            if(!lit.contains(ry*width+rx))return new NeonTrace(false,"UNLIT_RECEPTOR",rx,ry);
        }
        return new NeonTrace(true,"SOLVED",null,null);
    }
    public static int stars(String game,JsonNode config,JsonNode state) {
        int budget=game.equals("tetrilogic")?4*config.path("inventory").size():2*(config.path("width").asInt()+config.path("height").asInt());
        int resets=state.path("resets").asInt(),helps=state.path("helps").asInt(),moves=state.path("moves").asInt();
        if(resets==0&&helps==0&&state.path("failedChecks").asInt()==0&&moves<=budget)return 3;
        if(resets<=2&&helps<=2&&moves<=2*budget)return 2;
        return 1;
    }
}
