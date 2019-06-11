import { ProjectAuthorizationDTO } from "./project-authorization.dto";
import { SystemAuthorizationDTO } from "./system-authorization.dto";

export interface UserAuthorizationInfo {
    ProjectAuthorizations: ProjectAuthorizationDTO[];
    SystemAuthorizations: SystemAuthorizationDTO[];
}