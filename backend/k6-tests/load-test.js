import http from 'k6/http';
import { check, sleep, group } from 'k6';

// 1. Configuración de tiempos (Ajusta aquí a humo o carga real)
export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Rampa de subida: de 0 a 20 usuarios en 30 segundos
        { duration: '1m', target: 20 },   // Carga sostenida: 20 usuarios simulando ráfagas durante 1 minuto
        { duration: '30s', target: 0 },   // Rampa de bajada: los usuarios se desconectan en 30 segundos
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // El 95% de las peticiones debe responder en menos de 500ms bajo estrés
        http_req_failed: ['rate<0.1'],    // La tasa de fallos total debe ser menor al 10%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://backend:8080/api/v1';

export default function () {
    let token = '';

    // ==========================================
    // GRUPO 1: AUTH & USERS
    // ==========================================
    group('1. Auth & Users', function () {
        /*
        let registerRes = http.post(`${BASE_URL}/users`, ...);
        */

        // Login directo con el administrador del Seeder
        const loginPayload = JSON.stringify({
            email: 'admin@pipre.com',
            password: '123'
        });

        let loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (check(loginRes, { 'Login status 200': (r) => r.status === 200 })) {
            token = loginRes.body;
        }
    });

    // Helper para inyectar token dinámico
    const getAuthHeaders = () => ({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    // Variables globales de la iteración para encadenar IDs reales
    let courseId = '';
    let moduleId = '';
    let lessonId = '';
    let activityId = '';

    // ==========================================
    // GRUPO 2: COURSES & MODULES
    // ==========================================
    group('2. Courses & Modules', function () {
        let coursesRes = http.get(`${BASE_URL}/courses`, getAuthHeaders());
        check(coursesRes, { 'Get courses status 200': (r) => r.status === 200 });

        // Intentamos capturar el primer curso del Seeder para tener un ID real
        try {
            const courses = JSON.parse(coursesRes.body);
            if (Array.isArray(courses) && courses.length > 0) {
                courseId = courses[0].idCourse;
            }
        } catch(e) {}

        const coursePayload = JSON.stringify({
            name: 'Curso de Carga K6',
            description: 'Curso generado en pruebas de carga',
            level: 'medium'
        });

        let postCourseRes = http.post(`${BASE_URL}/courses`, coursePayload, getAuthHeaders());
        check(postCourseRes, { 'Create course status 201': (r) => r.status === 201 });

        if (postCourseRes.status === 201 && !courseId) {
            try { courseId = JSON.parse(postCourseRes.body).idCourse; } catch(e) {}
        }

        if (courseId) {
            let putCourseRes = http.put(`${BASE_URL}/courses/${courseId}`, coursePayload, getAuthHeaders());
            check(putCourseRes, { 'Update course status 204': (r) => [200, 204].includes(r.status) });

            let modulesRes = http.get(`${BASE_URL}/modules/course/${courseId}`, getAuthHeaders());
            if (check(modulesRes, { 'Get modules status 200': (r) => r.status === 200 })) {
                try {
                    const mods = JSON.parse(modulesRes.body);
                    if (mods.length > 0) moduleId = mods[0].idModule;
                } catch(e) {}
            }

            const modulePayload = JSON.stringify({
                idCourse: courseId,
                title: 'Módulo de Carga 1'
            });
            let postModuleRes = http.post(`${BASE_URL}/modules`, modulePayload, getAuthHeaders());
            check(postModuleRes, { 'Create module status 201': (r) => r.status === 201 });
        }
    });

    // ==========================================
    // GRUPO 3: LESSONS & ACTIVITIES
    // ==========================================
    group('3. Lessons & Activities', function () {
        if (!moduleId) return; // Saltamos si no hay un módulo padre válido

        // 1. Obtener lecciones del módulo
        let lessonsRes = http.get(`${BASE_URL}/lessons/module/${moduleId}`, getAuthHeaders());
        if (check(lessonsRes, { 'Get lessons status 200': (r) => r.status === 200 })) {
            try {
                const les = JSON.parse(lessonsRes.body);
                if (les.length > 0) lessonId = les[0].idLesson;
            } catch(e) {}
        }

        // 2. Crear una lección real vinculada al módulo
        const lessonPayload = JSON.stringify({
            idModule: moduleId,
            title: 'Lección de prueba K6'
        });
        let postLessonRes = http.post(`${BASE_URL}/lessons`, lessonPayload, getAuthHeaders());
        check(postLessonRes, { 'Create lesson status 201': (r) => r.status === 201 });

        if (lessonId) {
            // 3. Obtener actividades de la lección
            let activitiesRes = http.get(`${BASE_URL}/activities/lesson/${lessonId}`, getAuthHeaders());
            if (check(activitiesRes, { 'Get activities status 200': (r) => r.status === 200 })) {
                try {
                    const acts = JSON.parse(activitiesRes.body);
                    if (acts.length > 0) activityId = acts[0].idActivity;
                } catch(e) {}
            }

            // 4. Crear actividad vinculada
            const activityPayload = JSON.stringify({
                idLesson: lessonId,
                name: 'Actividad de prueba K6'
            });
            let postActivityRes = http.post(`${BASE_URL}/activities`, activityPayload, getAuthHeaders());
            check(postActivityRes, { 'Create activity status 201': (r) => r.status === 201 });
        }
    });

    // ==========================================
    // GRUPO 4: ROLES, GROUPS & PERFORMANCE
    // ==========================================
    group('4. Roles, Groups & Performance', function () {
        let groupsRes = http.get(`${BASE_URL}/groups`, getAuthHeaders());
        check(groupsRes, { 'Get groups status 200': (r) => r.status === 200 });

        let rolesRes = http.get(`${BASE_URL}/roles`, getAuthHeaders());
        check(rolesRes, { 'Get roles status 200': (r) => r.status === 200 });

    });

    sleep(1);
}