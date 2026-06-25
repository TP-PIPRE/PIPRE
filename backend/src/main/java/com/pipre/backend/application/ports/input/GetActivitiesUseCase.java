package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ActivityDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetActivitiesUseCase {
    Page<ActivityDTO> execute(String id, Pageable pageable);
}
