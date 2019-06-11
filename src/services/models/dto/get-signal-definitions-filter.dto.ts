import { SignalDefinitionResultsFilter } from "./signal-definition-results-filter.model";

export interface GetSignalDefinitionsFilterDTO {
    ServerNames: string[];
    AliasNames: string[];
    LogTags: string[];
    ResultsFilter: SignalDefinitionResultsFilter;
}