export interface FunctionResultDTO<T> {
    Result: T;
    ErrorCodes: number[];
    Succeeded: boolean;
}