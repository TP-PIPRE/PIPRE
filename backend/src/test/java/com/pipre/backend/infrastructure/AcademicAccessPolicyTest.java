package com.pipre.backend.infrastructure;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.infrastructure.security.AcademicAccessPolicy;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AcademicAccessPolicyTest {
    final AcademicAccessRepositoryPort access=mock(AcademicAccessRepositoryPort.class);
    final UserRepositoryPort users=mock(UserRepositoryPort.class);
    final AcademicAccessPolicy policy=new AcademicAccessPolicy(access,users);
    @BeforeEach void setup() {
        var user=mock(User.class);when(user.getIdUser()).thenReturn("current");
        when(users.findByEmail("current@test.invalid")).thenReturn(Optional.of(user));
        when(access.teacherCourses("current")).thenReturn(Set.of("course-one"));
        when(access.teacherGroups("current")).thenReturn(Set.of("class-one"));
        when(access.studentGroups("current")).thenReturn(Set.of("class-one"));
        when(access.sharesClassroom("current","student-one")).thenReturn(true);
        when(access.studentRankingVisibility()).thenReturn("CLASSROOM");
    }
    @AfterEach void clear() {SecurityContextHolder.clearContext();}
    void role(String role) {SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("current@test.invalid",null,List.of(new SimpleGrantedAuthority("ROLE_"+role))));}
    @Test void administratorCanManageAndReadGlobalResources() {role("ADMIN");assertTrue(policy.manageCourse("unassigned"));assertTrue(policy.readGroup("other"));assertTrue(policy.readStudent("other"));assertTrue(policy.globalRanking());assertNull(policy.visibleGroups());assertNull(policy.visibleCourses());}
    @Test void teacherMayManageOnlyAssignedCourses() {role("TEACHER");assertTrue(policy.manageCourse("course-one"));assertFalse(policy.manageCourse("course-two"));assertEquals(Set.of("course-one"),policy.visibleCourses());}
    @Test void teacherMayReadOnlyAssignedClassesAndTheirStudents() {role("TEACHER");assertTrue(policy.readGroup("class-one"));assertFalse(policy.readGroup("class-two"));assertTrue(policy.readStudent("student-one"));assertFalse(policy.readStudent("student-two"));assertFalse(policy.globalRanking());}
    @Test void studentCanReadOwnProgressButCannotManageCurriculum() {role("STUDENT");assertTrue(policy.readStudent("current"));assertFalse(policy.readStudent("student-one"));assertFalse(policy.manageCourse("course-one"));assertTrue(policy.readCourse("course-one"));}
    @Test void studentClassroomRankingNeverExposesOtherClasses() {role("STUDENT");assertTrue(policy.rankGroup("class-one"));assertFalse(policy.rankGroup("class-two"));assertFalse(policy.globalRanking());assertEquals(Set.of("class-one"),policy.visibleGroups());}
    @Test void administratorCanHideStudentRankingWithoutHidingAssignments() {role("STUDENT");when(access.studentRankingVisibility()).thenReturn("HIDDEN");assertFalse(policy.rankGroup("class-one"));assertTrue(policy.readGroup("class-one"));assertFalse(policy.globalRanking());}
    @Test void globalRankingIsExplicitlyConfigurableForStudents() {role("STUDENT");when(access.studentRankingVisibility()).thenReturn("GLOBAL");assertTrue(policy.globalRanking());assertFalse(policy.readGroup("class-two"));assertFalse(policy.rankGroup("class-two"));}
    @Test void activityWritesAlsoRequireTheDestinationCourse() {role("TEACHER");when(access.activityCourse("a1")).thenReturn("course-one");when(access.lessonCourse("l2")).thenReturn("course-two");assertTrue(policy.manageActivity("a1"));assertFalse(policy.manageLesson("l2"));}
    @Test void anonymousAndUnknownUsersReceiveNoAssignments() {assertFalse(policy.manageCourse("course-one"));assertFalse(policy.readStudent("student-one"));assertEquals(Set.of(),policy.visibleGroups());role("TEACHER");when(users.findByEmail(anyString())).thenReturn(Optional.empty());assertFalse(policy.readGroup("class-one"));assertFalse(policy.manageCourse("course-one"));}
    @Test void higherPriorityStaffRolesNeverInheritStudentGameplayOrGlobalVisibility() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("current@test.invalid",null,List.of(new SimpleGrantedAuthority("ROLE_TEACHER"),new SimpleGrantedAuthority("ROLE_STUDENT"))));
        when(access.studentRankingVisibility()).thenReturn("GLOBAL");assertFalse(policy.studentPlayer());assertFalse(policy.globalRanking());assertFalse(policy.readCourse("course-two"));assertEquals(Set.of("course-one"),policy.visibleCourses());
    }
}
