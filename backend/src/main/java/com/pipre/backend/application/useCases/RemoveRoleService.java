package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RemoveRoleService {
    private final UserRepositoryPort users;
    private final RoleRepositoryPort roles;
    private final AcademicAdministrationPort administration;
    @Transactional
    public void execute(String userId,String roleId) {
        roles.lockAdministration();
        var user=users.lockById(userId).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));
        var role=roles.findAll().stream().filter(value->value.getIdRole().equals(roleId)).findFirst().orElseThrow(()->new ResourceNotFoundException("El rol no existe."));
        if(!user.getIdRoleList().contains(roleId))return;
        if(role.getName().equals("ADMIN")&&Boolean.TRUE.equals(user.getIsActive())&&roles.activeAdministrators()<=1)
            throw new BusinessException("No se puede retirar el último administrador activo.");
        var changed=user.removeRole(roleId);users.save(changed);
        if(role.getName().equals("TEACHER"))for(var assignment:administration.assignments())if(userId.equals(assignment.teacherId())) {
            if(assignment.groupId()!=null)administration.teacherGroup(userId,assignment.groupId(),false);
            else administration.teacherCourse(userId,assignment.courseId(),false);
        }
    }
}
