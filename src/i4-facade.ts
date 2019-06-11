import { injectable, inject } from "inversify";
import { ConnectorFacade } from "./connector-facade";
import { KeyValuePair } from "./services/models/key-value-pair.model";
import { Subscription, Subject } from "rxjs";
import { SignalDefinitionResultsFilter } from "./services/models/dto/signal-definition-results-filter.model";

@injectable()
export class i4Facade {

    private subscriptions = [] as Subscription[];

    public readonly connectionStatusQueue: Subject<boolean>;

    constructor(
        @inject(ConnectorFacade) private readonly connectorFacade: ConnectorFacade,
    ) {
        this.connectionStatusQueue = connectorFacade.connectionStatusQueue;
    }
    public async writesAsync(values: KeyValuePair<string, any>[]) {
        return await this.connectorFacade.writeSignals(values);
    }

    public async readAsync(signalNames: string[]) {
        return await this.connectorFacade.readSignals(signalNames);
    }

    public setSettings(url: string, pollInterval: number) {
        this.connectorFacade.setUrl(url);
        this.connectorFacade.setPollInterval(pollInterval);
    }

    public async connect(url: string, pollInterval: number, userName: string = null, password: string = null) {
        if (userName && password) {
            this.connectorFacade.login(userName, password);
        }
        await this.connectorFacade.connect(url, pollInterval);
    }

    public async getOnlineUpdates() {
        await this.connectorFacade.getOnlineUpdates();
    }

    public async getSignalDefinitions(signals: string[] = [], count = 1000, start = 0) {
        return await this.connectorFacade.getSignalDefinitions({
            AliasNames: signals,
            LogTags: [],
            ResultsFilter: SignalDefinitionResultsFilter.Basic,
            ServerNames: []
        }, start, count);
    }

    public async getSignalNames(signals: string[] = [], groupIds: string[] = [], count = 1000, start = 0) {
        return await this.connectorFacade.getSignalNames({
            AliasNames: signals,
            GroupIds: groupIds,
            ServerNames: []
        }, start, count);
    }

    public async getGroupNames(names: string[] = [], count = 1000, start = 0) {
        return await this.connectorFacade.getGroupNames({
            GroupNames: names,
            ServerNames: []
        }, start, count);
    }

    public async getSignals(signals: string[] = [], count: number = 1000) {
        const signalNames = await this.connectorFacade.getSignalDefinitions({
            AliasNames: signals,
            LogTags: [],
            ResultsFilter: SignalDefinitionResultsFilter.Basic,
            ServerNames: []
        }, 0, count);

        for (let name of signalNames) {
            this.subscriptions.push(this.connectorFacade.getSignal(name.AliasName).subscribe(this.publish));
        }
    }

    // public getSignal(name: string) {
    //     const subscription = this.connectorFacade.getSignal(name);
    //     this.connectorFacade.getOnlineUpdates();
    //     return subscription;
    // }


    public unsubscribe() {
        for (let subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.subscriptions = [];
        this.connectionStatusQueue.unsubscribe();
    }


    public async disconnect() {
        await this.connectorFacade.disconect();
    }


    public publish = (signalUpdate: KeyValuePair<string, any>) => {

    }

}