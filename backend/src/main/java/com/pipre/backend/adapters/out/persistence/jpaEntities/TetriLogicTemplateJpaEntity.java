package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Map;

@Entity
@Table(name = "tetrilogic_templates")
@Immutable
@Getter
@NoArgsConstructor
public class TetriLogicTemplateJpaEntity {
    @Id
    @Column(name = "template_id", length = 40)
    private String templateId;
    private int version;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> config;
}
