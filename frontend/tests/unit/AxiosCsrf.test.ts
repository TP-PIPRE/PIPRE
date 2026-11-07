import {beforeEach,describe,it,expect,vi} from "vitest";
import type {InternalAxiosRequestConfig} from "axios";
import {AxiosError} from "axios";
import axiosInstance,{aiAxiosInstance} from "../../src/infrastructure/api/axiosInstance";
const calls:InternalAxiosRequestConfig[]=[];
beforeEach(()=>{
  calls.length=0;
  axiosInstance.defaults.adapter=async config=>{
    calls.push(config);
    return {data:config.url==="auth/csrf"?{token:"masked-token",headerName:"X-XSRF-TOKEN"}:{ok:true},status:200,statusText:"OK",headers:{},config};
  };
});
describe("Cookie-authenticated writes",()=>{
  it("renews and retries the same mutation once after an explicit pre-execution CSRF rejection",async()=>{
    let tokens=0,writes=0;const payloads:unknown[]=[];
    axiosInstance.defaults.adapter=async config=>{
      if(config.url==="auth/csrf")return {data:{token:`token-${++tokens}`,headerName:"X-XSRF-TOKEN"},status:200,statusText:"OK",headers:{},config};
      payloads.push(config.data);
      if(++writes===1)throw new AxiosError("Forbidden","ERR_BAD_REQUEST",config,undefined,{data:{code:"CSRF_INVALID"},status:403,statusText:"Forbidden",headers:{},config});
      expect(config.headers.get("X-XSRF-TOKEN")).toBe("token-2");return {data:{ok:true},status:200,statusText:"OK",headers:{},config};
    };
    await axiosInstance.post("example",{attempt:"same-id"});expect(tokens).toBe(2);expect(writes).toBe(2);expect(payloads[0]).toEqual(payloads[1]);
  });
  it("does not retry ordinary permission denials",async()=>{
    let writes=0;
    axiosInstance.defaults.adapter=async config=>{
      if(config.url==="auth/csrf")return {data:{token:"token",headerName:"X-XSRF-TOKEN"},status:200,statusText:"OK",headers:{},config};
      writes++;throw new AxiosError("Forbidden","ERR_BAD_REQUEST",config,undefined,{data:{message:"Acceso denegado"},status:403,statusText:"Forbidden",headers:{},config});
    };
    await expect(axiosInstance.post("example",{})).rejects.toThrow();expect(writes).toBe(1);
  });
  it("stops after one unsuccessful token renewal",async()=>{
    let writes=0;
    axiosInstance.defaults.adapter=async config=>{
      if(config.url==="auth/csrf")return {data:{token:"token",headerName:"X-XSRF-TOKEN"},status:200,statusText:"OK",headers:{},config};
      writes++;throw new AxiosError("Forbidden","ERR_BAD_REQUEST",config,undefined,{data:{code:"CSRF_INVALID"},status:403,statusText:"Forbidden",headers:{},config});
    };
    await expect(axiosInstance.delete("example")).rejects.toThrow();expect(writes).toBe(2);
  });
  it("obtains one masked token for concurrent writes and sends it in the expected header",async()=>{
    await Promise.all([axiosInstance.post("example",{}),axiosInstance.put("example",{})]);
    expect(calls.filter(call=>call.url==="auth/csrf")).toHaveLength(1);
    expect(calls.filter(call=>call.url==="example").every(call=>call.headers.get("X-XSRF-TOKEN")==="masked-token")).toBe(true);
  });
  it("does not fetch a token for safe reads and refreshes it for the next write batch",async()=>{
    await axiosInstance.get("example");expect(calls).toHaveLength(1);
    await axiosInstance.delete("example");await axiosInstance.post("auth/logout");
    expect(calls.filter(call=>call.url==="auth/csrf")).toHaveLength(2);
  });
  it("never sends the mutation if the token endpoint fails",async()=>{
    axiosInstance.defaults.adapter=vi.fn().mockRejectedValue(new Error("Token unavailable"));
    await expect(axiosInstance.post("example",{})).rejects.toThrow("Token unavailable");
    expect(axiosInstance.defaults.adapter).toHaveBeenCalledTimes(1);
  });
  it("keeps API CSRF cookies and headers out of the independent external client",async()=>{
    const adapter=vi.fn(async(config:InternalAxiosRequestConfig)=>({data:{},status:200,statusText:"OK",headers:{},config}));
    aiAxiosInstance.defaults.adapter=adapter;await aiAxiosInstance.post("fixture",{});
    expect(adapter).toHaveBeenCalledTimes(1);expect(adapter.mock.calls[0][0].headers.has("X-XSRF-TOKEN")).toBe(false);expect(calls).toHaveLength(0);
  });
});
