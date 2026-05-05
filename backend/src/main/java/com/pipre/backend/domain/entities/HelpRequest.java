package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Builder
@Getter
public class HelpRequest {

    private final String idHelpRequest;
    private final Integer timesRequested;
    private final Integer aiInteractions;
    private final LocalDateTime requestedAt;
    private final String idStudent;

}
