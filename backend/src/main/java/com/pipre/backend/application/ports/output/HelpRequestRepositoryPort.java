package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.HelpRequest;

import java.util.Optional;

public interface HelpRequestRepositoryPort {
    Optional<HelpRequest> findById(String idHelpRequest);
}
