import * as request from "request-promise-native";
import { injectable, inject } from "inversify";
import { i4Logger } from "../../logger/logger";
import { SessionDTO } from "../models/dto/session.dto";
import { SignalUpdateDTO } from "../models/dto/signal-update.dto";
import { SignalValueDTO } from "../models/dto/signal-value.dto";
import { KeyValuePair } from "../models/key-value-pair.model";
import { GetSignalDefinitionsFilterDTO } from "../models/dto/get-signal-definitions-filter.dto";
import { GetGroupNamesFilterDTO } from "../models/dto/get-group-names-filter.dto";
import { SignalDefinitionDTO } from "../models/dto/signal-definition.dto";
import { DescriptionDTO } from "../models/dto/description.dto";
import { GetSignalNamesFilterDTO } from "../models/dto/get-signal-names-filter.dto";
import { NameDTO } from "../models/dto/name.dto";

/**
 *  SignalServiceApi
 */
@injectable()
export class SignalsApi {

    constructor(
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    private serverUrl = "http://localhost";
    private readonly timeout = 10000;

    private get serviceUrl() {
        return this.serverUrl + "/_SERVICES/WebServices/WCF"
    }

    private get signalServiceUrl() {
        return this.serviceUrl + "/SignalsService.svc/js";
    }

    public set url(serverUrl: string) {
        this.serverUrl = serverUrl || "http://localhost";
    }


    public async connect(): Promise<SessionDTO> {
        this.logger.logger.debug(`connect`);
        const data = await request.post(`${this.signalServiceUrl}/Connect`, {
            json: true,
            timeout: this.timeout
        });
        return data.d;
    }

    public async disconnect(sessionId: string): Promise<void> {
        this.logger.logger.debug(`disconnect`);
        await request.post(`${this.signalServiceUrl}/Disconnect`, {
            json: true,
            body: {
                sessionId: sessionId
            },
            timeout: this.timeout
        });
    }

    public async registerSignals(sessionId: string, clientId: string, signalNames: string[]): Promise<number[]> {
        this.logger.logger.debug(`registerSignals`);
        const data = await request.post(`${this.signalServiceUrl}/RegisterSignals`, {
            json: true,
            body: {
                sessionId: sessionId,
                clientId: clientId,
                signalNames: signalNames
            },
            timeout: this.timeout
        });
        return data.d;
    }

    public async unregisterSignals(sessionId: string, clientId: string, signalNames: string[]): Promise<number[]> {
        this.logger.logger.debug(`unregisterSignals`);
        const data = await request.post(`${this.signalServiceUrl}/UnregisterSignals`, {
            json: true,
            body: {
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
            json: true,
            body: {
                sessionId: sessionId,
                clientId: clientId,
                requestId: requestId
            },
            timeout: this.timeout
        });
        this.logger.logger.info(JSON.stringify(data));
        return data.d;
    }

    public async readSignals(sessionId: string, clientId: string, signalNames: string[]): Promise<SignalValueDTO[]> {
        this.logger.logger.debug(`readSignals`);
        const data = await request.post(`${this.signalServiceUrl}/ReadSignals`, {
            json: true,
            body: {
                sessionId: sessionId,
                clientId: clientId,
                signalNames: signalNames
            },
            timeout: this.timeout
        });
        return data.d;
    }

    public async writeUnsecuredSignals(sessionId: string, clientId: string, values: KeyValuePair<string, any>[]): Promise<number[]> {
        this.logger.logger.debug(`writeUnsecuredSignals`);
        const data = await request.post(`${this.signalServiceUrl}/WriteUnsecuredSignals`, {
            json: true, body: {
                clientId: clientId,
                sessionId: sessionId,
                values: values
            },
            timeout: this.timeout
        });
        return data.d;
    }

    public async writeSecuredSignals(securityToken: string, clientId: string, values: KeyValuePair<string, any>[]): Promise<number[]> {
        this.logger.logger.debug(`writeSecuredSignals`);
        const data = await request.post(`${this.signalServiceUrl}/WriteSecuredSignalsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                clientId: clientId,
                values: values
            },
            timeout: this.timeout
        });
        return data.d;
    }

    public async getSignalDefinitions(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, filter: GetSignalDefinitionsFilterDTO, languageId: number, start: number, count: number, timeOut: number): Promise<SignalDefinitionDTO[]> {
        this.logger.logger.debug(`getSignalDefinitions`);
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
        this.logger.logger.debug(`getSignalDefinitionsByToken`);
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
        this.logger.logger.debug(`getGroupNames`);
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
        this.logger.logger.debug(`getGroupNamesByToken`);
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
        this.logger.logger.debug(`getSignalNames`);
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
        this.logger.logger.debug(`getSignalNamesByToken`);
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

}