import { injectable, inject } from "inversify";
import { SecurityApi } from "./api/security-api";
import * as uuid from "uuid";
import { ITokenPersistentService } from "./token-persistent.service";
import { i4Logger } from "../logger/logger";

@injectable()
export class SessionService {

    public readonly millisecondsTimeOut = 10000;
    public currentLoggedInUser: string = null;
    public currentLoggedInUserIsDomainUser: boolean = false;

    public getSessionId() {
        return this.tokenPersistentService.getSessionId();
    }

    public setSessionId(id: string) {
        this.tokenPersistentService.setSessionId(id);
    }

    constructor(
        @inject(SecurityApi) private readonly securityApi: SecurityApi,
        @inject(i4Logger) private readonly logger: i4Logger,
        @inject("ITokenPersistentService") private readonly tokenPersistentService: ITokenPersistentService,
    ) {

    }

    private guid() {
        return uuid.v4();
    }

    public getClientId() {
        if (!this.tokenPersistentService.getClientId()) {
            this.tokenPersistentService.setClientId(this.guid());
        }
        return this.tokenPersistentService.getClientId();
    }

    public getSecurityToken() {
        return this.tokenPersistentService.getSecurityToken();
    }

    public setSecurityToken(token: string) {
        return this.tokenPersistentService.setSecurityToken(token);
    }

    public clearSecureSession() {
        this.logger.logger.info("UclearSecureSession - clearSecureSession");
        this.tokenPersistentService.clearSecureSession();
        this.currentLoggedInUser = null;
    }

    public async updateSessionInformation() {
        const login = await this.getCurrentLoggedInUser();
        if (!login) return false;

        const authorizations = await this.getCurrentUserAuthorizations();
        return !!authorizations;
    }

    public async getCurrentLoggedInUser() {
        const securityToken = this.getSecurityToken();
        if (!securityToken) {
            this.logger.logger.warn("User not logged in in the current session");
            return null;
        }

        const isLoggedIn = await this.securityApi.isUserLoggedIn(securityToken, this.millisecondsTimeOut);
        this.logger.logger.warn("isLoggedIn " + isLoggedIn);

        if (!isLoggedIn) {
            this.clearSecureSession();
            return null;
        }

        const user = await this.securityApi.getCurrentLoggedInUser(securityToken, this.millisecondsTimeOut);

        if (this.currentLoggedInUser !== user.Name) {
            this.currentLoggedInUser = user.Name;
        } else {

        }

        this.currentLoggedInUserIsDomainUser = user.IsADUser;
        
        return user.Name;
    }


    public async getCurrentUserAuthorizations() {
        const securityToken = this.getSecurityToken();

        if (!securityToken || !this.currentLoggedInUser) {
            this.logger.logger.info("There is no user currently logged in");
            return null;
        }

        const authorizations = await this.securityApi.getCurrentUserAuthorizations(securityToken, this.millisecondsTimeOut);

        if (!authorizations) {
            this.clearSecureSession();
            return null;
        }

        return authorizations;
    }



}