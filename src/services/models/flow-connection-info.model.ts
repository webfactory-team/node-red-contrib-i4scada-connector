export class FlowConnectionInfo {
    constructor(
        public url: string = "http://localhost",
        public pollInterval: number = 500,
        public userName: string = null,
        public password: string = null) {
    }
}