export {};
declare global {
  namespace Cypress {
    interface Chainable {
      login(email:string,password:string):Chainable<void>;
      csrfRequest(options:Partial<RequestOptions>):Chainable<Response<unknown>>;
      register(data:{firstName:string;lastName:string;email:string;password:string;age:number;grade:string}):Chainable<void>;
    }
  }
}
