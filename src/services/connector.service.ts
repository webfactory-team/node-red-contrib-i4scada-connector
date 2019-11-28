import { injectable, inject } from "inversify";
import { SessionDTO } from "./models/dto/session.dto";
import { SecurityApi } from "./api/security-api";
import { NtlmApi } from "./api/ntlm-api";
import { SignalsApi } from "./api/signals-api";
import { SessionService } from "./session.service";
import { AlarmsApi } from "./api/alarms-api";
import { SecuritySessionDTO } from "./models/dto/security-session.dto";
import { i4Logger } from "../logger/logger";

@injectable()
export class ConnectorService {

    private session: SessionDTO;
    private sessionPromise: Promise<SessionDTO> = null;

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
            this.logger.logger.info("disconnect deleting session.")
            await this.signalsApi.disconnect(this.sessionService.getSessionId());
        } catch (error) {
            this.logger.logger.error(error);
        }
        finally {
            this.sessionService.clearSecureSession();
            this.session = null;
            this.sessionPromise = null;
        }
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
        this.setUrl(serverUrl);
        if (this.sessionPromise !== null)
            return this.sessionPromise;
        this.sessionPromise = this.connectBase();
        return this.sessionPromise;
    }


    private async connectBase() {
        try {
            if (!this.session) {
                const securityToken = this.sessionService.getSecurityToken();
                if (securityToken) {
                    this.logger.logger.info("Updating session");
                    const session = await this.securityApi.connectWithToken(securityToken, []);
                    this.session = await this.updateSession(session);
                    this.logger.logger.info("Session updated");
                } else {
                    this.logger.logger.info("Creating session");
                    let session = await this.signalsApi.connect();
                    session = this.validateLicense(session);
                    session = this.initializeSession(session);
                    this.session = session;
                    this.logger.logger.info("Session created");
                }
            }
        } catch (error) {
            this.logger.logger.error(error);
        }
        finally {
            this.sessionPromise = null;
        }
        return this.session;
    }


    private async updateSession(sessionData: SecuritySessionDTO) {
        this.validateLicense(sessionData.Session);
        this.initializeSession(sessionData.Session);
        this.sessionService.setSecurityToken(sessionData.SecurityToken);
        await this.sessionService.updateSessionInformation();
        this.logger.logger.info(`Session updated, sessionId: '${this.sessionService.getSessionId()}'`);
        return sessionData.Session;
    }


    private initializeSession(session: SessionDTO) {
        this.sessionService.setSessionId(session.SessionId);
        return session;
    }

    private validateLicense(session: SessionDTO) {

        if (!session.IsValidLicense) {
            throw "Invalid license";
        }
        return session;
    }

}