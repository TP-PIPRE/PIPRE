package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.application.ports.input.GetStudentHistoryUseCase;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GetStudentHistoryService implements GetStudentHistoryUseCase {
    private final GamificationRepositoryPort repository;
    private final UserRepositoryPort users;
    @Override @Transactional(readOnly=true)
    public List<StudentHistoryDTO> execute(String idStudent) {
        var user=idStudent!=null&&idStudent.contains("@")?users.findByEmail(idStudent):users.findById(idStudent);
        return repository.history(user.orElseThrow(()->new BusinessException("El estudiante no existe.")).getIdUser());
    }
}
