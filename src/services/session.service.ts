import { injectable, inject } from "inversify";
import { ApiService } from "./api.service";
import * as uuid from "uuid";
import { ITokenPersistentService } from "./token-persistent.service";
import { i4Logger } from "../logger/logger";

@injectable()
export class SessionService {

    public readonly timeOut = 10000;
    public currentLoggedInUser: string = null;
    public currentLoggedInUserIsDomainUser: boolean = false;

    public get sessionId() {
        return this.tokenPersistentService.getSessionId();
    }

    public set sessionId(id: string) {
        this.tokenPersistentService.setSessionId(id);
    }

    constructor(
        @inject(ApiService) private readonly apiService: ApiService,
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

        const isLoggedIn = await this.apiService.isUserLoggedIn(securityToken, this.timeOut);

        if (!isLoggedIn) {
            this.clearSecureSession();
            return null;
        }

        const user = await this.apiService.getCurrentLoggedInUser(securityToken, this.timeOut);

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

        const authorizations = await this.apiService.getCurrentUserAuthorizations(securityToken, this.timeOut);

        if (!authorizations) {
            this.clearSecureSession();
            return null;
        }

        return authorizations;
    }



}