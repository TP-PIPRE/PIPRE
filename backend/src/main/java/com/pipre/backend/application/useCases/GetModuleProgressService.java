package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ModuleProgressDTO;
import com.pipre.backend.application.ports.input.GetModuleProgressUseCase;
import com.pipre.backend.application.ports.output.ModuleProgressRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetModuleProgressService implements GetModuleProgressUseCase {

    private final ModuleProgressRepositoryPort moduleProgressRepositoryPort;

    @Override
    public List<ModuleProgressDTO> execute(String idStudent) {
        return moduleProgressRepositoryPort.findAllByIdStudent(idStudent)
                .stream()
                .map(mp -> new ModuleProgressDTO(
                        mp.getIdProgress(),
                        mp.getPercentage(),
                        mp.getStatus(),
                        mp.getUpdatedAt(),
                        mp.getIdStudent(),
                        mp.getIdModule()
                ))
                .toList();
    }
}
