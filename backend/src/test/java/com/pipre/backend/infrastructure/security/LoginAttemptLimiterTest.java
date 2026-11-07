package com.pipre.backend.infrastructure.security;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.time.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
class LoginAttemptLimiterTest {
    static class MutableClock extends Clock {long millis;public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return Instant.ofEpochMilli(millis);}}
    @Test void rollingWindowExpiresAtBoundaryAndCleansOnlyExpiredKeys() {
        var jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:limit-"+UUID.randomUUID()+";DB_CLOSE_DELAY=-1;MODE=PostgreSQL","sa",""));
        jdbc.execute("CREATE TABLE login_attempt_windows(key_hash VARCHAR(64) PRIMARY KEY,attempt_times TEXT NOT NULL,updated_at_ms BIGINT NOT NULL)");
        var clock=new MutableClock();var limiter=new LoginAttemptLimiter(jdbc,clock,"test-secret");
        for(int i=0;i<5;i++)assertEquals(0,limiter.retryAfter("192.0.2.9"));
        assertEquals(60,limiter.retryAfter("192.0.2.9"));assertEquals(0,limiter.retryAfter("198.51.100.7"));
        var keys=jdbc.queryForList("SELECT key_hash FROM login_attempt_windows",String.class);assertTrue(keys.stream().allMatch(key->key.matches("[a-f0-9]{64}")));
        clock.millis=59999;assertEquals(1,limiter.retryAfter("192.0.2.9"));
        clock.millis=60000;assertEquals(0,limiter.retryAfter("192.0.2.9"));
        limiter.expire();assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM login_attempt_windows",Integer.class));
        clock.millis=120000;limiter.expire();assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM login_attempt_windows",Integer.class));
    }
    @Test void samplesTimeAfterAcquiringTheWindowLock() {
        var jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:limit-wait-"+UUID.randomUUID()+";DB_CLOSE_DELAY=-1;MODE=PostgreSQL","sa",""));
        jdbc.execute("CREATE TABLE login_attempt_windows(key_hash VARCHAR(64) PRIMARY KEY,attempt_times TEXT NOT NULL,updated_at_ms BIGINT NOT NULL)");
        var original=new LoginAttemptLimiter(jdbc,Clock.fixed(Instant.EPOCH,ZoneOffset.UTC),"test-secret");
        for(int i=0;i<5;i++)assertEquals(0,original.retryAfter("192.0.2.9"));
        Clock waited=new Clock(){int reads;public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return Instant.ofEpochMilli(reads++==0?0:60000);}};
        assertEquals(0,new LoginAttemptLimiter(jdbc,waited,"test-secret").retryAfter("192.0.2.9"));
    }
}
