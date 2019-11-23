import { AlarmDefinitionDTO } from "./alarm-definition.dto";

export interface AlarmDefinitionsDTO {
    Definitions: AlarmDefinitionDTO[];
    HasMore: boolean;
}
