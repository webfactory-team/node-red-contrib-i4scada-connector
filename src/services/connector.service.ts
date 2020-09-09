import { injectable, inject } from "inversify";
import { SessionDTO } from "./models/dto/session.dto";
import { SecurityApi } from "./api/security-api";
import { NtlmApi } from "./api/ntlm-api";
import { SignalsApi } from "./api/signals-api";
import { SessionService } from "./session.service";
import { AlarmsApi } from "./api/alarms-api";
import { SecuritySessionDTO } from "./models/dto/security-session.dto";
import { i4Logger } from "../logger/logger";
import { Subject } from "rxjs";

export enum ConnectorStatus {
    Connecting,
    Connected,
    Disconeting,
    Disconnected,
    Canceled,
    ConnectionError
}

@injectable()
export class ConnectorService {

    private sessionPromise: Promise<SessionDTO> = null;
    public readonly connectorStatusQueue = new Subject<ConnectorStatus>();

    constructor(
        @inject(SecurityApi) private readonly securityApi: SecurityApi,
        @inject(SignalsApi) private readonly signalsApi: SignalsApi,
        @inject(NtlmApi) private readonly ntlmApi: NtlmApi,
        @inject(AlarmsApi) private readonly alarmsApi: AlarmsApi,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {

    }

    public async disconnect() {
        try {
            this.logger.logger.info("disconnecting")
            this.connectorStatusQueue.next(ConnectorStatus.Disconeting);
            await this.signalsApi.disconnect(this.sessionService.getSessionId());
            this.connectorStatusQueue.next(ConnectorStatus.Disconnected);
        } catch (error) {
            this.logger.logger.error(error);
            this.connectorStatusQueue.next(ConnectorStatus.ConnectionError);
        }
        finally {
            this.sessionService.clearSecureSession();
            this.sessionPromise = null;
        }
    }

    public dispose() {
        this.connectorStatusQueue.unsubscribe();
    }

    public setUrl(serverUrl: string = null) {
        if (serverUrl) {
            this.signalsApi.url = serverUrl;
            this.securityApi.url = serverUrl;
            this.ntlmApi.url = serverUrl;
            this.alarmsApi.url = serverUrl;
        }
    }

    public async connect(serverUrl: string = null) {
        this.logger.logger.debug("Connect");
        this.setUrl(serverUrl);
        if (this.sessionPromise !== null) {
            this.logger.logger.debug("Connect are currently running");
            return this.sessionPromise;
        }
        this.connectorStatusQueue.next(ConnectorStatus.Connecting);
        this.sessionPromise = this.connectBase();
        this.connectorStatusQueue.next(ConnectorStatus.Connected);
        return this.sessionPromise;
    }


    private async connectBase() {
        this.logger.logger.debug("connectBase");
        const sessionId = this.sessionService.getSessionId();
        try {
            if (!sessionId) {
                const securityToken = this.sessionService.getSecurityToken();
                if (securityToken) {
                    this.logger.logger.info("Updating session");
                    const session = await this.securityApi.connectWithToken(securityToken, []);
                    await this.updateSession(session);
                } else {
                    this.logger.logger.info("Creating session");
                    let session = await this.signalsApi.connect();
                    this.createSession(session);
                }
            } else {
                this.logger.logger.debug("Session already exsist");
            }
        } catch (error) {
            this.logger.logger.error(error);
        }
        finally {
            this.sessionPromise = null;
        }
        return {
            IsValidLicense: true,
            SessionId: this.sessionService.getSessionId()
        } as SessionDTO;
    }

    private async updateSession(sessionData: SecuritySessionDTO) {
        this.sessionService.setSessionId(sessionData.Session.SessionId);
        this.sessionService.setSecurityToken(sessionData.SecurityToken);
        await this.sessionService.updateSessionInformation();
        this.logger.logger.info(`Session updated, sessionId: '${sessionData.Session.SessionId}'`);
    }

    private async createSession(session: SessionDTO) {
        this.sessionService.setSessionId(session.SessionId);
        this.logger.logger.info("Session created");
    }
}