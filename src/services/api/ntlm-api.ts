import * as request from "request-promise-native";
import { injectable, inject } from "inversify";
import { i4Logger } from "../../logger/logger";
import { AccountDTO } from "../models/dto/account.dto";

/**
 *  NtlmServiceApi
 */

@injectable()
export class NtlmApi {

    constructor(
        @inject(i4Logger) private readonly logger: i4Logger,
    ) {

    }

    private serverUrl = "https://demo.i4scada.de";

    private get serviceUrl() {
        return this.serverUrl + "/_SERVICES/WebServices/WCF"
    }

    private get ntlmServiceUrl() {
        return this.serviceUrl + "/NtlmService.svc/js";
    }

    public set url(serverUrl: string) {
        this.serverUrl = serverUrl || "https://demo.i4scada.de";
    }

    public async loginWindowsUser(sessionId: string, clientId: string, millisecondsTimeOut: number): Promise<any> {
        const data = await request.post(`${this.ntlmServiceUrl}/LoginWindowsUser`, {
            json: true, body: {
                sessionId: sessionId,
                clientId: clientId,
                millisecondsTimeOut: millisecondsTimeOut
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