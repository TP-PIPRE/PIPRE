package com.pipre.backend.application.ports.output;
import java.util.Optional;
public interface DeclarationRetryRepositoryPort {
    record Receipt(String hash,String resultId) {}
    Optional<Receipt> find(String actor,String operation,String key);
    void save(String actor,String operation,String key,String hash,String resultId);
}
