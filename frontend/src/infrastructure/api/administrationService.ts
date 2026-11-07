import axiosInstance from "./axiosInstance";
import type {ActivityResponseDTO,CourseResponseDTO,GroupDTO,RoleDTO} from "./models/apiModels";
export type StudentRankingVisibility="HIDDEN"|"CLASSROOM"|"GLOBAL";
export interface AdministrationSnapshot {
  users:Array<{idUser:string;firstName:string;lastName:string;email:string;roles:string[];active:boolean}>;
  groups:GroupDTO[];courses:CourseResponseDTO[];
  assignments:Array<{teacherId:string|null;groupId:string|null;courseId:string|null}>;
  studentRankingVisibility:StudentRankingVisibility;
}
const id=encodeURIComponent;
export const administrationService={
  snapshot:async()=>{
    const [snapshot,roles]=await Promise.all([axiosInstance.get<AdministrationSnapshot>("administration"),axiosInstance.get<RoleDTO[]>("roles")]);
    return {...snapshot.data,roles:roles.data};
  },
  createClassroom:async(name:string,description:string)=>(await axiosInstance.post<GroupDTO>("administration/classrooms",{name,description})).data,
  teacherClassroom:async(teacher:string,group:string,assigned=true)=>{
    const path=`administration/teachers/${id(teacher)}/classrooms/${id(group)}`;
    if(assigned)await axiosInstance.put(path);else await axiosInstance.delete(path);
  },
  teacherCourse:async(teacher:string,course:string,assigned=true)=>{
    const path=`administration/teachers/${id(teacher)}/courses/${id(course)}`;
    if(assigned)await axiosInstance.put(path);else await axiosInstance.delete(path);
  },
  classroomCourse:async(group:string,course:string,assigned=true)=>{
    const path=`administration/classrooms/${id(group)}/courses/${id(course)}`;
    if(assigned)await axiosInstance.put(path);else await axiosInstance.delete(path);
  },
  setStudentRankingVisibility:async(studentVisibility:StudentRankingVisibility)=>{await axiosInstance.put("rankings/settings",{studentVisibility});},
  assignRole:async(idUser:string,idRole:string)=>{await axiosInstance.post("roles/user",{idUser,idRole});},
  removeRole:async(idUser:string,idRole:string)=>{await axiosInstance.delete(`roles/user/${id(idUser)}/${id(idRole)}`);},
  setUserActive:async(user:string,active:boolean)=>{await axiosInstance.put(`users/${id(user)}/status`,{active});},
  classroomActivities:async(group:string)=>{
    const rows:ActivityResponseDTO[]=[];
    for(let page=0;;page++) {
      const response=await axiosInstance.get<{content:ActivityResponseDTO[];last:boolean}>(`groups/${id(group)}/activities`,{params:{page,size:100}});
      if(!Array.isArray(response.data.content)||typeof response.data.last!=="boolean"||(!response.data.last&&response.data.content.length===0))throw new Error("La página de retos asignados no es válida.");
      rows.push(...response.data.content);if(response.data.last)return rows;
    }
  },
  classroomActivity:async(group:string,activity:string,assigned=true)=>{
    const path=`groups/${id(group)}/activities/${id(activity)}`;
    if(assigned)await axiosInstance.put(path);else await axiosInstance.delete(path);
  },
};
