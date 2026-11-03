package com.pipre.backend.application.commands;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

public final class TelemetryFingerprint {
    private TelemetryFingerprint() {}
    public static String of(SaveAttemptCommand c) {
        String value=c.studentId()+"|"+c.game()+"|"+c.result()+"|"+c.completedAt()+"|"+c.tiempoResolucion()+"|"+c.movimientos()+"|"+c.reinicios()+"|"+c.pistasIa()+"|"+canonical(c.trace());
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch(java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public static String canonical(JsonNode node) {
        if(node==null)return "null";
        if(node.isArray()) { var items=new ArrayList<String>();node.forEach(value->items.add(canonical(value)));return "["+String.join(",",items)+"]"; }
        if(node.isObject()) { var fields=new TreeMap<String,String>();node.fields().forEachRemaining(e->fields.put(e.getKey(),canonical(e.getValue())));return "{"+fields.entrySet().stream().map(e->"\""+e.getKey()+"\":"+e.getValue()).collect(Collectors.joining(","))+"}"; }
        return node.toString();
    }
}
