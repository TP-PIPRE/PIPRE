package com.pipre.backend.application.useCases;
import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.output.RankingMetadataPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

/** Batch verified metadata without modifying historical balances or the scoped ranking order. */
@Component @RequiredArgsConstructor
public class RankingGamificationView {
    private final RankingMetadataPort metadata;
    @Transactional(readOnly=true) public List<RankingDTO> apply(List<RankingDTO> rankings) {
        if(rankings.isEmpty())return List.of();
        var byStudent=metadata.load(rankings.stream().map(RankingDTO::idStudent).collect(Collectors.toSet()));
        return rankings.stream().map(row->{
            var value=byStudent.get(row.idStudent());
            if(value==null)throw new IllegalStateException("No se pudieron cargar los metadatos del ranking.");
            return new RankingDTO(row.idStudent(),row.studentName(),row.totalPoints(),row.position(),value.level(),value.xp(),value.stars(),value.currentStreak(),value.bestStreak());
        }).toList();
    }
}
