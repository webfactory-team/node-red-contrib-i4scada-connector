import "reflect-metadata";
import _ = require("underscore");
import { TokenFlowPersistentService } from "../services/token-persistent.service";
import { i4Logger, NodeRedTransport } from "../logger/logger";
import { IoCContainer } from "../inversify.config";
import { ConnectorFacade } from "../connector-facade";

export = function (RED) {
    "use strict";
    function SignalNode(n) {
        RED.nodes.createNode(this, n);
        let node = this;

        let myContainer = IoCContainer.getContainer();
        let persistence = new TokenFlowPersistentService(node.context());
        myContainer.bind("ITokenPersistentService").toConstantValue(persistence);
        let connector = myContainer.get<ConnectorFacade>(ConnectorFacade);
        let logger = myContainer.get<i4Logger>(i4Logger);
        let customLogger = new NodeRedTransport(node);
        logger.logger.add(customLogger);

        this.count = n.count;
        this.signals = n.signals ? n.signals.map(x => x.name) : [];

        node.status({ fill: "red", shape: "dot", text: "disconnected" });

        this.server = RED.nodes.getNode(n.server);
        if (!this.server)
            return;

        const credentials = RED.nodes.getCredentials(n.server);

        const username = credentials.username;
        const password = credentials.password;

        connector.setStatusCallback((x) => node.status(x));

        connector.publish = (signalUpdate) => {
            var msg = {} as any;
            msg.topic = signalUpdate.key;
            msg.payload = signalUpdate.value;
            node.send(msg);
        }

        connect(this.server.host, this.server.pollInterval, this.signals, this.count, username, password);

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

        async function connect(uri: string, pollInterval: number, signals: string[], count: number, userName: string, password: string) {
            try {
                await connector.connect(uri, pollInterval, userName, password, null);
                await connector.getSignals(signals, count);
                await connector.getOnlineUpdates();
            } catch (error) {
                logger.logger.error(error);
            }
        }
    }
    RED.nodes.registerType("signals", SignalNode);

    RED.httpAdmin.get("/i4scada/signalDefinitions/:id/:name?/:count?/:start?", RED.auth.needsPermission('i4scada.read'), async (req, res) => {
        let signals = req.params.name !== undefined ? [req.params.name] : [];
        let count = req.params.count || 1000;
        var start = req.params.start || 0;

        var credentials = RED.nodes.getCredentials(req.params.id);
        var server = RED.nodes.getNode(req.params.id);

        if (!credentials || !server) {
            res.status(400);
            return;
        }

        const username = credentials.username || null;
        const password = credentials.password || null;
        const pollInterval = server.pollInterval;
        const host = server.host;

        let myContainer = IoCContainer.getContainer();
        let customLogger = new NodeRedTransport(server);
        let logger = myContainer.get<i4Logger>(i4Logger);
        logger.logger.add(customLogger);
        let persistence = new TokenFlowPersistentService(server.context());
        myContainer.bind("ITokenPersistentService").toConstantValue(persistence);
        let connector = myContainer.get<ConnectorFacade>(ConnectorFacade);

        try {
            await connector.connect(host, pollInterval, username, password, 3);
            res.json(await connector.getSignalDefinitions(signals, count, start));
            await connector.disconnect();
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        } finally {
            persistence.dispose();
            logger.logger.remove(customLogger);
        }
    });
};


