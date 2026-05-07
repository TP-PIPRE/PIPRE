package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.CreateActivityCommand;

public interface CreateActivityUseCase {
    String execute(CreateActivityCommand cmd);
}
