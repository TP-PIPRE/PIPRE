package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.*;

/** Reference actions come from the local verified solutions; they are never sent to the browser. */
@Component
public class GameReferenceMoves {
    private final Map<String,Integer> references;
    public GameReferenceMoves(ObjectMapper json) {
        var values=new HashMap<String,Integer>();
        for(String game:List.of("neonflow","tetrilogic"))try {
            var witnesses=json.readTree(getClass().getResourceAsStream("/catalog/"+game+"-daily-witnesses.json"));
            for(var witness:witnesses) {
                int moves=0;
                for(var placement:witness.path("placements"))moves+=1+placement.path("rotation").asInt(0)/90;
                values.put(witness.path("templateId").asText(),Math.max(1,moves));
            }
        }catch(IOException error){throw new IllegalStateException("Missing verified action references",error);}
        references=Map.copyOf(values);
    }
    public int forTemplate(String template) {
        var reference=references.get(template);
        if(reference==null)throw new IllegalArgumentException("Unknown scoring reference");
        return reference;
    }
}
