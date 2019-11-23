import { DTO } from "./dto.model";

export interface TranslatableDTO extends DTO {
    SymbolicTextName: string;
    SymbolicTextTranslation: string;

}