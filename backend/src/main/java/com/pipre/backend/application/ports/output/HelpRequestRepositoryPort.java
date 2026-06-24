package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.helprequest.HelpRequest;
import java.util.List;
import java.util.Optional;

public interface HelpRequestRepositoryPort {
    Optional<HelpRequest> findById(String idHelpRequest);
    List<HelpRequest> findAllByIdStudent(String idStudent);
    void save(HelpRequest helpRequest);
}
