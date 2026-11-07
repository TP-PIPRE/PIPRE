package com.pipre.backend.application.useCases;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor
public class SetUserActiveService {
    private final UserRepositoryPort users;
    private final RoleRepositoryPort roles;
    @Transactional public void execute(String userId,boolean active) {
        roles.lockAdministration();
        var user=users.lockById(userId).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));
        if(Boolean.TRUE.equals(user.getIsActive())==active)return;
        boolean admin=roles.findAll().stream().anyMatch(role->role.getName().equals("ADMIN")&&user.getIdRoleList().contains(role.getIdRole()));
        if(!active&&admin&&roles.activeAdministrators()<=1)throw new BusinessException("Debe conservarse un administrador activo.");
        users.save(user.toBuilder().isActive(active).build());
    }
}
