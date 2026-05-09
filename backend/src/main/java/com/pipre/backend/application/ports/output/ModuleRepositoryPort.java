package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Module;

import java.util.List;

public interface ModuleRepositoryPort {
    List<Module> findAllByIdCourse(String idCourse);

    void save(Module newModule);
}
