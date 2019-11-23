import { SignalDTO } from "./signal.dto";
import { NameDTO } from "./name.dto";
import { TranslatableDTO } from "./translatable.dto";

export interface AlarmDefinitionDTO extends TranslatableDTO {

    Signal: SignalDTO;
    Tag: string;
    Active: boolean;
    Type: TranslatableDTO;
    Group: TranslatableDTO;
    Cond: NameDTO;
    Replace: number;
    Prio: number;
    PLCOn: number;
    PLCSignal: SignalDTO;
    PLCValue?: number;
    Link: string;
    Online: boolean;
    ExecScript: boolean;
    ScriptPath: string;
    EnableLP: boolean;
    Symbol: number;
    Status: number;
    ReactTime: Date;
    Suppression: number;
    DeactivationSignal: SignalDTO;

    RSig1: SignalDTO;
    RSig2: SignalDTO;
    RSig3: SignalDTO;
    RSig4: SignalDTO;
    RSig5: SignalDTO;
    RSig6: SignalDTO;
    RSig7: SignalDTO;
    RSig8: SignalDTO;
    RSig9: SignalDTO;
    RSig10: SignalDTO;
    RSig11: SignalDTO;
    RSig12: SignalDTO;
    RSig13: SignalDTO;
    RSig14: SignalDTO;
    RSig15: SignalDTO;
    RSig16: SignalDTO;
    RSig17: SignalDTO;
    RSig18: SignalDTO;
    RSig19: SignalDTO;
    RSig20: SignalDTO;

    Cause: TranslatableDTO;
    Effect: TranslatableDTO;
    Repair: TranslatableDTO;
    Ep1: string;
    Ep2: string;
    Ep3: string;
    Ep4: string;
    Ep5: string;
    Ep6: string;
    Ep7: string;
    Ep8: string;
    Ep9: string;
    Ep10: string;
    Ep11: string;
    Ep12: string;
    Ep13: string;
    Ep14: string;
    Ep15: string;
    Ep16: string;
    Ep17: string;
    Ep18: string;
    Ep19: string;
    Ep20: string;
    Ep21: string;
    Ep22: string;
    Ep23: string;
    Ep24: string;
    Ep25: string;
    Ep26: string;
    Ep27: string;
    Ep28: string;
    Ep29: string;
    Ep30: string;
    Ep31: string;
    Ep32: string;

    NavSrc: string
    NavTarget: string
    Comment: string
    Custom: boolean;
    I4Enabled: boolean;
}