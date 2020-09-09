import "reflect-metadata";
import { IoCContainer } from "./inversify.config";
import { ConnectorFacade } from "./connector-facade";
import { TestTokenFlowsPersistentService } from "./services/test-token-persistent.service";
import { i4Logger } from "./logger/logger";
import { transports, format } from "winston";

const container = IoCContainer.getContainer();
container.bind("ITokenPersistentService").toConstantValue(new TestTokenFlowsPersistentService());

let logger = container.get<i4Logger>(i4Logger);
logger.logger.add(new transports.Console({
    format: format.simple(),
}));
const connector = container.get<ConnectorFacade>(ConnectorFacade);


start();
logger.logger.log("info", "started!");

async function start() {
    try {
        await connector.connect("http://localhost", 500, "admin", "w", null);
        connector.publish = (signalUpdate) => {
            logger.logger.log("info", signalUpdate.value);
        }
        await connector.getSignals(["Local Second"]);
        connector.getOnlineUpdates();
    } catch (error) {
        logger.logger.error(error);
    }

}
