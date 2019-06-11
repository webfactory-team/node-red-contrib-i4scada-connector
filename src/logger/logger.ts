import { createLogger, format } from "winston";
import Transport from 'winston-transport';
import { injectable } from "inversify";

export class NodeRedTransport extends Transport {

    constructor(private readonly logger: any) {
        super();
    }

    public log(info: any, next: () => void) {
        setImmediate(() => {
            switch (info["level"]) {
                case "error":
                    this.logger.log(info["message"]);
                    break;
                case "warn":
                    this.logger.warn(info["message"]);
                    break;
                case "debug":
                    this.logger.debug(info["message"]);
                    break;
                case "trace":
                    this.logger.trace(info["message"]);
                    break;
                default:
                    this.logger.log(info["message"]);
                    break;
            }
        });
        next();
    }
}

@injectable()
export class i4Logger {
    public readonly logger = createLogger({
        level: 'info',
        format: format.simple(),
        transports: [
        ]
    });
}
