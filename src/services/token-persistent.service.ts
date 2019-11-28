export interface ITokenPersistentService {
    clearSecureSession(): void;

    getSecurityToken(): string;
    getClientId(): string;
    getSessionId(): string;
    setSecurityToken(token: string): void;
    setClientId(id: string): void;
    setSessionId(id: string): void;
}

export class TokenFlowPersistentService implements ITokenPersistentService {

    constructor(private context: any) {
        this.context = context;
    }

    public clearSecureSession(): void {
        this.context.set("securityToken", null);
        this.context.set("clientId", null);
        this.context.set("sessionId", null);
    }

    public getSecurityToken(): string {
        const token = this.context.get("securityToken") || null;
        return token;
    }

    public getClientId(): string {
        const clientId = this.context.get("clientId") || null;
        return clientId;
    }

    public getSessionId(): string {
        const sessionId = this.context.get("sessionId") || null;
        return sessionId;
    }

    public setSecurityToken(token: string): void {
        this.context.set("securityToken", token);
    }

    public setClientId(id: string): void {
        this.context.set("clientId", id);
    }

    public setSessionId(id: string): void {
        this.context.set("sessionId", id);
    }

    public dispose() {
        this.context = null;
    }

}