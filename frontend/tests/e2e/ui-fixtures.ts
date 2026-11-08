// Controlled UI contract fixtures; application.cy.ts uses actual HTTP and PostgreSQL.
export const course={idCourse:"c001",name:"Curso QA",description:"Fixture curricular",level:"LOW"};
export const activity={idActivity:"a1",idLesson:"l1",name:"Actividad QA",description:"Objetivo QA",environment:"neonflow",levelTemplate:"neonflow-v2-1",displayOrder:1,difficulty:"EASY",logicLevel:1};
export const ranking={idStudent:"qa-student",studentName:"Estudiante QA",position:1,totalPoints:10,level:1,xpTotal:0,totalStars:0,currentStreak:0,maxStreak:0};
export const page=(content:unknown[])=>({content,last:true,totalPages:1,totalElements:content.length,number:0,size:100});
export function user(role="student") {
  cy.setCookie("pipre_user",encodeURIComponent(JSON.stringify({id:"qa-student",name:"QA",email:"qa@test.invalid",role})));
}
export function apiFixtures() {
  cy.intercept({url:/https?:\/\//,middleware:true},req=>{
    if(!["127.0.0.1","localhost"].includes(new URL(req.url).hostname))req.reply({statusCode:503,body:{message:"Integración externa fuera de esta prueba"}});
  });
  cy.intercept("**/api/v1/**",req=>{
    const path=new URL(req.url).pathname.replace("/api/v1/","");
    if(req.method!=="GET")return req.reply({statusCode:503,body:{message:"Escritura no definida en este fixture"}});
    if(path==="auth/csrf")return req.reply({token:"fixture-csrf",headerName:"X-XSRF-TOKEN"});
    if(path==="courses")return req.reply(page([course]));
    if(path.startsWith("modules/course/"))return req.reply(page([{idModule:"m1",idCourse:"c001",title:"Módulo QA"}]));
    if(path.startsWith("lessons/module/"))return req.reply([{idLesson:"l1",idModule:"m1",title:"Lección QA"}]);
    if(path.startsWith("activities/lesson/"))return req.reply(page([activity]));
    if(path==="rankings/settings")return req.reply({studentVisibility:"CLASSROOM"});
    if(path==="rankings/global")return req.reply([ranking]);
    if(path.endsWith("/game-progress"))return req.reply({levels:["neonflow","tetrilogic"].flatMap(game=>Array.from({length:30},(_,index)=>({game,levelNumber:index+1,completed:false,bestStars:0,firstCompletedAt:null,lastCompletedAt:null}))),completedLevels:0,totalLevels:60,totalStars:0,currentStreak:0,bestStreak:0});
    if(path==="groups")return req.reply([{idGroup:"g1",groupName:"Grupo QA"}]);
    if(path.startsWith("group-students/")||path.startsWith("ranking/"))return req.reply([ranking]);
    if(path==="users")return req.reply([{idUser:"qa-student",firstName:"QA",lastName:"Student",email:"qa@test.invalid",idRoleList:["r-student"]}]);
    if(path==="roles")return req.reply([{idRole:"r-student",name:"STUDENT"}]);
    if(path.startsWith("users/"))return req.reply({idUser:"qa-student",firstName:"QA",lastName:"Student",email:"qa@test.invalid",idRoleList:["r-student"]});
    if(path.startsWith("dropout-risk/"))return req.reply({statusCode:404,body:{message:"Sin evaluación"}});
    if(path.startsWith("daily-challenges/"))return req.reply({statusCode:503,body:{message:"Diario fuera de este fixture de catálogo"}});
    if(path.startsWith("profile/"))return req.reply({idStudent:"qa-student",studentName:"QA",totalPoints:10,position:1,totalBlocksUsed:0,efficiencyAvg:null,level:1,totalStars:0,xpTotal:0,currentStreak:0,maxStreak:0,challengesCompleted:0});
    if(path.startsWith("performance/"))return req.reply({logicLevel:"LOW",rating:"Sin evaluación"});
    return req.reply([]);
  });
}
