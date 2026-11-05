package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.pipre.backend.application.ports.output.DailyChallengeSelectionPolicy.Specification;
import com.pipre.backend.domain.entities.game.*;
import org.springframework.stereotype.Component;
import java.util.*;

/** Translation preserves piece orientation and optical paths. Every output is replay-verified. */
@Component
public class ProceduralDailyGenerator {
    private final Map<String,JsonNode> catalogs=new HashMap<>(), witnesses=new HashMap<>();
    public ProceduralDailyGenerator(ObjectMapper json) {
        for(String game:List.of("neonflow","tetrilogic")) try {
            catalogs.put(game,json.readTree(getClass().getResourceAsStream("/catalog/"+game+"-v2.json")));
            witnesses.put(game,json.readTree(getClass().getResourceAsStream("/catalog/"+game+"-daily-witnesses.json")));
        } catch(java.io.IOException e) { throw new IllegalStateException("Missing procedural source",e); }
    }
    public record Generated(JsonNode config, JsonNode witness, String difficulty) {}
    public Generated generate(Specification s) {
        if(!catalogs.containsKey(s.game())||s.level()<1||s.level()>30||s.left()<0||s.top()<0||s.right()<0||s.bottom()<0
            ||s.left()>2||s.top()>2||s.right()>2||s.bottom()>2) throw new IllegalArgumentException("Unsupported daily specification");
        ObjectNode config=catalogs.get(s.game()).get(s.level()-1).deepCopy();
        JsonNode witness=witnesses.get(s.game()).get(s.level()-1).deepCopy();
        translate(config,s.left(),s.top());translate(witness,s.left(),s.top());
        if(s.game().equals("neonflow")) {
            config.put("width",config.path("width").asInt()+s.left()+s.right());
            config.put("height",config.path("height").asInt()+s.top()+s.bottom());
        } else {
            var size=(ObjectNode)config.path("boardSize");int rows=size.path("rows").asInt(),cols=size.path("cols").asInt();
            size.put("rows",rows+s.top()+s.bottom());size.put("cols",cols+s.left()+s.right());
            for(JsonNode c:config.path("constraints")) ((ObjectNode)c).put("line",c.path("line").asInt()+(c.path("orientation").asText().equals("row")?s.top():s.left()));
            ArrayNode constraints=(ArrayNode)config.path("constraints");
            for(int y=0;y<size.path("rows").asInt();y++) if(y<s.top()||y>=rows+s.top()) constraints.addObject().put("line",y).put("orientation","row").put("targetCount",0);
            for(int x=0;x<size.path("cols").asInt();x++) if(x<s.left()||x>=cols+s.left()) constraints.addObject().put("line",x).put("orientation","column").put("targetCount",0);
            config.put("title","Reto diario");config.put("description","Coloca las piezas y cumple los conteos de filas y columnas.");
        }
        JsonNode state=BoardRules.initialState();
        for(JsonNode p:witness.path("placements")) {
            state=BoardRules.apply(s.game(),config,state,new BoardAction("PLACE",p.path("id").asText(null),p.path("position").path("x").asInt(),p.path("position").path("y").asInt(),p.path("rotation").asInt(0),p.path("type").asText(null),p.path("color").asText(null),null));
            if(state.path("lastActionRejected").asBoolean()) throw new IllegalStateException("Illegal procedural witness");
        }
        if(!BoardRules.isSolved(s.game(),config,state)) throw new IllegalStateException("Unsolvable procedural challenge");
        return new Generated(config,witness,s.level()<=10?"easy":s.level()<=20?"medium":"hard");
    }
    private void translate(JsonNode node,int dx,int dy) {
        if(node.isObject()&&node.has("x")&&node.has("y")) { ((ObjectNode)node).put("x",node.path("x").asInt()+dx);((ObjectNode)node).put("y",node.path("y").asInt()+dy); }
        if(node.isContainerNode()) node.forEach(child->translate(child,dx,dy));
    }
}
