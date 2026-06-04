package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.StudentResultResponseDTO;
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
    public List<StudentResultResponseDTO> execute(String idStudent) {
        return resultRepositoryPort.findByIdStudent(idStudent)
                .stream()
                .map(r -> new StudentResultResponseDTO(
                        r.getIdActivity(),
                        r.getScore()
                ))
                .toList();
    }
}
