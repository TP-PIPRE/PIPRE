package com.pipre.backend.domain.entities.game;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;

class BoardRulesTest {
    private static final ObjectMapper JSON=new ObjectMapper();
    static JsonNode catalog(String game) throws Exception {
        return JSON.readTree(BoardRulesTest.class.getResourceAsStream("/catalog/"+game+"-v2.json"));
    }
    static Stream<Arguments> officialSolutions() throws Exception {
        var cases=new java.util.ArrayList<Arguments>();
        Path root=Files.isDirectory(Path.of("../frontend/tests/fixtures"))?Path.of(".."):Path.of(".");
        for(String game:java.util.List.of("neonflow","tetrilogic")) {
            String file=game.equals("neonflow")?"neonFlowSolutions.json":"tetrilogicSolutions.json";
            JsonNode witnesses=JSON.readTree(root.resolve("frontend/tests/fixtures/"+file).toFile());
            JsonNode catalog=catalog(game);assertEquals(30,catalog.size());assertEquals(30,witnesses.size());
            for(int i=0;i<30;i++) {
                assertEquals(catalog.get(i).path("templateId"),witnesses.get(i).path("templateId"));
                cases.add(Arguments.of(game,catalog.get(i),witnesses.get(i)));
            }
        }
        try (var configs = BoardRulesTest.class.getResourceAsStream("/catalog/neonflow-v3.json");
             var solutions = BoardRulesTest.class.getResourceAsStream("/catalog/neonflow-v3-witnesses.json")) {
            JsonNode revised = JSON.readTree(configs), witnesses = JSON.readTree(solutions);
            assertEquals(30, revised.size());
            assertEquals(30, witnesses.size());
            for (int i = 0; i < revised.size(); i++) {
                assertEquals(revised.get(i).path("templateId"), witnesses.get(i).path("templateId"));
                cases.add(Arguments.of("neonflow", revised.get(i), witnesses.get(i)));
            }
        }
        return cases.stream();
    }
    @ParameterizedTest(name="server verifies {0} official level {index}")
    @MethodSource("officialSolutions")
    void verifiesPublishedSolutionsThroughLegalActions(String game,JsonNode config,JsonNode witness) {
        ObjectNode state=BoardRules.initialState();
        if (config.path("version").asInt() == 3) assertFalse(BoardRules.isSolved(game,config,state));
        for(JsonNode piece:witness.path("placements")) {
            state=BoardRules.apply(game,config,state,new BoardAction("PLACE",piece.path("id").asText(null),
                piece.path("position").path("x").asInt(),piece.path("position").path("y").asInt(),piece.path("rotation").asInt(0),
                piece.path("type").asText(null),piece.path("color").asText(null),null));
            assertFalse(state.path("lastActionRejected").asBoolean(),config.path("templateId").asText());
        }
        assertTrue(BoardRules.isSolved(game,config,state),config.path("templateId").asText());
        assertEquals(3,BoardRules.stars(game,config,state));
    }
    @Test void tetrilogicEnforcesOnlyCountsBoundsAndCollisionIncludingZeroTargets() throws Exception {
        JsonNode config=JSON.readTree("""
            {"boardSize":{"rows":4,"cols":4},"inventory":[{"id":"o1","type":"O"},{"id":"i1","type":"I"}],
             "blockedCells":[{"x":0,"y":0}],"requiredCells":[{"x":3,"y":3}],
             "precedences":[{"before":"i1","after":"o1"}],"orientations":[{"pieceId":"o1","allowed":[90]}],
             "constraints":[{"orientation":"row","line":0,"targetCount":2},{"orientation":"row","line":1,"targetCount":2},
               {"orientation":"row","line":2,"targetCount":0},{"orientation":"row","line":3,"targetCount":0},
               {"orientation":"column","line":0,"targetCount":2},{"orientation":"column","line":1,"targetCount":2},
               {"orientation":"column","line":2,"targetCount":0},{"orientation":"column","line":3,"targetCount":0}]}
            """);
        var state=BoardRules.apply("tetrilogic",config,BoardRules.initialState(),new BoardAction("PLACE","o1",0,0,0,null,null,null));
        assertTrue(BoardRules.isSolved("tetrilogic",config,state));
        assertTrue(BoardRules.diagnoseTetri(config,state).isEmpty());
        assertEquals(new BoardRules.TetriHintDiagnosis("row",0,0,2),BoardRules.diagnoseTetri(config,BoardRules.initialState()).orElseThrow());
        var overshoot=BoardRules.apply("tetrilogic",config,state,new BoardAction("PLACE","i1",0,2,0,null,null,null));
        assertFalse(overshoot.path("lastActionRejected").asBoolean());assertFalse(BoardRules.isSolved("tetrilogic",config,overshoot));
        assertEquals(new BoardRules.TetriHintDiagnosis("row",2,4,0),BoardRules.diagnoseTetri(config,overshoot).orElseThrow());
        var sparseConfig = (ObjectNode) config.deepCopy();
        sparseConfig.putArray("constraints").addObject().put("orientation","column").put("line",0).put("targetCount",3);
        assertEquals(new BoardRules.TetriHintDiagnosis("column",0,2,3),BoardRules.diagnoseTetri(sparseConfig,state).orElseThrow());
        var collision=BoardRules.apply("tetrilogic",config,state,new BoardAction("PLACE","i1",0,0,0,null,null,null));
        assertTrue(collision.path("lastActionRejected").asBoolean());assertEquals(state.path("pieces"),collision.path("pieces"));
        var outside=BoardRules.apply("tetrilogic",config,state,new BoardAction("PLACE","o1",Integer.MAX_VALUE,0,0,null,null,null));
        assertTrue(outside.path("lastActionRejected").asBoolean());
    }
    @Test void rejectsInventedPiecesAndCannotChangeCommittedStateWithDraftRotation() throws Exception {
        JsonNode config=catalog("tetrilogic").get(0);var state=BoardRules.initialState();
        assertThrows(BusinessException.class,()->BoardRules.apply("tetrilogic",config,state,new BoardAction("PLACE","invented",0,0,0,null,null,null)));
        var draft=BoardRules.apply("tetrilogic",config,state,new BoardAction("ROTATE","i1",0,0,90,null,null,"DRAFT"));
        assertEquals(state.path("pieces"),draft.path("pieces"));assertEquals(0,draft.path("moves").asInt());
        var tray=BoardRules.apply("tetrilogic",config,state,new BoardAction("ROTATE","i1",null,null,90,null,null,null));
        assertEquals(state.path("pieces"),tray.path("pieces"));assertEquals(0,tray.path("moves").asInt());
    }
    @Test void neonRequiresRealReceptorColorAndPreservesImmutableCells() throws Exception {
        ObjectNode config=(ObjectNode)catalog("neonflow").get(0);var state=BoardRules.initialState();
        assertTrue(BoardRules.isSolved("neonflow",config,state));
        ObjectNode wrong=config.deepCopy();((ObjectNode)wrong.path("receptors").get(0)).put("color","blue");
        assertFalse(BoardRules.isSolved("neonflow",wrong,state));
        JsonNode emitter=config.path("emitter").path("position");
        var rejected=BoardRules.apply("neonflow",config,state,new BoardAction("PLACE",null,emitter.path("x").asInt(),emitter.path("y").asInt(),0,"MIRROR_90",null,null));
        assertTrue(rejected.path("lastActionRejected").asBoolean());assertEquals(0,rejected.path("pieces").size());
        JsonNode target=config.path("receptors").get(0).path("position");
        assertTrue(BoardRules.apply("neonflow",config,state,new BoardAction("PLACE",null,target.path("x").asInt(),target.path("y").asInt(),0,"MIRROR_90",null,null)).path("lastActionRejected").asBoolean());
    }
    @Test void starsUseServerCountersAndNeverAwardThreeForEveryVictory() throws Exception {
        var config=catalog("neonflow").get(0);var state=BoardRules.initialState();
        assertEquals(3,BoardRules.stars("neonflow",config,state));
        state.put("helps",1);assertEquals(2,BoardRules.stars("neonflow",config,state));
        state.put("helps",3);assertEquals(1,BoardRules.stars("neonflow",config,state));
        state.put("helps",0).put("failedChecks",1);assertEquals(2,BoardRules.stars("neonflow",config,state));
        state.put("failedChecks",0).put("moves",1000);assertEquals(1,BoardRules.stars("neonflow",config,state));
    }
    @Test void aliasesAreCanonicalButPrototypesNeverBecomeOfficialAchievements() {
        assertEquals("neonflow-v2-30",BoardRules.canonicalTemplate("neonflow","neonflow-30"));
        for(String template:java.util.List.of("neonflow-1","neonflow-2","neonflow-v2-0","neonflow-v2-31","neonflow-v2-01"))
            assertThrows(BusinessException.class,()->BoardRules.canonicalTemplate("neonflow",template));
        assertThrows(BusinessException.class,()->BoardRules.canonicalTemplate("tetrilogic","tetrilogic-1"));
    }
}
