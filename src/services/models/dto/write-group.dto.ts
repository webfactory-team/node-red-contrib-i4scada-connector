import { DescriptionDTO } from "./description.dto";

export interface WriteGroupDTO extends DescriptionDTO {
    Version: number;
    RestrictedAccess: boolean;
}