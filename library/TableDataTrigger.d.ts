import { CTableData, IUITableData, tabledata_column } from "./TableData.js";
import { edit } from "./TableDataEdit.js";
export declare const enum enumReason {
    Edit = 1,
    Browser = 2,
    Command = 4
}
/**
 * Triggers - constant number to know the event type.
 */
export declare const enum enumTrigger {
    BEGIN = 0,
    Unknown_ = 0,
    BeforeCreate_ = 1,
    AfterCreate_ = 2,
    BeforeDestroy_ = 3,
    AfterDestroy_ = 4,
    BeforeLoadNew_ = 5,
    AfterLoadNew_ = 6,
    BeforeLoad_ = 7,
    AfterLoad_ = 8,
    BeforeValidateValue_ = 9,
    BeforeSetValue_ = 10,
    AfterSetValue_ = 11,
    BeforeSelect_ = 12,
    AfterSelect_ = 13,
    BeforeSetRange_ = 14,
    AfterSetRange_ = 15,
    BeforeSetRow_ = 16,
    AfterSetRow_ = 17,
    BeforeSetSort_ = 18,
    AfterSetSort_ = 19,
    BeforeRemoveRow_ = 20,
    AfterRemoveRow_ = 21,
    BeforeSetCellError_ = 22,
    AfterSetCellError_ = 23,
    OnSetValueError_ = 24,
    OnResize_ = 25,
    UpdateDataNew = 26,
    UpdateData = 27,
    UpdateRowNew = 28,
    UpdateRowDelete = 29,
    UpdateRow = 30,
    UpdateCell = 31,
    LAST_EVENT = 32,
    MASK = 65535,
    TRIGGER_BEFORE = 65536,
    TRIGGER_AFTER = 131072,
    TRIGGER_ON = 262144,
    BeforeCreate = 65537,
    AfterCreate = 65538,
    BeforeDestroy = 65539,
    AfterDestroy = 131076,
    BeforeLoadNew = 65541,
    AfterLoadNew = 131078,
    BeforeLoad = 65543,
    AfterLoad = 131080,
    BeforeValidateValue = 65545,
    BeforeSetValue = 65546,
    AfterSetValue = 131083,
    BeforeSelect = 65548,
    AfterSelect = 131085,
    BeforeSetRange = 65550,
    AfterSetRange = 131087,
    BeforeSetRow = 65552,
    AfterSetRow = 131089,
    BeforeSetSort = 65554,
    AfterSetSort = 131091,
    BeforeRemoveRow = 65556,
    AfterRemoveRow = 131093,
    BeforeSetCellError = 65558,
    AfterSetCellError = 131095,
    OnResize = 262169
}
/**
 * Event object for events sent from ui table data items
 *
 */
export declare type EventDataTable = {
    column?: tabledata_column;
    data?: CTableData;
    dataUI?: IUITableData;
    iEvent?: number;
    iEventAll?: number;
    edit?: edit.CEdit;
    eElement?: HTMLElement;
    iReason?: number;
    information?: unknown;
    browser_event?: string;
};
declare namespace details {
    type construct = {
        table?: CTableData;
        trigger?: ((e: EventDataTable, data: any) => boolean | void) | ((e: EventDataTable, data: any) => boolean | void)[];
    };
}
export declare class CTableDataTrigger {
    m_acallTrigger: ((e: EventDataTable, _data: any) => boolean | void)[];
    m_aTrigger: boolean[];
    m_oTableData: CTableData;
    m_oRS: any;
    /**
     * Each trigger has a type and that is a number. With `s_aTriggerName` trigger numbers can set a name for each event.
     */
    static s_aTriggerName: string[];
    static GetTriggerNumber(sName: string): number;
    static GetTriggerName(iTrigger: number): string;
    static SetTriggerName(aName: string[] | [number, string][]): void;
    constructor(options: details.construct);
    /**
     * Get table data object that manages table data logic
     */
    get data(): CTableData;
    Call(aTrigger: number[]): number[];
    Enable(_Trigger: number | number[], bEnable: boolean): void;
    /**
     *
     * @param aTrigger
     * @param iReason
     * @param aArgument
     * @param callback
     */
    Trigger(iTrigger: number, e: EventDataTable, aArgument: any | any[], callback?: (any: any) => any): boolean;
    Trigger(aTrigger: number[], e: EventDataTable, aArgument: any | any[], callback?: (any: any) => any): boolean;
    /**
     *
     * @param aTrigger
     * @param iReason
     * @param _Argument
     */
    TriggerOn(aTrigger: number[], e: EventDataTable, _Argument: any | any[]): boolean;
    TriggerUpdate(iTrigger: any): void;
    /**
     * Set value to table data
     * @param {EventDataTable} e event data
     * @param {any[]} aArgument data sent to callbacks
     * @param _Row row where value is to update
     * @param _Column column value is that is updated
     * @param value value set
     * @param bRaw if row and column index is exact position in table data (no calculation is done to get posotion)
     */
    CELLSetValue(e: EventDataTable, aArgument: any[], _Row: any, _Column: any, value?: unknown, bRaw?: boolean): boolean;
    ObserveResize(_1: any, bAdd?: boolean): void;
    /**
     * Get ui objects connected to root element.
     * @param eRoot
     * @param bDeep
     */
    GetUIObjectsFromElement(eRoot: HTMLElement, bDeep?: boolean): unknown[];
    private _event;
}
export {};
