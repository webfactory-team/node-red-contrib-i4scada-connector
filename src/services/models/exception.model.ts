export interface Exception {
    data: any;
    helpLink: string;
    hResult: number;
    innerException: Exception;
    message: string;
    source: string;
    stackTrace: string;
    targetSite: any;
}
