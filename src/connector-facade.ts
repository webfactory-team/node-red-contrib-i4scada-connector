import { injectable, inject } from "inversify";
import { ConnectorService, ConnectorStatus } from "./services/connector.service";
import { SignalsService, PollingStatus } from "./services/signals.service";
import { KeyValuePair } from "./services/models/key-value-pair.model";
import { GetSignalNamesFilterDTO } from "./services/models/dto/get-signal-names-filter.dto";
import { GetGroupNamesFilterDTO } from "./services/models/dto/get-group-names-filter.dto";
import { Subject, Subscription } from "rxjs";
import { SecurityService, SecurityStatus } from "./services/security.service";
import { SessionService } from "./services/session.service";
import { i4Logger } from "./logger/logger";
import { SignalDefinitionResultsFilter } from "./services/models/dto/signal-definition-results-filter.model";
import { ITokenPersistentService } from "./services/token-persistent.service";
import { FlowConnectionInfo } from "./services/models/flow-connection-info.model";
import { NodeStatusService, INodeStatus } from "./services/node-status.service";

export enum RetryStatus {
    RetryWaiting,
    RetryAttempt,
    RetryStopped
}

@injectable()
export class ConnectorFacade {

    public readonly pollingStatusQueue: Subject<PollingStatus>;
    public readonly connectorStatusQueue: Subject<ConnectorStatus>;
    public readonly securityStatusQueue: Subject<SecurityStatus>;
    public readonly retryStatusQueue = new Subject<RetryStatus>();

    private pollingStatusSubscription: Subscription;

    private subscriptions = [] as Subscription[];
    private signals: string[] = [];
    private stopped: boolean = false;

    constructor(
        @inject(ConnectorService) private readonly connectorService: ConnectorService,
        @inject(SignalsService) private readonly signalsService: SignalsService,
        @inject(SecurityService) private readonly securityService: SecurityService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject("ITokenPersistentService") private readonly tokenPersistentService: ITokenPersistentService,
        @inject(i4Logger) private readonly logger: i4Logger,
        @inject(NodeStatusService) private readonly nodeStatusService: NodeStatusService
    ) {
        this.pollingStatusQueue = signalsService.pollingStatusQueue;
        this.connectorStatusQueue = connectorService.connectorStatusQueue;
        this.securityStatusQueue = securityService.securityStatusQueue;
        this.nodeStatusService.addRetryStatusSubscription(this.retryStatusQueue);
        this.addStatusSubscriptions();
    }

    private addStatusSubscriptions() {
        this.logger.logger.debug(`addStatusSubscriptions`);
        this.pollingStatusSubscription = this.pollingStatusQueue.subscribe((pollingStatus) => this.onPollingStatus(pollingStatus));
    }

    private async onPollingStatus(pollingStatus: PollingStatus) {
        this.logger.logger.debug(PollingStatus[pollingStatus]);
        if (pollingStatus === PollingStatus.PollingError || pollingStatus === PollingStatus.Canceled) {
            await this.reconnect();
        }
    }

    private removeStatusSubscriptions() {
        this.logger.logger.debug(`removeStatusSubscriptions`);
        this.pollingStatusSubscription.unsubscribe();
    }

    private async reconnect() {
        this.removeStatusSubscriptions();
        await this.rejectDelay(2000);
        await this.disconnect();
        await this.retry(async () => {
            const connectionInfo = this.tokenPersistentService.getFlowConnectionInfo();
            await this.connect(connectionInfo.url, connectionInfo.pollInterval, connectionInfo.userName, connectionInfo.password, null);    
            await this.getSignals(this.signals, this.signals.length);
        });
        this.addStatusSubscriptions();
        this.getOnlineUpdates();
    }

    private async retry(connect: () => Promise<void>, maxRetries: number = null) {
        let attempt = null;
        while (true) {
            if ((maxRetries !== null && attempt >= maxRetries) || this.stopped) {
                this.retryStatusQueue.next(RetryStatus.RetryStopped);
                break;
            }
            attempt++;
            try {
                this.logger.logger.info(`try to reconnect attempt: ${attempt}`);
                this.retryStatusQueue.next(RetryStatus.RetryAttempt);
                await connect();
                break;
            } catch (error) {
                this.logger.logger.error(error);
                this.retryStatusQueue.next(RetryStatus.RetryWaiting);
                await this.rejectDelay(5000);
            }
        }
        this.logger.logger.info(`reconnect was handled`);
    }

    private rejectDelay(delay: number) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve.bind(null, null), delay);
        });
    }

    public setStatusCallback(callback: (nodeStatus: INodeStatus) => void) {
        this.nodeStatusService.setStatusCallback(callback);
    }

    public async connect(url: string, pollInterval: number = null, userName: string = null, password: string = null, maxRetries: number = 1) {
        this.tokenPersistentService.setFlowConnectionInfo(new FlowConnectionInfo(url, pollInterval, userName, password));
        await this.retry(async () => {
            this.clearSecureSession();
            this.setPollInterval(pollInterval);
            await this.connectorService.connect(url);
            if (userName && password) {
                await this.login(userName, password);
            }
        }, maxRetries);
    }

    public async getSignals(signals: string[] = [], count: number = 1000, maxRetries: number = null) {
        const signalNames = await this.signalsService.getSignalDefinitions({
            AliasNames: signals,
            LogTags: [],
            ResultsFilter: SignalDefinitionResultsFilter.Basic,
            ServerNames: []
        }, 0, count);

        for (let signal of signalNames) {
            this.subscriptions.push(this.signalsService.getSignal(signal.AliasName).subscribe(this.publish));
            this.signals.push(signal.AliasName);
        }
    }

    public unsubscribe() {
        for (let subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.subscriptions = [];
    }

    public publish = (signalUpdate: KeyValuePair<string, any>) => {

    }

    private async login(userName: string, password: string) {
        const user = await this.sessionService.getCurrentLoggedInUser();
        if (!user) {
            await this.securityService.login(userName, password, false);
        }
    }

    private setPollInterval(pollInterval: number = null) {
        if (pollInterval) {
            this.signalsService.pollInterval = pollInterval;
        }
    }

    private setUrl(url: string = null) {
        this.connectorService.setUrl(url);
    }

    private clearSecureSession() {
        this.sessionService.clearSecureSession();
    }

    public async disconnect() {
        this.unsubscribe();
        this.securityService.stop();
        this.signalsService.stop();
        await this.connectorService.disconnect();
        this.sessionService.clearSecureSession();
    }

    public async dispose() {
        this.nodeStatusService.dispose();
        this.subscriptions = [];
        this.securityService.stop();
        this.signalsService.stop();

        this.signalsService.dispose();
        await this.connectorService.disconnect();
        this.connectorService.dispose();
        this.sessionService.clearSecureSession();
        this.securityService.dispose();
    }

    public async readSignals(signalNames: string[]) {
        return await this.signalsService.readSignals(signalNames);
    }

    public async writeSignals(signalValues: KeyValuePair<string, any>[]) {
        return await this.signalsService.writeSignals(signalValues);
    }

    public async getSignalDefinitions(signals: string[] = [], count = 1000, start = 0) {
        return await this.signalsService.getSignalDefinitions({
            AliasNames: signals,
            LogTags: [],
            ResultsFilter: SignalDefinitionResultsFilter.Basic,
            ServerNames: []
        }, start, count);
    }

    public async getSignalNames(filter: GetSignalNamesFilterDTO, start: number, count: number) {
        return await this.signalsService.getSignalNames(filter, start, count);
    }

    public async getGroupNames(filter: GetGroupNamesFilterDTO, start: number, count: number) {
        return await this.signalsService.getGroupNames(filter, start, count);
    }

    public async getOnlineUpdates() {
        await this.signalsService.getOnlineUpdates();
    }

}