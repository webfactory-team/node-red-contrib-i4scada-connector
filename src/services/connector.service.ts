import { injectable, inject } from "inversify";
import { SessionDTO } from "./models/dto/session.dto";
import { ApiService } from "./api.service";
import { SessionService } from "./session.service";
import { SecuritySessionDTO } from "./models/dto/security-session.dto";
import { i4Logger } from "../logger/logger";

@injectable()
export class ConnectorService {

    private session: SessionDTO;
    private sessionPromise: Promise<SessionDTO>;

    constructor(
        @inject(ApiService) private readonly apiService: ApiService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {

    }

    public async disconnect() {
        await this.apiService.disconnect(this.sessionService.sessionId);
        this.sessionService.clearSecureSession();
        this.session = null;
        this.sessionPromise = null;
    }

    public setUrl(serverUrl: string = null) {
        if (serverUrl) {
            this.apiService.url = serverUrl;
        }
    }

    public connect(serverUrl: string = null) {
        this.setUrl(serverUrl);
        if (this.sessionPromise)
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
                    const session = await this.apiService.connectWithToken(securityToken, []);
                    this.session = this.updateSession(session);
                } else {
                    this.logger.logger.info("Creating session");
                    let session = await this.apiService.connect();
                    session = this.validateLicense(session);
                    session = this.initializeSession(session);
                    this.session = session;
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


    private updateSession(sessionData: SecuritySessionDTO) {
        this.validateLicense(sessionData.Session);
        this.initializeSession(sessionData.Session);
        this.sessionService.setSecurityToken(sessionData.SecurityToken);
        this.sessionService.updateSessionInformation();
        this.logger.logger.info(`Session updated, sessionId: '${this.sessionService.sessionId}'`);
        return sessionData.Session;
    }


    private initializeSession(session: SessionDTO) {
        this.sessionService.sessionId = session.SessionId;
        return session;
    }

    private validateLicense(session: SessionDTO) {

        if (!session.IsValidLicense) {
            throw "Invalid license";
        }
        return session;
    }

}