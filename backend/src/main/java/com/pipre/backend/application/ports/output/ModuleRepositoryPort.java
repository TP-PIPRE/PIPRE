package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.module.Module;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ModuleRepositoryPort {
    List<Module> findAllByIdCourse(String idCourse);
    Page<Module> findAllByIdCourse(String idCourse, Pageable pageable);
    void save(Module newModule);
    Optional<Module> findById(String idModule);
    void deleteById(String idModule);
}
