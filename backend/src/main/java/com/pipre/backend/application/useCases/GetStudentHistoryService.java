package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.application.ports.input.GetStudentHistoryUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetStudentHistoryService implements GetStudentHistoryUseCase {
    private final ResultRepositoryPort resultRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;

    private String resolveUserId(String idOrEmail) {
        if (idOrEmail != null && idOrEmail.contains("@")) {
            return userRepositoryPort.findByEmail(idOrEmail)
                    .map(u -> u.getIdUser())
                    .orElse(idOrEmail);
        }
        return idOrEmail;
    }

    @Override
    public List<StudentHistoryDTO> execute(String idStudent) {
        String resolvedId = resolveUserId(idStudent);
        return resultRepositoryPort.findByIdStudent(resolvedId)
                .stream()
                .map(r -> {
                    int stars = 0;
                    if (r.getScore() != null) {
                        double score = r.getScore().doubleValue();
                        if (score >= 50) stars = 1;
                        if (score >= 70) stars = 2;
                        if (score >= 90) stars = 3;
                    }
                    return new StudentHistoryDTO(
                            r.getIdResult(),
                            r.getIdActivity(),
                            "Actividad " + r.getIdActivity(),
                            r.getScore(),
                            stars,
                            r.getScore() != null ? r.getScore().intValue() : 0,
                            0.0,
                            r.getDateAttempted()
                    );
                })
                .toList();
    }
}
