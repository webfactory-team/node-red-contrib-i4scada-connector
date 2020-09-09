import "reflect-metadata";
import { IoCContainer } from "../inversify.config";
import { ConnectorFacade } from "../connector-facade";
import _ = require("underscore");
import { TokenFlowPersistentService } from "../services/token-persistent.service";
import { i4Logger, NodeRedTransport } from "../logger/logger";

export = function (RED) {
    "use strict";

    function WriteNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;

        let myContainer = IoCContainer.getContainer();
        let persistence = new TokenFlowPersistentService(node.context());
        myContainer.bind("ITokenPersistentService").toConstantValue(persistence);
        let connector = myContainer.get<ConnectorFacade>(ConnectorFacade);
        let logger = myContainer.get<i4Logger>(i4Logger);
        let customLogger = new NodeRedTransport(node);
        logger.logger.add(customLogger);

        this.server = RED.nodes.getNode(n.server);
        if (!this.server)
            return;

        const credentials = RED.nodes.getCredentials(n.server);

        const username = credentials.username;
        const password = credentials.password;
        
        connector.setStatusCallback((x) => node.status(x));

        connector.connect(this.server.host, 500, username, password).then(() => {
            node.status({ fill: "green", shape: "ring", text: "waiting for messages" });
            node.on('input', async (msg) => {
                if ("topic" in msg && "payload" in msg) {
                    try {
                        node.status({ fill: "green", shape: "ring", text: "Writing" });
                        let result = await connector.writeSignals([{ key: msg.topic, value: msg.payload }]);
                        if (result.successful === true) {
                            node.status({ fill: "green", shape: "dot", text: "Write successful" });
                            logger.logger.info("Write successful");
                        } else {
                            node.status({ fill: "red", shape: "dot", text: "Write failed" + result.errorMessage });
                            logger.logger.error("Write failed" + result.errorMessage);
                        }
                    } catch (error) {
                        logger.logger.error(error);
                        node.status({ fill: "red", shape: "dot", text: "Write failed: " + error });
                    }
                }
            })
        });

        node.on("close", async (done: () => void) => {
            try {
                await connector.dispose();
            } catch (error) {
                logger.logger.error(error);
            }
            _.delay(() => {
                persistence.dispose();
                logger.logger.remove(customLogger);
                done();
            }, 1000);
        });
    }

    RED.nodes.registerType("write", WriteNode);
};


