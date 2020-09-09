import * as request from "request-promise-native";
import { injectable, inject } from "inversify";
import { i4Logger } from "../../logger/logger";
import { SecuritySessionDTO } from "../models/dto/security-session.dto";
import { UserDTO } from "../models/dto/user.dto";
import { UserAuthorizationInfo } from "../models/dto/user-authorization-info.dto";

/**
 *  SecurityServiceApi
 */
@injectable()
export class SecurityApi {

    constructor(
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    private serverUrl = "http://localhost";

    private get serviceUrl() {
        return this.serverUrl + "/_SERVICES/WebServices/WCF"
    }

    private get securityServiceUrl() {
        return this.serviceUrl + "/SecurityService.svc/js";
    }

    public set url(serverUrl: string) {
        this.serverUrl = serverUrl || "http://localhost";
    }

    public async connectWithToken(securityToken: string, requestedLicenses: string[] = null): Promise<SecuritySessionDTO> {
        this.logger.logger.debug(`connectWithToken`);
        const data = await request.post(`${this.securityServiceUrl}/ConnectWithToken`, {
            json: true, body: {
                securityToken: securityToken,
                requestedLicenses: requestedLicenses
            }
        });
        return data.d;
    }

    public async login(sessionId: string, clientId: string, userName: string, password: string, isDomainUser: boolean, millisecondsTimeOut: number): Promise<string> {
        this.logger.logger.debug(`login`);
        const data = await request.post(`${this.securityServiceUrl}/Login`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                password: password,
                isDomainUser: isDomainUser,
                millisecondsTimeOut: millisecondsTimeOut
            }
        });
        return data.d;
    }

    public async isUserLoggedIn(securityToken: string, millisecondsTimeOut: number): Promise<boolean> {
        this.logger.logger.debug(`isUserLoggedIn`);
        const data = await request.post(`${this.securityServiceUrl}/IsUserLoggedIn`, {
            json: true, body: {
                securityToken: securityToken,
                millisecondsTimeOut: millisecondsTimeOut
            }
        });
        return data.d;
    }

    public async logout(securityToken: string, millisecondsTimeOut: number): Promise<boolean> {
        this.logger.logger.debug(`logout`);
        const data = await request.post(`${this.securityServiceUrl}/LogoutByToken`, {
            json: true, body: {
                securityToken: securityToken,
                millisecondsTimeOut: millisecondsTimeOut
            }
        });
        return data.d;
    }

    public async getCurrentLoggedInUser(securityToken: string, millisecondsTimeOut: number): Promise<UserDTO> {
        this.logger.logger.debug(`getCurrentLoggedInUser`);
        const data = await request.post(`${this.securityServiceUrl}/GetCurrentLoggedInUser`, {
            json: true, body: {
                securityToken: securityToken,
                millisecondsTimeOut: millisecondsTimeOut
            }
        });
        return data.d;
    }

    public async getCurrentUserAuthorizations(securityToken: string, millisecondsTimeOut: number): Promise<UserAuthorizationInfo> {
        this.logger.logger.debug(`getCurrentUserAuthorizations`);
        const data = await request.post(`${this.securityServiceUrl}/GetCurrentUserAuthorizations`, {
            json: true, body: {
                securityToken: securityToken,
                millisecondsTimeOut: millisecondsTimeOut
            }
        });
        return data.d;
    }

}