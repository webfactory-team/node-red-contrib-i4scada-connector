import { injectable, inject } from "inversify";
import { SecurityApi } from "./api/security-api";
import { NtlmApi } from "./api/ntlm-api";
import { SessionService } from "./session.service";
import { FunctionResultDTO } from "./models/dto/function-result.dto";
import _ from "underscore";
import { SignalsService } from "./signals.service";
import { ConnectorService } from "./connector.service";
import { i4Logger } from "../logger/logger";

@injectable()
export class SecurityService {

    public readonly timeOut = 10000;

    constructor(
        @inject(SecurityApi) private readonly securityApi: SecurityApi,
        @inject(NtlmApi) private readonly ntlmApi: NtlmApi,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(SignalsService) private readonly signalsService: SignalsService,
        @inject(ConnectorService) private readonly connectorService: ConnectorService,
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    public async login(userName: string, password: string, isDomainUser: boolean) {
        try {
            this.sessionService.clearSecureSession();
            await this.connectorService.connect();
            this.logger.logger.info(`Logging in client ID: ${this.sessionService.getClientId()}`);
            await this.performLogin(userName, password, isDomainUser);
            await this.sessionService.getCurrentUserAuthorizations();
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    public async loginWindowsUser() {
        try {
            this.sessionService.clearSecureSession();
            await this.connectorService.connect();
            const token = await this.ntlmApi.loginWindowsUser(this.sessionService.sessionId, this.sessionService.getClientId(), this.timeOut);
            return await this.executeAfterLogin(token);
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    public async logout() {
        try {
            if (this.sessionService.getSecurityToken()) {
                this.logger.logger.info("logout");
                try {
                    const status = await this.securityApi.logout(this.sessionService.getSecurityToken(), this.timeOut);
                    if (status) {
                        this.logger.logger.info("Logout successful")
                        this.sessionService.clearSecureSession();
                        return true;
                    }
                    this.logger.logger.info("Logout failed");
                    return false;
                } catch (error) {
                    this.logger.logger.error(error);
                    return false;
                }
            }
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    private async performLogin(userName: string, password: string, isDomainUser: boolean) {
        try {
            const token = await this.securityApi.login(this.sessionService.sessionId, this.sessionService.getClientId(), userName, password, isDomainUser, this.timeOut);
            await this.executeAfterLogin(token);
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    private async executeAfterLogin(resultobject: string | FunctionResultDTO<string>) {
        var token: string = resultobject as string;
        var functionResult = resultobject as FunctionResultDTO<string>;
        if (resultobject && typeof (resultobject) !== "string") {
            if (!functionResult.Succeeded) {
                const errorCode = _.first(functionResult.ErrorCodes);
                this.logLoginError(errorCode ? errorCode.toString() : "-1");
                return false;
            } else {
                token = functionResult.Result;
            }
        } else if (!this.isSecurityToken(token)) {
            const errorCode = _.first(JSON.parse(token)) as string;
            this.logLoginError(errorCode);
            return false;
        }

        this.sessionService.setSecurityToken(token);
        const result = await this.sessionService.updateSessionInformation();

        if (result) {
            const user = this.sessionService.currentLoggedInUser;
            this.logger.logger.info("Login successful");
            if (user !== "*") {

            }
            this.startSignalUpdate();
        }

        return result;
    }

    private isSecurityToken(token: string) {
        if (!token) return false;
        if (token.includes("[") && token.includes("]")) return false;
        return _.isString(token);
    }

    private logLoginError(errorCode: string) {
        this.logger.logger.error(`Login failed with code: ${errorCode}`);
    }

    private startSignalUpdate() {
        var projectName = "\\DefaultProject";
        const sessionSignal = this.signalsService.getSignal(`WFSInternal_Session_${this.sessionService.getClientId()}${projectName}`);
        this.signalsService.getOnlineUpdates();

        var subscription = sessionSignal.subscribe((newValue) => {
            if (!newValue.value) {
                this.sessionService.clearSecureSession();
                subscription.unsubscribe();
            }
        });
    }

}