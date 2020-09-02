import "reflect-metadata";
import { IoCContainer } from "../inversify.config";
import { i4Facade } from "../i4-facade";
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
        let connector = myContainer.get<i4Facade>(i4Facade);
        let logger = myContainer.get<i4Logger>(i4Logger);
        let customLogger = new NodeRedTransport(node);
        logger.logger.add(customLogger);


        this.server = RED.nodes.getNode(n.server);
        if (!this.server)
            return;

        const credentials = RED.nodes.getCredentials(n.server);
        const username = credentials.username;
        const password = credentials.password;

        node.status({ fill: "yellow", shape: "ring", text: "connecting" });
        connector.connect(this.server.host, 500, username, password).then(() => {
            node.status({ fill: "green", shape: "ring", text: "waiting for messages" });
            node.on('input', async (msg) => {
                node.status({ fill: "green", shape: "ring", text: "writing" });
                if ("topic" in msg && "payload" in msg) {
                    try {
                        let result = await connector.writesAsync([{ key: msg.topic, value: msg.payload }]);
                        if (result.successful === true) {
                            node.status({ fill: "green", shape: "dot", text: "write successful" });
                        } else {
                            node.status({ fill: "red", shape: "dot", text: "write failed" + result.errorMessage });
                        }
                    } catch (error) {
                        logger.logger.error(error);
                        node.status({ fill: "red", shape: "dot", text: "write failed: " + error });
                    }
                }
            })
        });

        node.on("close", async (done: () => void) => {
            connector.unsubscribe();
            try {
                await connector.disconnect();
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


