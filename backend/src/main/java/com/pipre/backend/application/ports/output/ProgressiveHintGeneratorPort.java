package com.pipre.backend.application.ports.output;

import java.util.List;
import java.util.Locale;
import java.util.Set;

public interface ProgressiveHintGeneratorPort {
    String generate(Context context);

    record Context(String diagnosis, List<String> recentActions, List<String> priorAdvice, int pedagogicalLevel, String game) {
        public Context {
            recentActions = List.copyOf(recentActions);
            priorAdvice = List.copyOf(priorAdvice);
        }

        public boolean repeatsAdvice(String message) {
            Set<String> words = adviceWords(message);
            return priorAdvice.stream().anyMatch(prior -> adviceWords(prior).equals(words));
        }

        private static Set<String> adviceWords(String message) {
            String normalized = message.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").strip();
            return Set.copyOf(List.of(normalized.split(" ")));
        }
    }
}
