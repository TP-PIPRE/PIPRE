package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.*;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

/** Explicit partial JSON: omitted fields survive; null is rejected; [] removes missions. */
@Service @RequiredArgsConstructor
public class PatchCurriculumService {
    private final CourseRepositoryPort courses;
    private final ActivityRepositoryPort activities;
    private final UpdateActivityService updateActivity;
    private final UpdateCoursesService updateCourse;
    private final ObjectMapper json;
    private final jakarta.validation.Validator validator;
    private void validate(JsonNode patch,Set<String> allowed) {
        if(!patch.isObject()||patch.isEmpty())throw new BusinessException("Envía un objeto con campos editables.");
        patch.fields().forEachRemaining(field->{if(!allowed.contains(field.getKey())||field.getValue().isNull())throw new BusinessException("Campo no editable o nulo: "+field.getKey());});
    }
    @Transactional public CourseDTO course(String id,JsonNode patch) {
        validate(patch,Set.of("name","description","level"));
        patch.fields().forEachRemaining(field->{if(!field.getValue().isTextual())throw new BusinessException("Los campos de curso deben ser texto.");});
        var existing=courses.lockById(id).orElseThrow(()->new ResourceNotFoundException("El curso no existe."));
        String name=patch.has("name")?patch.get("name").textValue():existing.getName();
        String description=patch.has("description")?patch.get("description").textValue():existing.getDescription();
        String level=patch.has("level")?patch.get("level").textValue():existing.getLevel().name();
        updateCourse.execute(id,new RegisterCourseCommand(name,description,level));
        return new CourseDTO(id,name,description,com.pipre.backend.domain.entities.course.CourseLevel.fromString(level).name());
    }
    @Transactional public ActivityDTO activity(String id,JsonNode patch) {
        validate(patch,Set.of("idLesson","name","complexity","difficulty","logicLevel","type","environment","missions","startingPosition","targetPosition","description","displayOrder","levelTemplate"));
        patch.fields().forEachRemaining(field->{
            String key=field.getKey();var value=field.getValue();
            boolean valid=switch(key){case "logicLevel","displayOrder"->value.isIntegralNumber()&&value.canConvertToInt();case "missions"->value.isArray();case "startingPosition","targetPosition"->value.isObject();default->value.isTextual();};
            if(!valid)throw new BusinessException("Tipo no válido para "+key);
        });
        activities.lockById(id).orElseThrow(()->new ResourceNotFoundException("La actividad no existe."));
        CreateActivityCommand command;
        try{command=json.readerFor(CreateActivityCommand.class).with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).without(DeserializationFeature.ACCEPT_FLOAT_AS_INT).readValue(patch);}catch(java.io.IOException failure){throw new BusinessException("Los tipos del PATCH no son válidos.");}
        if(!validator.validate(command).isEmpty())throw new BusinessException("Los parámetros del reto no son válidos.");
        updateActivity.execute(id,command);
        return ActivityDtoMapper.toDTO(activities.findById(id).orElseThrow());
    }
}
