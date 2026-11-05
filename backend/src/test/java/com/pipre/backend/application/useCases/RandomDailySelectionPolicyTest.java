package com.pipre.backend.application.useCases;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class RandomDailySelectionPolicyTest {
    @Test void everySetContainsBothGamesAndFiveDifferentBases() {
        var policy=new RandomDailySelectionPolicy();
        for(int i=0;i<365;i++) {
            var specs=policy.select("student",LocalDate.of(2030,1,1).plusDays(i));
            assertEquals(5,specs.size());
            assertEquals(5,specs.stream().map(s->s.game()+s.level()).distinct().count());
            long neon=specs.stream().filter(s->s.game().equals("neonflow")).count();
            assertTrue(neon==2||neon==3);
            for(var spec:specs)assertTrue(spec.level()>=1&&spec.level()<=30);
        }
    }
}
