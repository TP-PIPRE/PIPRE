package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Ranking;

import java.util.List;

public interface RankingRepositoryPort {
    List<Ranking> findAllByIdGroup(String idGroup);
    void save(Ranking ranking);
    void sortRanking(String idGroup);
}
