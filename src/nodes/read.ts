import "reflect-metadata";
import { IoCContainer } from "../inversify.config";
import _ = require("underscore");
import { TokenFlowPersistentService } from "../services/token-persistent.service";
import { NodeRedTransport, i4Logger } from "../logger/logger";
import { ConnectorFacade } from "../connector-facade";

export = function (RED) {
    "use strict";

    function ReadNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;

        let myContainer = IoCContainer.getContainer();
        let customLogger = new NodeRedTransport(node);
        let logger = myContainer.get<i4Logger>(i4Logger);
        logger.logger.add(customLogger);
        let persistence = new TokenFlowPersistentService(node.context());
        myContainer.bind("ITokenPersistentService").toConstantValue(persistence);
        let connector = myContainer.get<ConnectorFacade>(ConnectorFacade);

        this.server = RED.nodes.getNode(n.server);
        if (!this.server)
            return;

        const credentials = RED.nodes.getCredentials(n.server);

        var username = credentials.username;
        var password = credentials.password;
        
        connector.setStatusCallback((x) => node.status(x));

        connector.connect(this.server.host, 5000, username, password).then(() => {
            node.on('input', async (msg) => {
                if ("topic" in msg) {
                    node.status({ fill: "grey", shape: "dot", text: "Prepare to read" });
                    try {
                        node.status({ fill: "green", shape: "ring", text: "Reading" });
                        let result = await connector.readSignals([msg.topic]);
                        if (result[0].Result === 0) {
                            node.status({ fill: "green", shape: "dot", text: "Read successful" });
                            logger.logger.info("Read successful");
                            msg.payload = result[0].Value;
                            node.send(msg);
                        } else {
                            node.status({ fill: "red", shape: "dot", text: "Read failed" });
                            logger.logger.error("Read failed");
                            msg.successful = false;
                            node.send(msg);
                        }
                    } catch (error) {
                        node.status({ fill: "red", shape: "dot", text: "Read failed" });
                        logger.logger.error(error);
                        msg.successful = false;
                        node.send(msg);
                    }
                }
            });
        })

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

    RED.nodes.registerType("read", ReadNode);
};


