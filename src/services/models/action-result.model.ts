import { Exception } from "./exception.model";

export interface ActionResult {
    errorMessage: string;
    exception: Exception;
    successful: boolean;
}
