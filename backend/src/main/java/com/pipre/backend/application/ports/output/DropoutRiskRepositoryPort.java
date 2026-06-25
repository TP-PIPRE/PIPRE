package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.dropoutrisk.DropoutRisk;
import java.util.Optional;

public interface DropoutRiskRepositoryPort {
    Optional<DropoutRisk> findByIdStudent(String idStudent);
    void save(DropoutRisk dropoutRisk);
}
