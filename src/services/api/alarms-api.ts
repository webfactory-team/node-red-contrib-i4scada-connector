import * as request from "request-promise-native";
import { injectable, inject } from "inversify";
import { i4Logger } from "../../logger/logger";
import { AlarmsDTO } from "../models/dto/alarms.dto";
import { AlarmFilterDTO } from "../models/dto/alarm-filter.dto";
import { AcknowledgeResultDTO } from "../models/dto/acknowledge-result.dto";
import { AlarmDefinitionFilterDTO } from "../models/dto/alarm-definition-filter.dto";
import { AlarmDefinitionsDTO } from "../models/dto/alarm-definitions.dto";

/**
 *  AlarmsServiceApi
 */
@injectable()
export class AlarmsApi {

    constructor(
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    private serverUrl = "https://demo.i4scada.de";

    private get serviceUrl() {
        return this.serverUrl + "/_SERVICES/WebServices/WCF"
    }

    private get alarmsServiceUrl() {
        return this.serviceUrl + "/AlarmsService.svc/js";
    }

    public set url(serverUrl: string) {
        this.serverUrl = serverUrl || "https://demo.i4scada.de";
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
}