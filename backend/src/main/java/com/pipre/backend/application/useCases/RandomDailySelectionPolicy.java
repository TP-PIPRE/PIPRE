package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.DailyChallengeSelectionPolicy;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.*;

@Component
public class RandomDailySelectionPolicy implements DailyChallengeSelectionPolicy {
    private final SecureRandom random = new SecureRandom();
    @Override public List<Specification> select(String studentId, LocalDate date) {
        List<Integer> neon = new ArrayList<>(), tetri = new ArrayList<>();
        for (int n=0;n<30;n++) { neon.add(n); tetri.add(n+30); }
        Collections.shuffle(neon, random); Collections.shuffle(tetri, random);
        List<Integer> levels = new ArrayList<>(List.of(neon.get(0),neon.get(1),tetri.get(0),tetri.get(1)));
        levels.add(random.nextBoolean()?neon.get(2):tetri.get(2));
        Collections.shuffle(levels, random);
        return levels.stream().map(n -> new Specification(n<30?"neonflow":"tetrilogic", n%30+1,
            1+random.nextInt(2),1+random.nextInt(2),random.nextInt(2),random.nextInt(2))).toList();
    }
}
