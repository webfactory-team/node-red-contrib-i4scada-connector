import { injectable, inject } from "inversify";
import { SecurityApi } from "./api/security-api";
import { ITokenPersistentService } from "./token-persistent.service";
import { i4Logger } from "../logger/logger";

@injectable()
export class SessionService {

    public readonly millisecondsTimeOut = 10000;

    public getSessionId() {
        this.logger.logger.debug("Session requested");
        return this.tokenPersistentService.getSessionId();
    }

    public setSessionId(id: string) {
        this.tokenPersistentService.setSessionId(id);
    }

    public get currentLoggedInUser(): string {
        return this.tokenPersistentService.getCurrentLoggedInUser();
    }
    public get currentLoggedInUserIsDomainUser(): boolean {
        return false;
    }

    constructor(
        @inject(SecurityApi) private readonly securityApi: SecurityApi,
        @inject(i4Logger) private readonly logger: i4Logger,
        @inject("ITokenPersistentService") private readonly tokenPersistentService: ITokenPersistentService,
    ) {

    }

    public getClientId() {
        this.logger.logger.debug("ClientId requested");
        return "ac4a567e-adc8-404e-d666-17ea9f074962";
    }

    public getSecurityToken() {
        this.logger.logger.debug("SecurityToken requested");
        return this.tokenPersistentService.getSecurityToken();
    }

    public setSecurityToken(token: string) {
        return this.tokenPersistentService.setSecurityToken(token);
    }

    public clearSecureSession() {
        this.logger.logger.debug("Clearing secured session");
        this.tokenPersistentService.clearSecureSession();
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
        let isLoggedIn = false;
        try {
            isLoggedIn = await this.securityApi.isUserLoggedIn(securityToken, this.millisecondsTimeOut);
        } catch (error) {
            this.logger.logger.error(error);
        }

        this.logger.logger.warn("isLoggedIn " + isLoggedIn);

        if (!isLoggedIn) {
            this.tokenPersistentService.setCurrentLoggedInUser(null);
            return null;
        }

        const user = await this.securityApi.getCurrentLoggedInUser(securityToken, this.millisecondsTimeOut);
        this.tokenPersistentService.setCurrentLoggedInUser(user.Name);
        return user.Name;
    }


    public async getCurrentUserAuthorizations() {
        const securityToken = this.getSecurityToken();

        if (!securityToken || !this.tokenPersistentService.getCurrentLoggedInUser()) {
            this.logger.logger.info("There is no user currently logged in");
            return null;
        }

        const authorizations = await this.securityApi.getCurrentUserAuthorizations(securityToken, this.millisecondsTimeOut);

        if (!authorizations) {
            this.tokenPersistentService.setCurrentLoggedInUser(null);
            return null;
        }

        return authorizations;
    }

}