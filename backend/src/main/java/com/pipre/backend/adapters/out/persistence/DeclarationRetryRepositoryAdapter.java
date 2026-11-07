package com.pipre.backend.adapters.out.persistence;
import com.pipre.backend.application.ports.output.DeclarationRetryRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Optional;
@Repository @RequiredArgsConstructor
public class DeclarationRetryRepositoryAdapter implements DeclarationRetryRepositoryPort {
    private final JdbcTemplate jdbc;
    public Optional<Receipt> find(String actor,String operation,String key){return jdbc.query("SELECT request_hash,result_id FROM declaration_retry_receipts WHERE actor_id=? AND operation=? AND retry_key=?",(rs,row)->new Receipt(rs.getString(1),rs.getString(2)),actor,operation,key).stream().findFirst();}
    public void save(String actor,String operation,String key,String hash,String resultId){jdbc.update("INSERT INTO declaration_retry_receipts(actor_id,operation,retry_key,request_hash,result_id) VALUES (?,?,?,?,?)",actor,operation,key,hash,resultId);}
}
