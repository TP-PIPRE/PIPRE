package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.output.VerifiedRankingRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class VerifiedRankingRepositoryAdapter implements VerifiedRankingRepositoryPort {
    private final JdbcTemplate jdbc;
    static final String STUDENTS="u.is_active=TRUE AND EXISTS(SELECT 1 FROM user_role ur JOIN roles r ON r.id_role=ur.id_role WHERE ur.id_user=u.id_user AND r.name='STUDENT') AND NOT EXISTS(SELECT 1 FROM user_role ur JOIN roles r ON r.id_role=ur.id_role WHERE ur.id_user=u.id_user AND r.name IN ('TEACHER','ADMIN'))";
    private static final String TOTAL="(SELECT COALESCE(SUM(s.best_points),0) FROM game_best_scores s WHERE s.student_id=u.id_user)";
    public List<RankingDTO> global() {return rows(TOTAL,STUDENTS);}
    public List<RankingDTO> classroom(String group) {return rows(TOTAL,STUDENTS+" AND EXISTS(SELECT 1 FROM group_students gs WHERE gs.id_student=u.id_user AND gs.id_group=?)",group);}
    public List<RankingDTO> course(String course) {return curricular("m.id_course",course);}
    public List<RankingDTO> module(String module) {return curricular("m.id_module",module);}
    private List<RankingDTO> curricular(String column,String id) {
        String matching="s.exercise_key LIKE 'official:%' AND EXISTS(SELECT 1 FROM activities a JOIN lessons l ON l.id_lesson=a.id_lesson JOIN modules m ON m.id_module=l.id_module WHERE "+column+"=? AND (a.level_template=s.level_template OR (s.game='neonflow' AND s.level_template NOT IN ('neonflow-v2-1','neonflow-v2-2') AND a.level_template=REPLACE(s.level_template,'-v2-','-'))))";
        String sum="(SELECT COALESCE(SUM(s.best_points),0) FROM game_best_scores s WHERE s.student_id=u.id_user AND "+matching+")";
        return rows(sum,STUDENTS+" AND EXISTS(SELECT 1 FROM game_best_scores s WHERE s.student_id=u.id_user AND "+matching+")",id,id);
    }
    private List<RankingDTO> rows(String points,String condition,Object... parameters) {
        var data=jdbc.query("SELECT u.id_user,CONCAT(u.first_name,' ',u.last_name) student_name,"+points+" points FROM users u WHERE "+condition+" ORDER BY points DESC,u.id_user",
            (rs,row)->new RankingDTO(rs.getString("id_user"),rs.getString("student_name"),rs.getBigDecimal("points"),row+1,1,0,0,0,0),parameters);
        return List.copyOf(data);
    }
}
