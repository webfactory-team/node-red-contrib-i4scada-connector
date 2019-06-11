import { Container, interfaces } from "inversify";
import { ConnectorService } from "./services/connector.service";
import { ApiService } from "./services/api.service";
import { SignalsService } from "./services/signals.service";
import { SessionService } from "./services/session.service";
import { ConnectorFacade } from "./connector-facade";
import { i4Facade } from "./i4-facade";
import { SecurityService } from "./services/security.service";
import { i4Logger } from "./logger/logger";

export class IoCContainer {
    static getContainer() {
        const myContainer = new Container();
        myContainer.bind(ApiService).to(ApiService).inRequestScope();
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

