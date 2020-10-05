import { ConnectorService, ConnectorStatus } from "./connector.service";
import { SignalsService, PollingStatus } from "./signals.service";
import { inject, injectable } from "inversify";
import { i4Logger } from "../logger/logger";
import { Subject, Subscription } from "rxjs";
import { SecurityService, SecurityStatus } from "./security.service";
import { RetryStatus } from "../connector-facade";

export interface INodeStatus {
    fill: string;
    shape: string;
    text: string;
}

@injectable()
export class NodeStatusService {

    private nodeStatusCallback: (nodeStatus: INodeStatus) => void;

    private pollingStatusSubscription: Subscription;
    private connectorStatusSubscription: Subscription;
    private securityStatusSubscription: Subscription;
    private retryStatusSubscription: Subscription;

    constructor(
        @inject(ConnectorService) private readonly connectorService: ConnectorService,
        @inject(SignalsService) private readonly signalsService: SignalsService,
        @inject(SecurityService) private readonly securityService: SecurityService,
        @inject(i4Logger) private readonly logger: i4Logger
    ) {
        this.addStatusSubscriptions();
    }

    private addStatusSubscriptions() {
        this.pollingStatusSubscription = this.signalsService.pollingStatusQueue.subscribe((pollingStatus) => this.onPollingStatus(pollingStatus));
        this.connectorStatusSubscription = this.connectorService.connectorStatusQueue.subscribe((connectorStatus) => this.onConnectorStatus(connectorStatus));
        this.securityStatusSubscription = this.securityService.securityStatusQueue.subscribe((securityStatus) => this.onSecurityStatus(securityStatus));
    }

    public addRetryStatusSubscription(retryStatusQueue: Subject<RetryStatus>) {
        this.retryStatusSubscription = retryStatusQueue.subscribe((status) => this.onRetryStatus(status));
    }

    private async onPollingStatus(pollingStatus: PollingStatus) {
        if (this.nodeStatusCallback) {
            this.nodeStatusCallback(this.getPollingStatusInformation(pollingStatus));
        }
    }

    private onConnectorStatus(connectorStatus: ConnectorStatus) {
      //  this.logger.logger.debug(ConnectorStatus[connectorStatus]);
        if (this.nodeStatusCallback) {
            this.nodeStatusCallback(this.getConnectorStatusInformation(connectorStatus));
        }
    }

    private onSecurityStatus(securityStatus: SecurityStatus) {
        if (this.nodeStatusCallback) {
            this.nodeStatusCallback(this.getSecurityStatusInformation(securityStatus));
        }
    }

    private onRetryStatus(status: RetryStatus) {
        if (this.nodeStatusCallback) {
            this.nodeStatusCallback(this.getRetryStatusInformation(status));
        }
    }

    private getPollingStatusInformation(pollingStatus: PollingStatus) {

        let fill = "grey";
        let shape = "dot";
        let text = PollingStatus[pollingStatus];

        switch (pollingStatus) {
            case PollingStatus.PollingError:
                fill = "red";
                break;
            case PollingStatus.Canceled:
                fill = "yellow";
                break;
            case PollingStatus.Polled:
                fill = "green";
                break;
            case PollingStatus.Polling:
                fill = "green";
                shape = "ring";
                break;
            case PollingStatus.Started:
                fill = "green";
                shape = "ring";
                break;
            case PollingStatus.Stopped:
                fill = "yellow";
                shape = "ring";
                break;
        }

        return {
            fill: fill,
            shape: shape,
            text: text
        } as INodeStatus;
    }

    private getConnectorStatusInformation(connectorStatus: ConnectorStatus) {

        let fill = "grey";
        let shape = "dot";
        let text = ConnectorStatus[connectorStatus];

        switch (connectorStatus) {
            case ConnectorStatus.ConnectionError:
                fill = "red";
                break;
            case ConnectorStatus.Canceled:
                fill = "yellow";
                break;
            case ConnectorStatus.Connecting:
                fill = "green";
                shape = "ring";
                break;
            case ConnectorStatus.Disconeting:
                fill = "yellow";
                shape = "ring";
                break;
            case ConnectorStatus.Disconnected:
                fill = "yellow";
                break;
            case ConnectorStatus.Connected:
                fill = "green";
                break;
        }

        return {
            fill: fill,
            shape: shape,
            text: text
        } as INodeStatus;
    }

    private getSecurityStatusInformation(securityStatus: SecurityStatus) {

        let fill = "grey";
        let shape = "dot";
        let text = SecurityStatus[securityStatus];

        switch (securityStatus) {
            case SecurityStatus.AuthenticationError:
            case SecurityStatus.NetworkError:
                fill = "red";
                break;
            case SecurityStatus.Authenticating:
                fill = "green";
                shape = "ring";
                break;
            case SecurityStatus.Authenticated:
                fill = "green";
                break;
            case SecurityStatus.RemoteLogout:
                fill = "yellow";
                break;
        }

        return {
            fill: fill,
            shape: shape,
            text: text
        } as INodeStatus;
    }

    private getRetryStatusInformation(status: RetryStatus) {

        let fill = "grey";
        let shape = "dot";
        let text = RetryStatus[status];

        switch (status) {
            case RetryStatus.RetryStopped:
                fill = "red";
                shape = "ring";
                break;
            case RetryStatus.RetryWaiting:
                fill = "yellow";
                shape = "ring";
                break;
            case RetryStatus.RetryAttempt:
                fill = "yellow";
                break;
        }

        return {
            fill: fill,
            shape: shape,
            text: text
        } as INodeStatus;
    }

    private removeStatusSubscriptions() {
        this.pollingStatusSubscription.unsubscribe();
        this.connectorStatusSubscription.unsubscribe();
        this.securityStatusSubscription.unsubscribe();
        this.retryStatusSubscription.unsubscribe();
    }

    public setStatusCallback(callback: (nodeStatus: INodeStatus) => void) {
        this.nodeStatusCallback = callback;
    }

    public dispose() {
        this.removeStatusSubscriptions();
    }
}