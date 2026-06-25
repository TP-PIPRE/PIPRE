package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.moduleprogress.ModuleProgress;
import java.util.List;
import java.util.Optional;

public interface ModuleProgressRepositoryPort {
    Optional<ModuleProgress> findById(String idProgress);
    Optional<ModuleProgress> findByStudentAndModule(String idStudent, String idModule);
    List<ModuleProgress> findAllByIdStudent(String idStudent);
    void save(ModuleProgress moduleProgress);
}
