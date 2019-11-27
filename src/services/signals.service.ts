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

@injectable()
export class SignalsService {

    private updateInterval = 250;

    private lastUpdateError: string;
    private updateRequest: IUpdateRequest;
    private getUpdates: boolean = false;
    private registeredSignals: Signal[] = [];
    private signalsToRegister: string[] = [];
    private timer = null;

    private readonly unregisterQueue = new Subject<string>();
    public readonly connectionStatusQueue = new Subject<boolean>();

    constructor(
        @inject(SignalsApi) private readonly signalsApi: SignalsApi,
        @inject(ConnectorService) private readonly connectorService: ConnectorService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {
        this.unregisterQueue
            .pipe(bufferTime(50))
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
        await this.connectorService.connect();
        this.logger.logger.debug(`Read signals: ${signalNames.map(signal => signal).join()}`);
        return await this.signalsApi.readSignals(this.sessionService.sessionId, this.sessionService.getClientId(), signalNames);
    }

    public async writeSignals(signalValues: KeyValuePair<string, any>[]) {
        this.logger.logger.info(`Write signals: ${signalValues.map(signal => signal.key).join()}`);

        const securityToken = this.sessionService.getSecurityToken();
        const currentUser = this.sessionService.currentLoggedInUser;

        await this.connectorService.connect();
        let responseCodes: number[];
        if (securityToken && currentUser) {
            responseCodes = await this.signalsApi.writeSecuredSignals(securityToken, this.sessionService.getClientId(), signalValues);
        } else {
            responseCodes = await this.signalsApi.writeUnsecuredSignals(this.sessionService.sessionId, this.sessionService.getClientId(), signalValues);
        }
        return this.handleWriteResponse(responseCodes);
    }

    public async getSignalDefinitions(filter: GetSignalDefinitionsFilterDTO, start: number, count: number) {
        await this.connectorService.connect();

        const securityToken = this.sessionService.getSecurityToken();
        if (securityToken) {
            return await this.signalsApi.getSignalDefinitionsByToken(securityToken, filter, 7, start, count, this.sessionService.timeOut);
        } else {
            return await this.signalsApi.getSignalDefinitions(this.sessionService.sessionId, this.sessionService.getClientId(), this.sessionService.currentLoggedInUser, this.sessionService.currentLoggedInUserIsDomainUser, filter, 7, start, count, this.sessionService.timeOut);
        }
    }

    public async getSignalNames(filter: GetSignalNamesFilterDTO, start: number, count: number) {
        await this.connectorService.connect();
        const securityToken = this.sessionService.getSecurityToken();
        if (securityToken) {
            return await this.signalsApi.getSignalNamesByToken(securityToken, filter, start, count, this.sessionService.timeOut);
        } else {
            return await this.signalsApi.getSignalNames(this.sessionService.sessionId, this.sessionService.getClientId(), this.sessionService.currentLoggedInUser, this.sessionService.currentLoggedInUserIsDomainUser, filter, start, count, this.sessionService.timeOut);
        }
    }

    public async getGroupNames(filter: GetGroupNamesFilterDTO, start: number, count: number) {
        await this.connectorService.connect();
        const securityToken = this.sessionService.getSecurityToken();
        if (securityToken) {
            return await this.signalsApi.getGroupNamesByToken(securityToken, filter, 7, start, count, this.sessionService.timeOut);
        } else {
            return await this.signalsApi.getGroupNames(this.sessionService.sessionId, this.sessionService.getClientId(), this.sessionService.currentLoggedInUser, this.sessionService.currentLoggedInUserIsDomainUser, filter, 7, start, count, this.sessionService.timeOut);
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
        await this.connectorService.connect();
        await this.signalsApi.unregisterSignals(this.sessionService.sessionId, this.sessionService.getClientId(), names);
    }

    public async getOnlineUpdates() {
        try {
            await this.connectorService.connect();
            this.logger.logger.info(`start geting online updates`);
            await this.registerSignals();
            await this.startGettingUpdates();
        } catch (error) {
            this.logger.logger.error(error);
        }
    }

    private handleWriteResponse(response: number[]): ActionResult {
        const errorCode = response.find(x => { return !!x });
        if (!errorCode) {
            return {
                errorMessage: null,
                exception: null,
                successful: true
            };
        } else {

            let translation = "";

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

    private async startGettingUpdates() {
        if (!this.getUpdates) {
            this.createUpdateRequest();
            this.doUpdate();

        }
    }


    private createUpdateRequest(prevRequestId = 0, prevResponseId = 0) {
        const requestId = this.getNextRequestId(prevRequestId, prevResponseId);
        this.updateRequest = {
            sessionId: this.sessionService.sessionId,
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
        const request = this.updateRequest;
        try {
            this.getUpdates = true;
            this.logger.logger.debug(`getUpdates - sessionId:${request.sessionId} - clientId:${request.clientId} - requestId:${request.requestId}`);
            const update = await this.signalsApi.getUpdates(request.sessionId, request.clientId, request.requestId);
            this.connectionStatusQueue.next(true);
            this.updateSignals(update);
        } catch (error) {
            this.connectionStatusQueue.next(false);
            if (!this.lastUpdateError) {
                this.lastUpdateError = error;
                this.logger.logger.error(error);
            }
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.timer = _.delay(() => this.doUpdate(), this.updateInterval);
        }
    }

    private updateSignals(update: SignalUpdateDTO) {
        this.lastUpdateError = null;

        if (!update) {
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
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.timer = _.delay(() => {
            this.createUpdateRequest(this.updateRequest.requestId, responseId);
            this.doUpdate();
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
        const sessionId = this.sessionService.sessionId;
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

    public dispose() {
        this.unregisterQueue.unsubscribe();
        this.connectionStatusQueue.unsubscribe();
    }
}