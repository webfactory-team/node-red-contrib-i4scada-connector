import "reflect-metadata";
export = function (RED) {
    "use strict";

    function Configuration(n) {
        RED.nodes.createNode(this, n);
        this.host = n.host;
        this.pollInterval = n.pollInterval;


        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            this.password = this.credentials.password;
        }

        if (this.credentials && this.credentials.hasOwnProperty("username")) {
            this.username = this.credentials.username;
        }

        RED.nodes.addCredentials(n.id, { username: this.username, password: this.password, global: true });

    }

    RED.nodes.registerType("configuration", Configuration, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });


};


