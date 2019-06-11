import { DTO } from "./dto.model";

export interface LogDTO extends DTO {
    LogTag: string;
    Description: string;
    Active: boolean;
}
