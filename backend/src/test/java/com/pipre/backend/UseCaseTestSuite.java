package com.pipre.backend;

import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

@Suite
@SuiteDisplayName("Suite de Casos de Uso - Pipre Backend")
@SelectPackages("com.pipre.backend.application.useCases")
public class UseCaseTestSuite {
}
