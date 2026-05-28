package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.Prediction;
import com.pipre.backend.domain.entities.Activity;
import com.pipre.backend.domain.entities.Result;
import com.pipre.backend.domain.entities.HelpRequest;

public interface PerformanceEvaluationPort {
    Prediction getEvaluation(
            Activity activity,
            HelpRequest helpRequest,
            Result result);
}
