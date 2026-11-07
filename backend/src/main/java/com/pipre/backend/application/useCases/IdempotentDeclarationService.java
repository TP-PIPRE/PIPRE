package com.pipre.backend.application.useCases;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.*;
import com.pipre.backend.application.commands.TelemetryFingerprint;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import java.util.function.Supplier;
@Service @RequiredArgsConstructor
public class IdempotentDeclarationService {
    private final DeclarationRetryRepositoryPort receipts;
    private final UserRepositoryPort users;
    private final ObjectMapper json;
    @Transactional public String execute(String actorEmail,String operation,String key,Object payload,Supplier<String> action) {
        if(key==null)return action.get(); // Preserve distinct legacy POSTs when no retry identifier was supplied.
        if(!key.matches("[A-Za-z0-9._:-]{1,128}"))throw new BusinessException("Idempotency-Key no es válida.");
        var actor=users.findByEmail(actorEmail).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));
        users.lockById(actor.getIdUser()).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));
        String hash;
        try{hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(TelemetryFingerprint.canonical(json.valueToTree(payload)).getBytes(StandardCharsets.UTF_8)));}
        catch(NoSuchAlgorithmException failure){throw new IllegalStateException(failure);}
        var previous=receipts.find(actor.getIdUser(),operation,key);
        if(previous.isPresent()) {
            if(!previous.get().hash().equals(hash))throw new BusinessException("La clave de reintento corresponde a otro contenido.");
            return previous.get().resultId();
        }
        String result=action.get();receipts.save(actor.getIdUser(),operation,key,hash,result);return result;
    }
}
