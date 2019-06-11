import { SessionDTO } from "./session.dto";

export interface SecuritySessionDTO {
    Session: SessionDTO;
    SecurityToken: string;
}