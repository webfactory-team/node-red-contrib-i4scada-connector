import { UserDTO } from "./user.dto";

export interface AccountDTO extends UserDTO {
    ClientHostName: string;
    DomainName: string;
    AuthorizationGroups: string[];
}