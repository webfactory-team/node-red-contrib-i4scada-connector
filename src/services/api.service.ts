import * as request from "request-promise-native";
import { injectable, inject } from "inversify";
import { SessionDTO } from "./models/dto/session.dto";
import { KeyValuePair } from "./models/key-value-pair.model";
import { GetSignalDefinitionsFilterDTO } from "./models/dto/get-signal-definitions-filter.dto";
import { SignalDefinitionDTO } from "./models/dto/signal-definition.dto";
import { SignalValueDTO } from "./models/dto/signal-value.dto";
import { SignalUpdateDTO } from "./models/dto/signal-update.dto";
import { GetGroupNamesFilterDTO } from "./models/dto/get-group-names-filter.dto";
import { DescriptionDTO } from "./models/dto/description.dto";
import { GetSignalNamesFilterDTO } from "./models/dto/get-signal-names-filter.dto";
import { NameDTO } from "./models/dto/name.dto";
import { SecuritySessionDTO } from "./models/dto/security-session.dto";
import { UserDTO } from "./models/dto/user.dto";
import { AccountDTO } from "./models/dto/account.dto";
import { UserAuthorizationInfo } from "./models/dto/user-authorization-info.dto";
import {  i4Logger } from "../logger/logger";

@injectable()
export class ApiService {

    constructor(
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    private serverUrl = "https://demo.i4scada.de";

    public get serviceUrl() {
        return this.serverUrl + "/_SERVICES/WebServices/WCF"
    }

    public get signalServiceUrl() {
        return this.serviceUrl + "/SignalsService.svc/js";
    }

    public get securityServiceUrl() {
        return this.serviceUrl + "/SecurityService.svc/js";
    }

    public get ntlmServiceUrl() {
        return this.serviceUrl + "/NtlmService.svc/js";
    }

    public set url(serverUrl: string) {
        this.serverUrl = serverUrl || "https://demo.i4scada.de";
    }

    /**
     *  SignalServiceApi
     */

    public async connect(): Promise<SessionDTO> {
        this.logger.logger.debug(`connect`);
        const data = await request.post(`${this.signalServiceUrl}/Connect`, { json: true });
        return data.d;
    }

    public async disconnect(sessionId: string): Promise<void> {
        this.logger.logger.debug(`connect`);
        await request.post(`${this.signalServiceUrl}/Disconnect`, {
            json: true, body: {
                sessionId: sessionId
            }
        });
    }

    public async registerSignals(sessionId: string, clientId: string, signalNames: string[]): Promise<number[]> {
        this.logger.logger.debug(`registerSignals`);
        const data = await request.post(`${this.signalServiceUrl}/RegisterSignals`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                signalNames: signalNames
            }
        });
        return data.d;
    }

    public async unregisterSignals(sessionId: string, clientId: string, signalNames: string[]): Promise<number[]> {
        this.logger.logger.debug(`unregisterSignals`);
        const data = await request.post(`${this.signalServiceUrl}/UnregisterSignals`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                signalNames: signalNames
            }
        });
        return data.d;
    }

    public async getUpdates(sessionId: string, clientId: string, requestId: number): Promise<SignalUpdateDTO> {
        this.logger.logger.debug(`getUpdates`);
        const data = await request.post(`${this.signalServiceUrl}/GetUpdates`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                requestId: requestId
            }
        });
        return data.d;
    }

    public async readSignals(sessionId: string, clientId: string, signalNames: string[]): Promise<SignalValueDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/ReadSignals`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                signalNames: signalNames
            }
        });
        return data.d;
    }

    public async writeUnsecuredSignals(sessionId: string, clientId: string, values: KeyValuePair<string, any>[]): Promise<number[]> {
        const data = await request.post(`${this.signalServiceUrl}/WriteUnsecuredSignals`, {
            json: true, body: {
                clientId: clientId,
                sessionId: sessionId,
                values: values
            }
        });
        return data.d;
    }

    public async writeSecuredSignals(securityToken: string, sessionId: string, values: KeyValuePair<string, any>[]): Promise<number[]> {
        const data = await request.post(`${this.signalServiceUrl}/WriteSecuredSignalsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                sessionId: sessionId,
                values: values
            }
        });
        return data.d;
    }

    public async getSignalDefinitions(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, filter: GetSignalDefinitionsFilterDTO, languageId: number, start: number, count: number, timeOut: number): Promise<SignalDefinitionDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/GetSignalDefinitions`, {
            json: true,
            body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                filter: filter,
                languageId: languageId,
                startIndex: start,
                count: count,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getSignalDefinitionsByToken(securityToken: string, filter: GetSignalDefinitionsFilterDTO, languageId: number, start: number, count: number, timeOut: number): Promise<SignalDefinitionDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/GetSignalDefinitionsByToken`, {
            json: true,
            body: {
                securityToken: securityToken,
                filter: filter,
                languageId: languageId,
                startIndex: start,
                count: count,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getGroupNames(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, filter: GetGroupNamesFilterDTO, languageId: number, start: number, count: number, timeOut: number): Promise<DescriptionDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/GetGroupNames`, {
            json: true,
            body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                filter: filter,
                languageId: languageId,
                startIndex: start,
                count: count,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getGroupNamesByToken(securityToken: string, filter: GetGroupNamesFilterDTO, languageId: number, start: number, count: number, timeOut: number): Promise<DescriptionDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/GetGroupNamesByToken`, {
            json: true,
            body: {
                securityToken: securityToken,
                filter: filter,
                languageId: languageId,
                startIndex: start,
                count: count,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getSignalNames(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, filter: GetSignalNamesFilterDTO, start: number, count: number, timeOut: number): Promise<NameDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/GetSignalNames`, {
            json: true,
            body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                filter: filter,
                startIndex: start,
                count: count,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getSignalNamesByToken(securityToken: string, filter: GetSignalNamesFilterDTO, start: number, count: number, timeOut: number): Promise<NameDTO[]> {
        const data = await request.post(`${this.signalServiceUrl}/GetSignalNamesByToken`, {
            json: true,
            body: {
                securityToken: securityToken,
                filter: filter,
                startIndex: start,
                count: count,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    /**
     *  SecurityServiceApi
     */


    public async connectWithToken(securityToken: string, requestedLicenses: string[] = null): Promise<SecuritySessionDTO> {
        const data = await request.post(`${this.securityServiceUrl}/ConnectWithToken`, {
            json: true, body: {
                securityToken: securityToken,
                requestedLicenses: requestedLicenses
            }
        });
        return data.d;
    }

    public async login(sessionId: string, clientId: string, userName: string, password: string, isDomainUser: boolean, timeOut: number): Promise<string> {
        const data = await request.post(`${this.securityServiceUrl}/Login`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                password: password,
                isDomainUser: isDomainUser,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async isUserLoggedIn(securityToken: string, timeOut: number): Promise<boolean> {
        const data = await request.post(`${this.securityServiceUrl}/IsUserLoggedIn`, {
            json: true, body: {
                securityToken: securityToken,
                timeOut: timeOut
            }
        });
        return data.d;
    }

    public async logout(securityToken: string, timeOut: number): Promise<boolean> {
        const data = await request.post(`${this.securityServiceUrl}/LogoutByToken`, {
            json: true, body: {
                securityToken: securityToken,
                timeOut: timeOut
            }
        });
        return data.d;
    }

    public async getCurrentLoggedInUser(securityToken: string, timeOut: number): Promise<UserDTO> {
        const data = await request.post(`${this.securityServiceUrl}/GetCurrentLoggedInUser`, {
            json: true, body: {
                securityToken: securityToken,
                timeOut: timeOut
            }
        });
        return data.d;
    }

    public async getCurrentUserAuthorizations(securityToken: string, timeOut: number): Promise<UserAuthorizationInfo> {
        const data = await request.post(`${this.securityServiceUrl}/GetCurrentUserAuthorizations`, {
            json: true, body: {
                securityToken: securityToken,
                timeOut: timeOut
            }
        });
        return data.d;
    }

    /**
     *  NtlmServiceApi
     */

    public async loginWindowsUser(sessionId: string, clientId: string, timeOut: number): Promise<any> {
        const data = await request.post(`${this.ntlmServiceUrl}/LoginWindowsUser`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getCallerAccountDetails(): Promise<AccountDTO> {
        const data = await request.post(`${this.ntlmServiceUrl}/GetCallerAccountDetails`, {
            json: true, body: {
            }
        });
        return data.d;
    }

}