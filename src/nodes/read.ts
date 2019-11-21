import "reflect-metadata";
import { IoCContainer } from "../inversify.config";
import { i4Facade } from "../i4-facade";
import _ = require("underscore");
import { TokenFlowPersistentService } from "../services/token-persistent.service";
import { NodeRedTransport, i4Logger } from "../logger/logger";

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
        let connector = myContainer.get<i4Facade>(i4Facade);

        this.server = RED.nodes.getNode(n.server);
        if (!this.server)
            return;

        const credentials = RED.nodes.getCredentials(n.server);

        var username = credentials.username;
        var password = credentials.password;

        connector.connect(this.server.host, 5000, username, password).then(() => {
            node.on('input', async (msg) => {
                if ("topic" in msg) {
                    node.status({ fill: "grey", shape: "dot", text: "Prepare to read" });
                    try {
                        let result = await connector.readAsync([msg.topic]);
                        if (result[0].Result === 0) {
                            node.status({ fill: "green", shape: "dot", text: "read successful" });
                            msg.payload = result[0].Value;
                            node.send(msg);
                        } else {
                            node.status({ fill: "red", shape: "dot", text: "read failed" });
                            msg.successful = false;
                            node.send(msg);
                        }
                    } catch (error) {
                        node.status({ fill: "red", shape: "dot", text: "read failed" });
                        msg.successful = false;
                        node.send(msg);
                    }
                }
            });
        })


        node.on("close", async (done: () => void) => {
            connector.unsubscribe();
            await connector.disconnect();
            _.delay(() => {
                persistence.dispose();
                logger.logger.remove(customLogger);
                done();
            }, 1000);
        });
    }

    RED.nodes.registerType("read", ReadNode);
};


