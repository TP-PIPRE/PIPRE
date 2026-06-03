package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.RankingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RankingResponseDTO;
import com.pipre.backend.application.ports.input.AddStudentRankingUseCase;
import com.pipre.backend.application.ports.input.GetGroupRankingUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/group-students")
@RequiredArgsConstructor
public class RankingController {

    private final GetGroupRankingUseCase getGroupRankingUseCase;
    private final AddStudentRankingUseCase addStudentRankingUseCase;

    @GetMapping("/{idGroup}")
    public ResponseEntity<List<RankingResponseDTO>> getGroupRanking(@PathVariable String idGroup) {
        return ResponseEntity.ok(getGroupRankingUseCase.execute(idGroup));
    }

    @PostMapping
    public ResponseEntity<Void> assignGroupStudent(@RequestBody RankingRequestDTO requestDTO) {
        addStudentRankingUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
