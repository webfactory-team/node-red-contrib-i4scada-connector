import { injectable, inject } from "inversify";
import { ConnectorService } from "./services/connector.service";
import { SignalsService } from "./services/signals.service";
import { GetSignalDefinitionsFilterDTO } from "./services/models/dto/get-signal-definitions-filter.dto";
import { KeyValuePair } from "./services/models/key-value-pair.model";
import { GetSignalNamesFilterDTO } from "./services/models/dto/get-signal-names-filter.dto";
import { GetGroupNamesFilterDTO } from "./services/models/dto/get-group-names-filter.dto";
import { Subject } from "rxjs";
import { SecurityService } from "./services/security.service";
import { SessionService } from "./services/session.service";
import { i4Logger } from "./logger/logger";

@injectable()
export class ConnectorFacade {

    public readonly connectionStatusQueue: Subject<boolean>;
    public readonly currentLoggedInUser: string;

    constructor(
        @inject(ConnectorService) private readonly connectorService: ConnectorService,
        @inject(SignalsService) private readonly signalsService: SignalsService,
        @inject(SecurityService) private readonly securityService: SecurityService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {
        this.connectionStatusQueue = signalsService.connectionStatusQueue;
        this.currentLoggedInUser = sessionService.currentLoggedInUser;
    }

    public async login(userName: string, password: string) {
        const user = await this.sessionService.getCurrentLoggedInUser();
        if (!user) {
            return await this.securityService.login(userName, password, false);
        }
    }

    public setPollInterval(pollInterval: number = null) {
        if (pollInterval) {
            this.signalsService.pollInterval = pollInterval;
        }
    }

    public setUrl(url: string = null) {
        this.connectorService.setUrl(url);
    }

    public async connect(serverUrl: string = null, pollInterval: number = null) {
        this.setPollInterval(pollInterval);
        await this.connectorService.connect(serverUrl);
    }

    public async disconect() {
        await this.securityService.logout();
        this.signalsService.dispose();
        await this.connectorService.disconnect();
    }

    public async readSignals(signalNames: string[]) {
        return await this.signalsService.readSignals(signalNames);
    }

    public async writeSignals(signalValues: KeyValuePair<string, any>[]) {
        return await this.signalsService.writeSignals(signalValues);
    }

    public async getSignalDefinitions(filter: GetSignalDefinitionsFilterDTO, start: number, count: number) {
        return await this.signalsService.getSignalDefinitions(filter, start, count);
    }

    public async getSignalNames(filter: GetSignalNamesFilterDTO, start: number, count: number) {
        return await this.signalsService.getSignalNames(filter, start, count);
    }

    public async getGroupNames(filter: GetGroupNamesFilterDTO, start: number, count: number) {
        return await this.signalsService.getGroupNames(filter, start, count);
    }


    public getSignal(name: string) {
        return this.signalsService.getSignal(name);
    }

    public async getOnlineUpdates() {
        await this.signalsService.getOnlineUpdates();
    }

}