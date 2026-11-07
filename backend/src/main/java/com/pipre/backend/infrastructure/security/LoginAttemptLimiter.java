package com.pipre.backend.infrastructure.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.Clock;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/** One atomic rolling window shared by all backend replicas using the same database. */
@Service
public class LoginAttemptLimiter {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final byte[] secret;
    public LoginAttemptLimiter(JdbcTemplate jdbc,Clock clock,@Value("${jwt.secret}") String secret) {
        this.jdbc=jdbc;this.clock=clock;this.secret=secret.getBytes(StandardCharsets.UTF_8);
    }
    @Transactional
    public int retryAfter(String address) {
        String key=key(address);
        jdbc.update("INSERT INTO login_attempt_windows(key_hash,attempt_times,updated_at_ms) VALUES (?,'',?) ON CONFLICT DO NOTHING",key,clock.millis());
        String encoded=jdbc.queryForObject("SELECT attempt_times FROM login_attempt_windows WHERE key_hash=? FOR UPDATE",String.class,key);
        // Waiting for another replica's lock must not leave this request using an older time.
        long now=clock.millis();
        var attempts=new ArrayList<Long>();
        if(encoded!=null&&!encoded.isEmpty())for(String value:encoded.split(",")) {
            long timestamp=Long.parseLong(value);if(timestamp>now-60000)attempts.add(timestamp);
        }
        Collections.sort(attempts);
        if(attempts.size()>=5)return (int)Math.min(60,Math.max(1,(attempts.getFirst()+60000-now+999)/1000));
        attempts.add(now);
        jdbc.update("UPDATE login_attempt_windows SET attempt_times=?,updated_at_ms=? WHERE key_hash=?",String.join(",",attempts.stream().map(String::valueOf).toList()),now,key);
        return 0;
    }
    @Scheduled(fixedDelay=60000)
    @Transactional
    public void expire() {jdbc.update("DELETE FROM login_attempt_windows WHERE updated_at_ms<=?",clock.millis()-60000);}
    private String key(String address) {
        try {var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret,"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(address.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.GeneralSecurityException failure){throw new IllegalStateException("No se pudo proteger la clave del limitador.",failure);}
    }
}
