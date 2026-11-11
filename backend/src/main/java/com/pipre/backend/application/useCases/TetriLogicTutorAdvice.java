package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.pipre.backend.domain.entities.game.BoardRules;

import java.util.List;

final class TetriLogicTutorAdvice {
    private static final List<String> SMALL_NUMBERS = List.of("cero", "uno", "dos", "tres", "cuatro", "cinco",
            "seis", "siete", "ocho", "nueve", "diez", "once", "doce");

    private TetriLogicTutorAdvice() {}

    static String fixed(JsonNode config, int ordinal) {
        JsonNode size = config.path("boardSize");
        return switch (ordinal) {
            case 1 -> "En este tablero de " + size.path("cols").asInt() + " columnas y " + size.path("rows").asInt()
                    + " filas, el primer número indica cuántas casillas ocupaste y el segundo indica el objetivo.";
            case 2 -> lineGoal(config, "row", "fila");
            case 3 -> lineGoal(config, "column", "columna");
            case 4 -> "Antes de mover o girar una pieza, piensa en qué filas y columnas cambiará el conteo.";
            case 5 -> "Al revisar tu solución, busca líneas con casillas de más o de menos. Si una línea pide cero, debe quedar vacía.";
            default -> throw new IllegalArgumentException("Ordinal fuera del catálogo de ayudas fijas");
        };
    }

    private static String lineGoal(JsonNode config, String axis, String label) {
        for (JsonNode goal : config.path("constraints")) {
            if (axis.equals(goal.path("orientation").asText())) {
                int target = goal.path("targetCount").asInt();
                return "La " + label + " " + (goal.path("line").asInt() + 1) + " tiene un objetivo de " + target
                        + (target == 1 ? " casilla ocupada." : " casillas ocupadas.")
                        + (target == 0 ? " Mantenla vacía." : " Compara ese objetivo con su conteo actual.");
            }
        }
        return "Revisa los objetivos de " + label + " que muestra el tablero.";
    }

    static String diagnosis(JsonNode config, JsonNode state) {
        String rule = "Los objetivos indican cuántas casillas deben estar ocupadas en cada fila o columna. "
                + "Cada pieza ocupa varias casillas y puede cambiar el conteo de ambos ejes.";
        return BoardRules.diagnoseTetri(config, state).map(difference -> {
            String axis = "row".equals(difference.axis()) ? "fila" : "columna";
            String relation = difference.occupied() < difference.target() ? "Faltan casillas ocupadas." : "Sobran casillas ocupadas.";
            String occupied = difference.occupied() == 1 ? "una casilla ocupada" : number(difference.occupied()) + " casillas ocupadas";
            return "En la " + axis + " " + number(difference.index() + 1) + " hay " + occupied
                    + " y el objetivo es " + number(difference.target()) + ". " + relation + " " + rule;
        }).orElse(rule + " Revisa el conteo de ambos ejes para comprobar el tablero.");
    }

    private static String number(int value) {
        return value >= 0 && value < SMALL_NUMBERS.size() ? SMALL_NUMBERS.get(value) : Integer.toString(value);
    }

    static String actionSummary(JsonNode action) {
        return switch (action.path("type").asText()) {
            case "PLACE" -> "Intentó colocar una pieza";
            case "ROTATE" -> "Intentó girar una pieza";
            case "RETURN" -> "Intentó devolver una pieza a la bandeja";
            case "RESET" -> "Reinició el tablero";
            default -> "Intentó cambiar el tablero";
        };
    }
}
