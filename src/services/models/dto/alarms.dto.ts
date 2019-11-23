import { AlarmDTO } from "./alarm.dto";

export interface AlarmsDTO {
    Alarms: AlarmDTO[];
    HasMore: boolean;
    IdentityNumber: number;
    RowNumber: number;
}
