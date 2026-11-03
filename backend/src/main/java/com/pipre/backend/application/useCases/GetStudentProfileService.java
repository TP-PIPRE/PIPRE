package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.PlayerProfileDTO;
import com.pipre.backend.application.ports.input.GetStudentProfileUseCase;
import com.pipre.backend.application.ports.input.GetGameProgressUseCase;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetStudentProfileService implements GetStudentProfileUseCase {
    private final GamificationRepositoryPort repository;
    private final GetGameProgressUseCase progressUseCase;
    private final UserRepositoryPort users;
    @Override @Transactional(readOnly=true)
    public PlayerProfileDTO execute(String idStudent) {
        var user=(idStudent!=null&&idStudent.contains("@")?users.findByEmail(idStudent):users.findById(idStudent))
                .orElseThrow(()->new BusinessException("El estudiante no existe."));
        var account=repository.account(user.getIdUser()); var progress=progressUseCase.progress(user.getIdUser());
        return new PlayerProfileDTO(user.getIdUser(),user.getFirstName()+" "+user.getLastName(),account.totalPoints(),account.position(),account.level(),
                account.xpTotal(),progress.totalStars(),progress.currentStreak(),progress.bestStreak(),progress.completedLevels(),0L,null);
    }
}
