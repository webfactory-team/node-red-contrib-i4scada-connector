import { KeyValuePair } from "../key-value-pair.model";

export interface SignalUpdateDTO {
    ResponseId: number;
    Updates: KeyValuePair<string, any>[];
}