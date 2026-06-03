package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class Simulation {

    private final String idSimulation;
    private final String result;
    private final String idStudent;
    private final String idActivity;

}
