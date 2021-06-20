/// <reference path="TableData.d.ts" />
import { CTableData, tabledata_column } from "./TableData";
export declare const enum enumInputState {
    Open = 1,
    Canceled = 2,
    Element = 4,
    Listener = 8
}
declare namespace details {
    type construct_edits = {
        support?: HTMLElement;
        table?: CTableData;
    };
    type construct_edit = {
        column: tabledata_column;
        edits: edit.CEdits;
        name: string;
        position?: [number, number];
        state: number;
    };
    type value_stack = [
        [
            number,
            number
        ],
        [
            number,
            number
        ],
        unknown,
        unknown
    ];
}
export declare namespace edit {
    /**
     * Singleton class with registered edit controls
     */
    class CEditors {
        private static _instance;
        m_aControl: [string, any][];
        private constructor();
        static GetInstance(): CEditors;
        Add(sName: string, oEdit: any): void;
        Add(aControl: [string, any][]): void;
        GetEdit(sName: string): any;
        _get_edit(sName: string): any;
    }
    /**
     *
     */
    class CEdits {
        m_oEditActive: CEdit;
        m_aColumn: CEdit[];
        m_aEditControl: {
            name: string;
            control: CEdit;
        };
        m_eSupportElement: HTMLElement;
        m_oTableData: CTableData;
        constructor(options?: details.construct_edits);
        /**
         * Get edit item for column
         * @param {number} iColumn index to column, this index should match column in table data
         */
        GetEdit(iColumn: number): edit.CEdit;
        GetEdit(eInput: HTMLElement): edit.CEdit;
        GetEdit(aCell: [number, number]): edit.CEdit;
        Initialize(bCreate?: boolean, eSupportElement?: HTMLElement): void;
        /**
         * Activate edit for column index or name
         * @param iRow index to row in table data, this is the physical index
         * @param iColumn physical index to column, value
         * @param eElement
         */
        Activate(iRow: number, iColumn: number, eElement: HTMLElement, bDeactivate?: boolean): boolean;
        Activate(aPosition: [number, number], eElement: HTMLElement, bDeactivate?: boolean): boolean;
        Activate(aPositionAndRelative: [number, number, number, number], eElement: HTMLElement, bDeactivate?: boolean): boolean;
        Deactivate(_Column?: boolean | number, callIf?: ((aNewValue: details.value_stack, CEdit: any) => boolean)): number;
        /**
         * Get table data object that manages table data logic
         */
        get data(): CTableData;
        set data(table: CTableData);
    }
    /**
     *
     */
    abstract class CEdit {
        m_oColumn: tabledata_column;
        m_oEdits: CEdits;
        m_eElement: HTMLElement;
        m_sName: string;
        m_aMoveKey: number[];
        m_sOldParentPosition: string;
        m_sOldValue: string;
        m_aPosition: [number, number];
        m_aPositionRelative: [number, number];
        m_iState: number;
        constructor(o: details.construct_edit);
        get element(): HTMLElement;
        get column(): tabledata_column;
        get data(): CTableData;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        Create(sTagName: string, eParent: HTMLElement): HTMLElement;
        Create(eParent: HTMLElement): HTMLElement;
        Create(sTagName: string, eParent: HTMLElement): HTMLElement;
        /**
         * Set keys that is passed over for movement or if undefefined keys are reset to tab and enter.
         * @param {number[]} [aKey] Keys used to pass over to component for movement
         */
        SetMoveKey(aKey?: number[]): void;
        SetListener(): void;
        Compare(e: HTMLElement): boolean;
        Compare(aRelative: [number, number]): boolean;
        Open(eParent: HTMLElement, sValue?: string, oPosition?: DOMRect): void;
        GetPosition(): [number, number];
        GetPositionRelative(): [number, number];
        GetValue(bUpdate?: boolean): string | unknown;
        GetValueStack(): details.value_stack;
        SetValue(_value: any): void;
        IsElement(): boolean;
        IsListener(): boolean;
        IsModified(): boolean;
        IsOpen(): boolean;
        /**
         * Ask if key is used to move from edit
         * @param  {number}  iKey number for key
         * @return {boolean}  true if key is valid move key
         */
        IsMoveKey(iKey: number, e?: any): boolean;
        SetClose(): void;
        SetFocus(): void;
        Close(eSupport?: HTMLElement): void;
        Destroy(): void;
        _update_old_value(): void;
    }
    class CEditInput extends CEdit {
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLInputElement;
        GetValueStack(): details.value_stack;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        SetValue(_Value: unknown): void;
        IsModified(): boolean;
    }
    class CEditNumber extends CEdit {
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLInputElement;
        GetValueStack(): details.value_stack;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        SetValue(_Value: unknown): void;
        IsModified(): boolean;
    }
    class CEditPassword extends CEdit {
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLInputElement;
        GetValueStack(): details.value_stack;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        SetValue(_Value: unknown): void;
    }
    class CEditCheckbox extends CEdit {
        m_iSelected: number;
        m_iOldSelected: number;
        m_aValue: [unknown, unknown];
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLInputElement;
        /**
         * Open checkbox in table
         * @param eParent
         * @param sValue
         * @param oPosition
         */
        Open(eParent: HTMLElement, sValue?: string, oPosition?: DOMRect): void;
        GetValue(bUpdate?: boolean): string | unknown;
        GetValueStack(): details.value_stack;
        IsModified(): boolean;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        /**
         * Specialization for INPUT[type=checkbox]. It is using the checked attribute and therefore differs from normal INPUT elements.
         * @param {unknown} _Value
         */
        SetValue(_Value: unknown): void;
    }
    class CEditSelect extends CEdit {
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLSelectElement;
        GetValue(bUpdate?: boolean): string | unknown;
        GetValueStack(): details.value_stack;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        SetValue(_Value: unknown): void;
    }
    class CEditTextarea extends CEdit {
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLInputElement;
        GetValueStack(): details.value_stack;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        SetValue(_Value: unknown): void;
        IsMoveKey(i: number, e?: any): boolean;
    }
    class CEditRange extends CEdit {
        constructor(o: details.construct_edit);
        Create(_1: any): HTMLInputElement;
        GetValueStack(): details.value_stack;
        SetPosition(aPosition: [number, number], aPositionRelative?: [number, number]): void;
        SetValue(_Value: unknown): void;
        Open(eParent: HTMLElement, sValue?: string, oPosition?: DOMRect): void;
    }
}
export {};
