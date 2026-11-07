import "./commands";

let diagnostics:Array<{kind:string;message:string;url:string}>=[];
beforeEach(()=>{diagnostics=[];});
Cypress.on("window:before:load",win=>{
  for(const kind of ["error","warn"] as const) {
    const original=win.console[kind].bind(win.console);
    win.console[kind]=(...args:unknown[])=>{diagnostics.push({kind,message:args.map(String).join(" ").slice(0,2000),url:win.location.href});original(...args);};
  }
});
afterEach(()=>{cy.task("browserDiagnostics",{spec:Cypress.spec.name,test:Cypress.currentTest.title,entries:diagnostics},{log:false});});
