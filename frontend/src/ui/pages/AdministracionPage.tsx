import {useState} from "react";
import {Link} from "react-router-dom";
import {useAsyncResource} from "../../application/hooks/useAsyncResource";
import {administrationService,type StudentRankingVisibility} from "../../infrastructure/api/administrationService";
import {apiService} from "../../infrastructure/api/apiService";
import {getApiErrorMessage} from "../../infrastructure/api/errors";
import {loadCourseActivities} from "../../application/usecases/loadCourseActivities";

const input="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";
export function AdministracionPage() {
  const resource=useAsyncResource("administration",administrationService.snapshot);
  const [error,setError]=useState("");const [notice,setNotice]=useState("");const [saving,setSaving]=useState(false);
  const [name,setName]=useState("");const [description,setDescription]=useState("");
  const [teacher,setTeacher]=useState("");const [teacherGroup,setTeacherGroup]=useState("");const [teacherCourse,setTeacherCourse]=useState("");
  const [group,setGroup]=useState("");const [course,setCourse]=useState("");const [student,setStudent]=useState("");
  const [visibility,setVisibility]=useState<StudentRankingVisibility|"">("");
  const [user,setUser]=useState("");const [role,setRole]=useState("");
  const data=resource.data;
  const perform=async(action:()=>Promise<unknown>,message:string)=>{
    setSaving(true);setError("");setNotice("");
    try{await action();setNotice(message);resource.retry();}catch(failure){setError(getApiErrorMessage(failure,"No se pudo guardar el cambio."));}finally{setSaving(false);}
  };
  if(resource.loading)return <main className="lab-shell"><h1>Administración</h1><p role="status">Cargando administración…</p></main>;
  if(resource.error||!data)return <main className="lab-shell"><h1>Administración</h1><p role="alert">No pudimos cargar la administración.</p><button className="btn-secondary" onClick={resource.retry}>Reintentar</button></main>;
  const teachers=data.users.filter(row=>row.roles.includes("TEACHER")),students=data.users.filter(row=>row.roles.includes("STUDENT"));
  const chosenVisibility=visibility||data.studentRankingVisibility;
  const groups=data.groups.map(row=><option key={row.idGroup} value={row.idGroup}>{row.groupName}</option>);
  const courses=data.courses.map(row=><option key={row.idCourse} value={row.idCourse}>{row.name}</option>);
  const displayUser=(id:string)=>{const found=data.users.find(row=>row.idUser===id);return found?`${found.firstName} ${found.lastName}`:id;};
  const selectedUser=data.users.find(row=>row.idUser===user);
  const selectedRole=data.roles.find(row=>row.idRole===role);
  return <main className="lab-shell"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1>Administración</h1><p className="page-intro">Gestiona aulas, asignaciones y acceso al ranking. Los permisos se comprueban en el servidor.</p></div><Link to="/docente/metricas" className="btn-secondary">Ver métricas institucionales</Link></div>
    {error&&<p role="alert" className="border border-danger rounded-lg p-3">{error}</p>}{notice&&<p role="status" className="p-3 text-success">{notice}</p>}
    <div className="grid gap-5 lg:grid-cols-2">
      <form aria-label="Crear aula" className="rounded-lg border border-border p-5 space-y-3" onSubmit={event=>{event.preventDefault();void perform(async()=>{await administrationService.createClassroom(name,description);setName("");setDescription("");},"Aula creada.");}}>
        <h2 className="text-lg font-semibold">Crear aula</h2><label className="block">Nombre del aula<input className={input} required maxLength={150} value={name} onChange={event=>setName(event.target.value)}/></label><label className="block">Descripción<textarea className={input} maxLength={2000} value={description} onChange={event=>setDescription(event.target.value)}/></label><button disabled={saving} className="btn-premium">Crear aula</button>
      </form>
      <section className="rounded-lg border border-border p-5 space-y-3"><h2 className="text-lg font-semibold">Asignar docente</h2>
        <label className="block">Docente<select className={input} value={teacher} onChange={event=>setTeacher(event.target.value)}><option value="">Selecciona docente</option>{teachers.map(row=><option key={row.idUser} value={row.idUser}>{row.firstName} {row.lastName}</option>)}</select></label>
        <label className="block">Aula del docente<select className={input} value={teacherGroup} onChange={event=>setTeacherGroup(event.target.value)}><option value="">Selecciona aula</option>{groups}</select></label><button disabled={saving||!teacher||!teacherGroup} className="btn-secondary" onClick={()=>void perform(()=>administrationService.teacherClassroom(teacher,teacherGroup),"Docente asignado al aula.")}>Asignar aula al docente</button>
        <label className="block">Curso del docente<select className={input} value={teacherCourse} onChange={event=>setTeacherCourse(event.target.value)}><option value="">Selecciona curso</option>{courses}</select></label><button disabled={saving||!teacher||!teacherCourse} className="btn-secondary" onClick={()=>void perform(()=>administrationService.teacherCourse(teacher,teacherCourse),"Docente asignado al curso.")}>Asignar curso al docente</button>
      </section>
      <section className="rounded-lg border border-border p-5 space-y-3"><h2 className="text-lg font-semibold">Contenido y estudiantes del aula</h2>
        <label className="block">Aula<select className={input} value={group} onChange={event=>setGroup(event.target.value)}><option value="">Selecciona aula</option>{groups}</select></label>
        <label className="block">Curso del aula<select className={input} value={course} onChange={event=>setCourse(event.target.value)}><option value="">Selecciona curso</option>{courses}</select></label><button disabled={saving||!group||!course} className="btn-secondary" onClick={()=>void perform(()=>administrationService.classroomCourse(group,course),"Curso asignado al aula.")}>Asignar curso al aula</button>
        {group&&course&&<ClassroomActivities key={`${group}:${course}`} group={group} course={course} saving={saving} perform={perform}/>}
        <label className="block">Estudiante<select className={input} value={student} onChange={event=>setStudent(event.target.value)}><option value="">Selecciona estudiante</option>{students.map(row=><option key={row.idUser} value={row.idUser}>{row.firstName} {row.lastName}</option>)}</select></label><button disabled={saving||!group||!student} className="btn-secondary" onClick={()=>void perform(()=>apiService.ranking.addToGroup({idGroup:group,idStudent:student}),"Estudiante asignado al aula.")}>Asignar estudiante al aula</button>
      </section>
      <section className="rounded-lg border border-border p-5 space-y-3"><h2 className="text-lg font-semibold">Ranking estudiantil</h2><label className="block">Visibilidad para estudiantes<select className={input} value={chosenVisibility} onChange={event=>setVisibility(event.target.value as StudentRankingVisibility)}><option value="HIDDEN">Oculto</option><option value="CLASSROOM">Sólo sus aulas</option><option value="GLOBAL">Global</option></select></label><button disabled={saving} className="btn-premium" onClick={()=>void perform(()=>administrationService.setStudentRankingVisibility(chosenVisibility),"Configuración del ranking guardada.")}>Guardar visibilidad</button><p className="text-sm text-text-muted">Esta opción no amplía los permisos de los docentes ni permite consultar progreso ajeno.</p>
      </section>
      <section className="rounded-lg border border-border p-5 space-y-3"><h2 className="text-lg font-semibold">Usuarios y roles</h2><label className="block">Usuario<select className={input} value={user} onChange={event=>setUser(event.target.value)}><option value="">Selecciona usuario</option>{data.users.map(row=><option key={row.idUser} value={row.idUser}>{row.firstName} {row.lastName} · {row.roles.join(", ")}</option>)}</select></label><label className="block">Rol<select className={input} value={role} onChange={event=>setRole(event.target.value)}><option value="">Selecciona rol</option>{data.roles.map(row=><option key={row.idRole} value={row.idRole}>{row.name}</option>)}</select></label><button disabled={saving||!user||!role||!!selectedUser?.roles.includes(selectedRole?.name??"")} className="btn-secondary" onClick={()=>void perform(()=>administrationService.assignRole(user,role),"Rol asignado. El usuario debe volver a iniciar sesión.")}>Añadir rol</button><button disabled={saving||!selectedUser?.roles.includes(selectedRole?.name??"")} className="btn-secondary" onClick={()=>void perform(()=>administrationService.removeRole(user,role),"Rol retirado. El usuario debe volver a iniciar sesión.")}>Retirar rol</button><p className="text-sm text-text-muted">Un cambio requiere iniciar sesión con los roles vigentes. Se conserva al menos un rol por usuario y un administrador activo.</p>{selectedUser&&<div><p>Cuenta {selectedUser.active?"activa":"inactiva"}</p><button disabled={saving} className="btn-secondary" onClick={()=>void perform(()=>administrationService.setUserActive(selectedUser.idUser,!selectedUser.active),selectedUser.active?"Cuenta desactivada; se conserva su historial.":"Cuenta activada.")}>{selectedUser.active?"Desactivar cuenta":"Activar cuenta"}</button></div>}</section>
      <section className="rounded-lg border border-border p-5 space-y-3"><h2 className="text-lg font-semibold">Asignaciones vigentes</h2>{data.assignments.length?data.assignments.map(row=><div className="flex flex-wrap justify-between items-center gap-2 border-b border-border py-2" key={`${row.teacherId??"aula"}:${row.groupId}:${row.courseId}`}><span>{row.teacherId?displayUser(row.teacherId):data.groups.find(item=>item.idGroup===row.groupId)?.groupName} · {row.teacherId&&row.groupId?data.groups.find(item=>item.idGroup===row.groupId)?.groupName:data.courses.find(item=>item.idCourse===row.courseId)?.name}</span><button disabled={saving} className="btn-secondary" onClick={()=>void perform(()=>row.teacherId?(row.groupId?administrationService.teacherClassroom(row.teacherId,row.groupId,false):administrationService.teacherCourse(row.teacherId,row.courseId!,false)):administrationService.classroomCourse(row.groupId!,row.courseId!,false),"Asignación retirada.")}>Retirar asignación</button></div>):<p className="text-sm text-text-muted">Todavía no hay asignaciones.</p>}</section>
    </div>
  </main>;
}

function ClassroomActivities({group,course,saving,perform}:{group:string;course:string;saving:boolean;perform:(action:()=>Promise<unknown>,message:string)=>Promise<void>}) {
  const [activity,setActivity]=useState("");
  const resource=useAsyncResource(`classroom-activities:${group}:${course}`,async()=>{
    const [catalog,assigned]=await Promise.all([loadCourseActivities(course),administrationService.classroomActivities(group)]);
    return {catalog,assigned};
  });
  if(resource.loading)return <p role="status">Cargando retos del curso…</p>;
  if(resource.error||!resource.data)return <div><p role="alert">No pudimos cargar los retos asignados.</p><button className="btn-secondary" onClick={resource.retry}>Reintentar retos</button></div>;
  const assigned=resource.data.assigned.some(row=>row.idActivity===activity);
  return <div className="space-y-2"><label className="block">Reto del aula<select className={input} value={activity} onChange={event=>setActivity(event.target.value)}><option value="">Selecciona reto</option>{resource.data.catalog.map(row=><option key={row.idActivity} value={row.idActivity}>{row.name}{resource.data!.assigned.some(item=>item.idActivity===row.idActivity)?" · asignado":""}</option>)}</select></label><button disabled={saving||!activity} className="btn-secondary" onClick={()=>void perform(()=>administrationService.classroomActivity(group,activity,!assigned),assigned?"Reto retirado del aula.":"Reto asignado al aula.")}>{assigned?"Retirar reto del aula":"Asignar reto al aula"}</button><p className="text-sm text-text-muted">Asigna primero su curso al aula. Retirar un reto de aquí conserva su tablero, resultados y progreso.</p></div>;
}
