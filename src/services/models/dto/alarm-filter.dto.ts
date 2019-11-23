import { ServerSortOrder } from "./server-sort-order.model";
import { AlarmStatusFilter } from "./alarm-status-filter.model";
import { MSDateTimeOffset } from "./ms-date-time-offset.model";
import { FilterColumnType } from "./filter-column-type.model";

export interface AlarmFilterDTO {
    LanguageID: number;
    TimeZoneID: string;
    AlarmGroups: string[];
    AlarmTypes: string[];
    MinimumPriority: number;
    MaximumPriority: number;
    SortOrder: ServerSortOrder;
    MaxRowCount: number;
    AlarmStatusFilter: AlarmStatusFilter;
    StartTime: MSDateTimeOffset;
    EndTime: MSDateTimeOffset;
    Column: FilterColumnType;
    ColumnFilters: string[];
    FilterAlarmGroupsByUser: boolean;
    UserName: string;
    IdentityNumber: number;
    RowNumber: number;
}