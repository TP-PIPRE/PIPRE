package com.pipre.backend.application.ports.output;


import com.pipre.backend.domain.entities.Simulation;

import java.util.List;

public interface SimulationRepositoryPort {
    List<Simulation> getAllByStudentId(String idStudent);
    void save(Simulation simulation);
}
