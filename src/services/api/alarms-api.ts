import * as request from "request-promise-native";
import { injectable, inject } from "inversify";
import { i4Logger } from "../../logger/logger";
import { AlarmsDTO } from "../models/dto/alarms.dto";
import { AlarmFilterDTO } from "../models/dto/alarm-filter.dto";
import { AcknowledgeResultDTO } from "../models/dto/acknowledge-result.dto";
import { AlarmDefinitionFilterDTO } from "../models/dto/alarm-definition-filter.dto";
import { AlarmDefinitionsDTO } from "../models/dto/alarm-definitions.dto";
import { AlarmGroupDTO } from "../models/dto/alarm-group.dto";
import { AlarmTypeDTO } from "../models/alarm-type.dto";

/**
 *  AlarmsServiceApi
 */
@injectable()
export class AlarmsApi {

    constructor(
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    private serverUrl = "http://localhost";

    private get serviceUrl() {
        return this.serverUrl + "/_SERVICES/WebServices/WCF"
    }

    private get alarmsServiceUrl() {
        return this.serviceUrl + "/AlarmsService.svc/js";
    }

    public set url(serverUrl: string) {
        this.serverUrl = serverUrl || "http://localhost";
    }

    public async getOnlineAlarms(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, filter: AlarmFilterDTO, timeOut: number): Promise<AlarmsDTO> {
        this.logger.logger.debug(`getOnlineAlarms`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetOnlineAlarms`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                filter: filter,
                timeOut: timeOut
            }
        });
        return data.d;
    }

    public async getOnlineAlarmsByToken(securityToken: string, filter: AlarmFilterDTO, timeOut: number): Promise<AlarmsDTO> {
        this.logger.logger.debug(`getOnlineAlarmsByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetOnlineAlarmsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                filter: filter,
                timeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAlarms(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, alarmIds: string[], comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`acknowledgeAlarms`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAlarms`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                alarmIds: alarmIds,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAlarmsByToken(securityToken: string, alarmIds: string[], comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`AcknowledgeAlarmsByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAlarmsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                alarmIds: alarmIds,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAllAlarms(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`acknowledgeAllAlarms`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAllAlarms`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAllAlarmsByToken(securityToken: string, comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`acknowledgeAllAlarmsByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAllAlarmsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAllGoneAlarms(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`AcknowledgeAlarmsByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAllGoneAlarms`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAllGoneAlarmsByToken(securityToken: string, comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`acknowledgeAllGoneAlarmsByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAllGoneAlarmsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }
    public async acknowledgeAlarmsByGroup(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, groupName: string, comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`acknowledgeAlarmsByGroup`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAlarmsByGroup`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                groupName: groupName,
                comment: comment,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async acknowledgeAlarmsByGroupByToken(securityToken: string, groupName: string, comment: string, timeOut: number): Promise<AcknowledgeResultDTO> {
        this.logger.logger.debug(`acknowledgeAlarmsByGroupByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/AcknowledgeAlarmsByGroupByToken`, {
            json: true, body: {
                securityToken: securityToken,
                comment: comment,
                groupName: groupName,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getAlarmDefinitions(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, filter: AlarmDefinitionFilterDTO, timeOut: number): Promise<AlarmDefinitionsDTO> {
        this.logger.logger.debug(`getAlarmDefinitions`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetAlarmDefinitions`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                filter: filter,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getAlarmGroupsByToken(securityToken: string, languageId: number, timeOut: number): Promise<AlarmGroupDTO[]> {
        this.logger.logger.debug(`getAlarmGroupsByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetAlarmGroupsByToken`, {
            json: true, body: {
                securityToken: securityToken,
                languageID: languageId,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getAlarmGroups(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, languageId: number, timeOut: number): Promise<AlarmGroupDTO[]> {
        this.logger.logger.debug(`getAlarmGroups`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetAlarmGroups`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                languageID: languageId,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getAlarmTypesByToken(securityToken: string, languageId: number, timeOut: number): Promise<AlarmTypeDTO[]> {
        this.logger.logger.debug(`getAlarmTypesByToken`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetAlarmTypesByToken`, {
            json: true, body: {
                securityToken: securityToken,
                languageID: languageId,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }

    public async getAlarmTypes(sessionId: string, clientId: string, userName: string, isDomainUser: boolean, languageId: number, timeOut: number): Promise<AlarmTypeDTO[]> {
        this.logger.logger.debug(`getAlarmTypes`);
        const data = await request.post(`${this.alarmsServiceUrl}/GetAlarmTypes`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                userName: userName,
                isDomainUser: isDomainUser,
                languageID: languageId,
                millisecondsTimeOut: timeOut
            }
        });
        return data.d;
    }


}