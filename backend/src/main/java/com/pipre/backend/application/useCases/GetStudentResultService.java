package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ResultDTO;
import com.pipre.backend.application.ports.input.GetStudentResultUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetStudentResultService implements GetStudentResultUseCase {
    private final ResultRepositoryPort resultRepositoryPort;

    @Override
    public List<ResultDTO> execute(String idStudent) {
        return resultRepositoryPort.findByIdStudent(idStudent)
                .stream()
                .map(r -> new ResultDTO(
                        r.getIdResult(),
                        r.getIdStudent(),
                        r.getIdActivity(),
                        r.getScore(),
                        r.getAttempts(),
                        r.getDateAttempted()
                ))
                .toList();
    }
}
