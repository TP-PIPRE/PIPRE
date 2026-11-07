package com.pipre.backend.unit;

import com.pipre.backend.application.commands.CreateSimulationCommand;
import com.pipre.backend.application.useCases.CreateSimulationService;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SimulationArithmeticTest {
    private CreateSimulationCommand command(String result,int blocks,Double error) { return new CreateSimulationCommand(result,"student","activity",null,null,null,blocks,0,error,0,null,null,null,null); }
    @Test void largeCountersCannotOverflowTheExistingScoreFormula() {
        var repository=mock(SimulationRepositoryPort.class);var service=new CreateSimulationService(repository);
        service.execute(command("FAILURE",Integer.MAX_VALUE,0.0));
        service.execute(command("SUCCESS",Integer.MAX_VALUE,0.0));
        var saved=ArgumentCaptor.forClass(Simulation.class);verify(repository,times(2)).save(saved.capture());
        assertEquals(50,saved.getAllValues().get(0).getPredictedScore());assertEquals(50,saved.getAllValues().get(1).getPredictedScore());
    }
    @Test void rejectsNonFiniteSensorReadingsBeforePersistence() {
        var repository=mock(SimulationRepositoryPort.class);var service=new CreateSimulationService(repository);
        for(double value:new double[]{Double.NaN,Double.POSITIVE_INFINITY,Double.NEGATIVE_INFINITY}) assertThrows(BusinessException.class,()->service.execute(command("SUCCESS",1,value)));
        verifyNoInteractions(repository);
    }
}
