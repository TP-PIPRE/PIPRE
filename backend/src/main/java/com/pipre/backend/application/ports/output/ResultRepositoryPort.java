package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Result;

import java.util.Optional;

public interface ResultRepositoryPort {
    Optional<Result> findById(String idResult);
}
