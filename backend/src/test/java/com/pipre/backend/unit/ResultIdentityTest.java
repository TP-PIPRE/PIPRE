package com.pipre.backend.unit;

import com.pipre.backend.application.commands.SaveResultCommand;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.application.useCases.SaveResultService;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ResultIdentityTest {
    @Test void emailCompatibilityStoresTheCanonicalStudentId() {
        var users=mock(UserRepositoryPort.class);
        var results=mock(ResultRepositoryPort.class);
        var user=mock(User.class);
        when(user.getIdUser()).thenReturn("student-id");
        when(users.findByEmail("student@test.invalid")).thenReturn(Optional.of(user));
        String id=new SaveResultService(results,users).execute(new SaveResultCommand("student@test.invalid","activity",BigDecimal.TEN,1));
        assertNotNull(id);
        verify(results).save(argThat(result->"student-id".equals(result.getIdStudent())&&id.equals(result.getIdResult())));
    }
    @Test void missingIdentityCannotReachPersistence() {
        var users=mock(UserRepositoryPort.class);
        var results=mock(ResultRepositoryPort.class);
        assertThrows(BusinessException.class,()->new SaveResultService(results,users)
                .execute(new SaveResultCommand(null,"activity",BigDecimal.TEN,1)));
        verifyNoInteractions(users,results);
    }
}
