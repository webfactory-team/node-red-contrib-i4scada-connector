import { FlowConnectionInfo } from "./models/flow-connection-info.model";

export interface ITokenPersistentService {
    clearSecureSession(): void;

    getSecurityToken(): string;
    getSessionId(): string;
    getCurrentLoggedInUser(): string;
    getFlowConnectionInfo(): FlowConnectionInfo;

    setSecurityToken(token: string): void;
    setSessionId(id: string): void;
    setCurrentLoggedInUser(user: string): void;
    setFlowConnectionInfo(info: FlowConnectionInfo): void
}

export class TokenFlowPersistentService implements ITokenPersistentService {

    constructor(private context: any) {
        this.context = context;
    }

    public clearSecureSession(): void {
        if(!this.context) return;
        this.context.set("securityToken", null);
        this.context.set("sessionId", null);
        this.context.set("currentLoggedInUser", null);
    }

    public getSecurityToken(): string {
        if(!this.context) return null;
        const token = this.context.get("securityToken") || null;
        return token;
    }

    public getSessionId(): string {
        if(!this.context) return null;
        const sessionId = this.context.get("sessionId") || null;
        return sessionId;
    }

    public getCurrentLoggedInUser(): string {
        if(!this.context) return null;
        const user = this.context.get("currentLoggedInUser") || null;
        return user;
    }

    public getFlowConnectionInfo(): FlowConnectionInfo {
        if(!this.context) return new FlowConnectionInfo();
        const info = this.context.get("flowConnectionInfo") || new FlowConnectionInfo();
        return info;
    }

    public setSecurityToken(token: string): void {
        if(!this.context) return;
        this.context.set("securityToken", token);
    }

    public setSessionId(id: string): void {
        if(!this.context) return;
        this.context.set("sessionId", id);
    }

    public setCurrentLoggedInUser(user: string): void {
        if(!this.context) return;
        this.context.set("currentLoggedInUser", user);
    }

    public setFlowConnectionInfo(info: FlowConnectionInfo): void {
        if(!this.context) return;
        this.context.set("flowConnectionInfo", info);
    }

    public dispose() {
        this.context = null;
    }
}