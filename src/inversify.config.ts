import { Container, interfaces } from "inversify";
import { ConnectorService } from "./services/connector.service";
import { NtlmApi } from "./services/api/ntlm-api";
import { SecurityApi } from "./services/api/security-api";
import { SignalsApi } from "./services/api/signals-api";
import { AlarmsApi } from "./services/api/alarms-api";
import { SignalsService } from "./services/signals.service";
import { SessionService } from "./services/session.service";
import { ConnectorFacade } from "./connector-facade";
import { i4Facade } from "./i4-facade";
import { SecurityService } from "./services/security.service";
import { i4Logger } from "./logger/logger";

export class IoCContainer {
    static getContainer() {
        const myContainer = new Container();
        myContainer.bind(NtlmApi).to(NtlmApi).inRequestScope();
        myContainer.bind(SecurityApi).to(SecurityApi).inRequestScope();
        myContainer.bind(SignalsApi).to(SignalsApi).inRequestScope();
        myContainer.bind(AlarmsApi).to(AlarmsApi).inRequestScope();
        myContainer.bind(ConnectorService).to(ConnectorService).inRequestScope();
        myContainer.bind(SignalsService).to(SignalsService).inRequestScope();
        myContainer.bind(SessionService).to(SessionService).inRequestScope();
        myContainer.bind(i4Logger).to(i4Logger).inSingletonScope();

        myContainer.bind(SecurityService).to(SecurityService).inTransientScope();
        myContainer.bind(ConnectorFacade).to(ConnectorFacade).inTransientScope();
        myContainer.bind(i4Facade).to(i4Facade).inTransientScope();
        return myContainer;
    }

}

