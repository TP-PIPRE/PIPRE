package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveModuleProgressCommand;
import com.pipre.backend.application.ports.input.SaveModuleProgressUseCase;
import com.pipre.backend.application.ports.output.ModuleProgressRepositoryPort;
import com.pipre.backend.domain.entities.moduleprogress.ModuleProgress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SaveModuleProgressService implements SaveModuleProgressUseCase {

    private final ModuleProgressRepositoryPort moduleProgressRepositoryPort;

    @Override
    public String execute(SaveModuleProgressCommand command) {
        // Verificar si ya existe progreso para este alumno y módulo
        ModuleProgress progress = moduleProgressRepositoryPort.findByStudentAndModule(command.idStudent(), command.idModule())
                .map(existing -> ModuleProgress.builder()
                        .idProgress(existing.getIdProgress())
                        .percentage(command.percentage())
                        .status(command.status())
                        .updatedAt(LocalDateTime.now())
                        .idStudent(existing.getIdStudent())
                        .idModule(existing.getIdModule())
                        .build())
                .orElseGet(() -> ModuleProgress.builder()
                        .idProgress(UUID.randomUUID().toString())
                        .percentage(command.percentage())
                        .status(command.status())
                        .updatedAt(LocalDateTime.now())
                        .idStudent(command.idStudent())
                        .idModule(command.idModule())
                        .build());

        moduleProgressRepositoryPort.save(progress);
        return progress.getIdProgress();
    }
}
