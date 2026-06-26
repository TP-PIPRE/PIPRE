package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.result.Result;

import java.util.List;
import java.util.Optional;

public interface ResultRepositoryPort {
    Optional<Result> findById(String idResult);

    List<Result> findByIdStudent(String idStudent);

    void save(Result result);

    List<Object[]> findCourseRankingRaw(String courseId);

    List<Object[]> findModuleRankingRaw(String moduleId);
}
