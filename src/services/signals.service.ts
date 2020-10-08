import { injectable, inject } from "inversify";
import { SignalsApi } from "./api/signals-api";
import { ActionResult } from "./models/action-result.model";
import { KeyValuePair } from "./models/key-value-pair.model";
import { ConnectorService } from "./connector.service";
import { SessionService } from "./session.service";
import { GetSignalDefinitionsFilterDTO } from "./models/dto/get-signal-definitions-filter.dto";
import * as _ from "underscore";
import { SignalUpdateDTO } from "./models/dto/signal-update.dto";
import { Signal } from "./models/signal.model";
import { GetSignalNamesFilterDTO } from "./models/dto/get-signal-names-filter.dto";
import { GetGroupNamesFilterDTO } from "./models/dto/get-group-names-filter.dto";
import { Subject } from "rxjs";
import { bufferTime } from 'rxjs/operators';
import { i4Logger } from "../logger/logger";

interface IRegistrationResult {
    signalName: string;
    code: number;
}

interface IUpdateRequest {
    sessionId: string;
    clientId: string;
    requestId: number;
}

export enum PollingStatus {
    Started,
    Polling,
    Polled,
    Stopped,
    Canceled,
    PollingError
}

@injectable()
export class SignalsService {

    private updateInterval = 250;

    private updateRequest: IUpdateRequest;
    private getUpdates: boolean = false;
    private registeredSignals: Signal[] = [];
    private signalsToRegister: string[] = [];
    private timer = null;

    private readonly unregisterQueue = new Subject<string>();
    public readonly pollingStatusQueue = new Subject<PollingStatus>();

    constructor(
        @inject(SignalsApi) private readonly signalsApi: SignalsApi,
        @inject(ConnectorService) private readonly connectorService: ConnectorService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {
        this.unregisterQueue
            .pipe(bufferTime(10))
            .subscribe(async (names) => {
                if (names.length <= 0)
                    return;
                for (let signalName of names) {
                    let signal = _.find(this.registeredSignals, (signal) => signal.name === signalName);
                    this.registeredSignals.splice(this.registeredSignals.indexOf(signal));
                }
                this.logger.logger.info(`unRegisterSignal - signals: ${names.length}`);
                try {
                    await this.unRegisterSignals(names);
                } catch (error) {
                    this.logger.logger.error(error);
                }
            });
    }

    public set pollInterval(value: number) {
        this.updateInterval = value || 250;
    }

    public async readSignals(signalNames: string[]) {
        this.logger.logger.debug(`Read signals: ${signalNames.map(signal => signal).join()}`);
        return await this.signalsApi.readSignals(this.sessionService.getSessionId(), this.sessionService.getClientId(), signalNames);
    }

    public async writeSignals(signalValues: KeyValuePair<string, any>[]) {
        this.logger.logger.info(`Write signals: ${signalValues.map(signal => signal.key).join()}, values: ${signalValues.map(signal => signal.value).join()}`);

        const securityToken = this.sessionService.getSecurityToken();
        const currentUser = this.sessionService.currentLoggedInUser;

        let responseCodes: number[];
        if (securityToken && currentUser) {
            responseCodes = await this.signalsApi.writeSecuredSignals(securityToken, this.sessionService.getClientId(), signalValues);
        } else {
            responseCodes = await this.signalsApi.writeUnsecuredSignals(this.sessionService.getSessionId(), this.sessionService.getClientId(), signalValues);
        }
        return this.handleWriteResponse(responseCodes);
    }

    public async getSignalDefinitions(filter: GetSignalDefinitionsFilterDTO, start: number, count: number) {
        const securityToken = this.sessionService.getSecurityToken();
        if (securityToken) {
            return await this.signalsApi.getSignalDefinitionsByToken(securityToken, filter, 7, start, count, this.sessionService.millisecondsTimeOut);
        } else {
            return await this.signalsApi.getSignalDefinitions(this.sessionService.getSessionId(), this.sessionService.getClientId(), this.sessionService.currentLoggedInUser, this.sessionService.currentLoggedInUserIsDomainUser, filter, 7, start, count, this.sessionService.millisecondsTimeOut);
        }
    }

    public async getSignalNames(filter: GetSignalNamesFilterDTO, start: number, count: number) {
        const securityToken = this.sessionService.getSecurityToken();
        if (securityToken) {
            return await this.signalsApi.getSignalNamesByToken(securityToken, filter, start, count, this.sessionService.millisecondsTimeOut);
        } else {
            return await this.signalsApi.getSignalNames(this.sessionService.getSessionId(), this.sessionService.getClientId(), this.sessionService.currentLoggedInUser, this.sessionService.currentLoggedInUserIsDomainUser, filter, start, count, this.sessionService.millisecondsTimeOut);
        }
    }

    public async getGroupNames(filter: GetGroupNamesFilterDTO, start: number, count: number) {
        const securityToken = this.sessionService.getSecurityToken();
        if (securityToken) {
            return await this.signalsApi.getGroupNamesByToken(securityToken, filter, 7, start, count, this.sessionService.millisecondsTimeOut);
        } else {
            return await this.signalsApi.getGroupNames(this.sessionService.getSessionId(), this.sessionService.getClientId(), this.sessionService.currentLoggedInUser, this.sessionService.currentLoggedInUserIsDomainUser, filter, 7, start, count, this.sessionService.millisecondsTimeOut);
        }
    }

    public getSignal(name: string) {
        this.logger.logger.info(`Get signal ${name}.`);
        if (!name) {
            this.logger.logger.warn("No signal name specified");
            return;
        }

        let signal = _.find(this.registeredSignals, (signal) => signal.name === name);
        if (!signal) {
            signal = new Signal(name);
            signal.onUnsubscribe = (signalName) => {
                this.unregisterQueue.next(signalName);
            }
            this.registeredSignals.push(signal)
            this.signalsToRegister.push(name);
        }
        return signal;
    }


    private async unRegisterSignals(names: string[]) {
        await this.signalsApi.unregisterSignals(this.sessionService.getSessionId(), this.sessionService.getClientId(), names);
    }

    private handleWriteResponse(response: number[]): ActionResult {
        if (response && _.isArray(response)) {
            const errorCode = response.find(x => { return !!x });
            if (!errorCode) {
                return {
                    errorMessage: "no error code available",
                    exception: null,
                    successful: true
                };
            } else {

                let translation = "failed with error code";

                for (let errorCode of response) {
                    let errorKey: any = errorCode.toString();
                }

                return {
                    errorMessage: translation,
                    exception: null,
                    successful: false
                };
            }
        }
        else {
            return {
                errorMessage: "unknown error code",
                exception: null,
                successful: false
            };
        }
    }

    private async startGettingUpdates() {
        if (!this.getUpdates) {
            this.pollingStatusQueue.next(PollingStatus.Started);
            this.createUpdateRequest();
            this.doUpdate();
        }
    }

    private createUpdateRequest(prevRequestId = 0, prevResponseId = 0) {
        const requestId = this.getNextRequestId(prevRequestId, prevResponseId);
        this.updateRequest = {
            sessionId: this.sessionService.getSessionId(),
            clientId: this.sessionService.getClientId(),
            requestId: requestId
        };
    }

    private getNextRequestId(prevRequestId: number, prevResponseId: number) {
        if (prevResponseId === 0) {
            return 1;
        }
        if (prevResponseId === prevRequestId) {
            return prevRequestId % 1000 + 1;
        }
        return 0;
    }

    private async doUpdate() {
        this.pollingStatusQueue.next(PollingStatus.Polling);
        const request = this.updateRequest;

        if (!this.updateRequest) {
            this.pollingStatusQueue.next(PollingStatus.Stopped);
            this.logger.logger.warn("updateRequest does not exsist, the doUpdate seems to be stopped.");
            return;
        }

        try {
            this.getUpdates = true;
            this.logger.logger.debug(`getUpdates - sessionId:${request.sessionId} - clientId:${request.clientId} - requestId:${request.requestId}`);
            const update = await this.signalsApi.getUpdates(request.sessionId, request.clientId, request.requestId);
            this.pollingStatusQueue.next(PollingStatus.Polled);
            this.updateSignals(update);
        } catch (error) {
            this.pollingStatusQueue.next(PollingStatus.PollingError);
            this.logger.logger.error(error);
            this.resetTimer();
            this.timer = _.delay(() => { this.doUpdate() }, this.updateInterval);
        }
    }

    private resetTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private updateSignals(update: SignalUpdateDTO) {
        if (!update) {
            this.pollingStatusQueue.next(PollingStatus.Canceled)
            return;
        }

        var responseId = update.ResponseId;
        var updates = update.Updates;

        for (var i = 0; i < updates.length; i++) {
            var item = updates[i];
            const key = item.key;
            if (!key) {
                continue;
            }
            let signal = _.find(this.registeredSignals, (signal) => signal.name === key);
            if (signal) {
                signal.next({
                    key: item.key,
                    value: item.value
                });
            }
        }
        this.resetTimer();
        this.timer = _.delay(() => {
           if (this.updateRequest) {
                this.createUpdateRequest(this.updateRequest.requestId, responseId);
                this.doUpdate();
            } else {
                this.pollingStatusQueue.next(PollingStatus.Stopped);
                this.logger.logger.warn("updateRequest does not exsist, the updateSignals seems to be stopped.");
            }
        }, this.updateInterval);

    }

    private async registerSignals() {
        const signalNames = this.signalsToRegister.slice();
        this.signalsToRegister = [];
        if (!signalNames.length) {
            this.logger.logger.info("Signals are already registered, skipping");
            return;
        }

        this.logger.logger.info(`Registering signals: ${signalNames}`);
        const sessionId = this.sessionService.getSessionId();
        const clientId = this.sessionService.getClientId();
        try {
            const results = await this.signalsApi.registerSignals(sessionId, clientId, signalNames);
            this.onSignalsRegistered(signalNames, results);
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    private onSignalsRegistered(signalNames: string[], results: number[]): boolean {
        const successfull: IRegistrationResult[] = [];
        const warnings: IRegistrationResult[] = [];
        const errors: IRegistrationResult[] = [];

        for (let i = 0; i < signalNames.length; i++) {
            if (results[i] > 0) {
                warnings.push({
                    signalName: signalNames[i],
                    code: results[i]
                });
            } else if (results[i] < 0) {
                errors.push({
                    signalName: signalNames[i],
                    code: results[i]
                });
            } else {
                successfull.push({
                    signalName: signalNames[i],
                    code: results[i]
                });
            }
        }

        if (successfull.length) {
            this.logger.logger.info(this.buildSignalRegistrationMessage("Successfully registered", successfull));
        }

        if (warnings.length) {
            this.logger.logger.info(this.buildSignalRegistrationMessage("Encountered warnings when registering", warnings));
        }

        if (errors.length) {
            throw this.buildSignalRegistrationMessage("Failed to register", errors);
        }

        return true;
    }

    private buildSignalRegistrationMessage(message: string, results: IRegistrationResult[]) {
        let result = message + " " + results.length + " signals:";
        const signalCodes = results.map(r => `${r.signalName} (${r.code})`).join(", ");

        if (signalCodes.length > 0) {
            result += "\n";
            result += signalCodes;
        }

        return result;
    }

    public async getOnlineUpdates() {
        try {
            this.logger.logger.info(`start geting online updates`);
            await this.registerSignals();
            await this.startGettingUpdates();
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    public stop() {
        this.pollingStatusQueue.next(PollingStatus.Stopped);
        this.resetTimer();

        this.updateRequest = null;
        this.getUpdates = false;

        this.registeredSignals = [];
        this.signalsToRegister = [];
    }

    public dispose() {
        this.unregisterQueue.unsubscribe();
        this.pollingStatusQueue.unsubscribe();
    }

}