import { ITokenPersistentService } from "./token-persistent.service";
import { FlowConnectionInfo } from "./models/flow-connection-info.model";


export class TestTokenFlowsPersistentService implements ITokenPersistentService {

    private securityToken: string;
    private clientId: string;
    private sessionId: string;
    private currentLoggedInUser: string;
    private flowConnectionInfo: FlowConnectionInfo;

    constructor() {

    }

    public clearSecureSession(): void {
        this.securityToken = null;
        this.clientId = null;
        this.sessionId = null;
        this.currentLoggedInUser = null;
    }

    public getSecurityToken(): string {
        const token = this.securityToken || null;
        return token;
    }

    public getClientId(): string {
        const clientId = this.clientId || null;
        return clientId;
    }

    public getSessionId(): string {
        const sessionId = this.sessionId || null;
        return sessionId;
    }
    public getCurrentLoggedInUser(): string {
        const user = this.currentLoggedInUser || null;
        return user;
    }

    public getFlowConnectionInfo(): FlowConnectionInfo {
        const flowConnectionInfo = this.flowConnectionInfo || null;
        return flowConnectionInfo;
    }

    public setSecurityToken(token: string): void {
        this.securityToken = token;
    }

    public setClientId(id: string): void {
        this.clientId = id;
    }

    public setSessionId(id: string): void {
        this.sessionId = id;
    }

    public setCurrentLoggedInUser(user: string): void {
        this.currentLoggedInUser = user;
    }

    public setFlowConnectionInfo(info: FlowConnectionInfo): void {
        this.flowConnectionInfo = info;
    }

    public dispose() {
        this.clearSecureSession();
    }

}