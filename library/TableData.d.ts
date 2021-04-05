export declare const enum enumFormat {
    Raw = 1,
    Format = 2,
    All = 4
}
export declare enum enumReturn {
    Value = 0,
    Array = 1
}
export declare const enum enumMove {
    validate = 0,
    left = 1,
    right = 2,
    up = 4,
    down = 8,
    page_up = 16,
    page_down = 32,
    begin = 64,
    disable = 128,
    end = 256
}
export declare const enum enumValueType {
    unknown = 0,
    i1 = 65537,
    i1Bool = 65793,
    i2 = 65538,
    i4 = 65539,
    i8 = 65540,
    u1 = 65541,
    u2 = 65542,
    u4 = 65543,
    u8 = 65544,
    r4 = 196618,
    r8 = 196619,
    str = 262160,
    blobstr = 262161,
    utf8 = 262162,
    ascii = 262163,
    bin = 524320,
    blob = 524321,
    file = 524322,
    datetime = 1048624,
    date = 1048625,
    time = 1048626,
    group_boolean = 256,
    group_number = 65536,
    group_real = 131072,
    group_string = 262144,
    group_binary = 524288,
    group_date = 1048576
}
export declare namespace browser {
    function AddCSS(sCSS: string): void;
}
export interface IUITableData {
    id: string;
    name: string;
    data: CTableData;
    update: ((iType: number) => any);
}
declare namespace details {
    type format = {
        convert?: ((value: unknown, aCell: [number, number]) => unknown);
        const?: number | boolean;
        html?: string | number | boolean;
        max?: number;
        min?: number;
        pattern?: string | string[];
        required?: number;
        verify?: string | ((value: string) => boolean);
    };
    type type = {
        group?: string;
        type?: number;
        name?: string;
    };
    type position = {
        col?: number;
        convert?: ((value: unknown, aCell: [number, number]) => unknown);
        hide?: number | boolean;
        index?: number;
        page?: number;
        row?: number;
    };
    /**
     * column type describes each property for columns in table (or form) data
     * */
    type column = {
        alias?: string;
        edit?: {
            name?: string;
            edit?: boolean | number;
            element?: boolean | number;
        };
        extra?: any;
        format?: details.format;
        id?: string;
        list?: [string | number, string | number][];
        key?: {
            key?: number;
            fk?: number;
        };
        name?: string;
        style?: {
            [key: string]: string;
        };
        position?: details.position;
        rule?: {
            no_sort?: boolean;
        };
        simple?: string;
        state?: {
            sort?: number;
            sorted?: number;
        };
        title?: string;
        type?: details.type;
        value?: string;
    };
    type construct = {
        body?: unknown[][];
        column?: details.column[];
        dirty_row?: number[];
        external?: object;
        footer_size?: number;
        header_size?: number;
        id?: string;
        name?: string;
        page?: number;
        trigger?: ((iTrigger: number, iReason: number, _data: any) => boolean)[];
    };
}
export declare type tabledata_column = details.column;
export declare type tabledata_format = details.format;
export declare type tabledata_position = details.position;
/**
 *
 * */
export declare class CTableData {
    m_aBody: unknown[][];
    m_aColumn: details.column[];
    m_aColumnIndex?: number[];
    m_aDirtyRow?: number[];
    m_oExternal: any;
    m_aFooter?: unknown[][];
    m_iFooterSize: number;
    m_aHeader?: unknown[][];
    m_iHeaderSize?: number;
    m_aHistory: [number, number, unknown][];
    m_sId: string;
    m_sName: string;
    m_iNextKey: number;
    m_iPage?: number;
    m_aUITable?: [string, IUITableData][];
    static s_iIdNext: number;
    /**
     * Default column options. Changing this will change them globally
     */
    static s_oColumnOptions: {
        alias: any;
        edit: {};
        extra: any;
        format: {};
        id: any;
        key: {};
        name: any;
        style: {};
        position: {};
        simple: any;
        title: any;
        rule: {};
        state: {};
        type: {};
        value: any;
    };
    static s_aJsType: [string, enumValueType][];
    static s_aType: [string, enumValueType][];
    /**
     * Return value type number or type name based on argument
     * @param  {number|string} _T If string then return number for type, if number then return type name
     * @return {number|string} type name or type number
     * @throws {string} information about type if type isn't found
     */
    static GetType(_T: number | string): number | string;
    /**
     * Return internal type number for standard javascript type names
     * @param {string} sType javascript type name
     */
    static GetJSType(_Type: string | number): enumValueType | string;
    static ConvertValue(_Value: unknown, eType?: enumValueType): unknown;
    static StripIndex(a: [string | number, unknown][]): unknown[];
    /**
     * Validate value
     * @param {unknown} _Value value to validate against rules in format
     * @param oFormat
     */
    static ValidateValue(_Value: unknown, oFormat: details.format | details.column, eType?: enumValueType): boolean | [boolean | unknown, (string | string[] | unknown)?];
    constructor(options?: details.construct);
    /**
     * Return id
     */
    get id(): string;
    /**
     * access external object
     */
    get external(): any;
    /**
     * Return raw body of data. Only use this if you know how table data works internally
     */
    get body(): unknown[][];
    /**
     * Return array with rows and if specified another array with row numbers
     * @param oOptions
     * @param {number} [oOptions.begin] index to start row where to  begin to collect internal data
     */
    GetData(oOptions?: {
        begin?: number;
        end?: number;
        max?: number;
        page?: number;
        sort?: [number, boolean, string?][];
        hide?: number[];
    }): [unknown[][], number[]];
    /**
     * Wrapper method to get values from selected column, uses `GetData` to collect values
     * @param {number} iColumn index to column
     * @param oOptions
     */
    GetColumnData(iColumn: number, oOptions?: {
        begin?: number;
        end?: number;
        max?: number;
        page?: number;
        sort?: [number, boolean, string?][];
        hide?: number[];
    }): unknown[];
    GetDataForKeys(aKey?: number[], aColumn?: number[]): unknown[][];
    /**
     * Compare values in cell or cells identified by row and column or range
     * @param  {number} iRow key for row in source array, if row is -1 then count found values in all rows for column
     * @param  {number|string} _Column index or column name to column value is set to
     * @param  {unknown} value value set to cell
     * @param  {boolean} bRaw if raw value cell value from raw row is set
     */
    CountValue(aRange: [iR: number, _C: string | number], value: unknown, iReturn?: enumReturn): number | number[];
    CountValue(iRow: number, _Column: string | number, value: unknown, bRaw?: boolean): number | number[];
    CountValue(aRange: [iR: number, _C: string | number], value: unknown, bRaw?: boolean): number | number[];
    CountValue(aRange: [iR1: number, _C1: string | number, iR2: number, _C2: string | number], value: unknown, bRaw?: boolean): number | number[];
    /**
     * Insert column to table. Adds column information and cell/cells at position in rows
     * @param {number|string} _WhereColumn
     * @param {unknown|unknown[]} [_Value] value or array of value inserted at position
     * @param {number} [iCount] Number of columns inserted, default is 1
     */
    InsertColumn(_WhereColumn: number | string, _Value?: unknown | unknown[], iCount?: number): details.column[];
    /**
     * Read array information into table data. If table is empty the default is to create columns and
     * names for each column are taken from first row.
     * @param {unknown[][]} aData array with rows where each row is an array of values
     * @param {object} oOptions configure reading
     * @param {number} [oOptions.begin] start row, where to begin reading data, if not set then start from second row (first is column names)
     * @param {number} [oOptions.end] end row, where to stop reading data, if not set then it reads all rows from aData
     */
    ReadArray(aData: unknown[][], oOptions?: {
        begin?: number;
        end?: number;
    }): void;
    /**
     * Read object data
     * @param aList
     * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
     */
    ReadObjects(aList: object[]): [number, number];
    /**
     * @param  {number[]} [aMatch] Recalculate column positions
     * Return `CRowRows` object that has raw data on how to design row values.
     */
    GetRowRows(aMatch?: number[] | boolean, bRaw?: boolean): CRowRows;
    Sort(aBody: unknown[][]): void;
    /**
     * Check if any or selected row is dirty (dirty = values are modified)
     * @param {number} [iIndex] Index to row that is checked if dirty
     * @returns {boolean} true if row is dirty when row is specified, or if no row is specified than returns true if any row is dirty. Otherwise false
     */
    IsDirty(iIndex?: number): boolean;
    /**
     * Validate cords to be within table bounds
     * @param iR
     * @param _C
     */
    ValidateCoords(iR: number, _C: number | string): boolean;
    /**
     * Clear internal data, everything that is data related that is.
     */
    ClearData(): void;
    /**
     * Append user interface object that is using data from table data
     * @param oUI object that is added, it has to have getters for "id" and "name" values, these are used to get UI from table data
     */
    UIAppend(oUI: object): number;
    /**
     * Append user interface object that is using data from table data
     * @param sName
     * @param oUI object that is added, it has to have getters for "id" and "name" values, these are used to get UI from table data
     */
    UIAppend(sName: string, oUI: object): number;
    /**
     * Get ui object for name, this is the name associated with object in internal list
     * @param sName
     */
    UIGet(iIndex: number): object;
    UIGet(sName: string): object;
    UIGet(): [string, object][];
    /**
     * Return connected ui object for id
     * @param sId id for ui object. All ui objects need a get method called `id` that returns unique id for it.
     */
    UIGetById(sId: string): object | [string, object][];
    UILength(): number;
    /**
     * Append column or columns to table data
     * @param {unknown | unknown[]} _Column column data added to table data. if column is sent as string it is treated as column name
     * @param {((_C: unknown[], _Empty: details.column[]) => details.column[])} [callConvert] Callback method if column need to reformatting to adapt to table data format
     */
    COLUMNAppend(_Column: unknown | unknown[], callConvert?: ((_C: unknown[], _Empty: details.column[]) => details.column[])): number;
    /**
     * Insert column or columns at specified position
     * @param {number | string} _WhereColumn Where columns are inserted
     * @param {number} [iCount] number of columns inserted at position
     * @param {boolean} [bRaw] if true then position is exact index for column in table data
     */
    COLUMNInsert(_WhereColumn: number | string, iCount?: number, bRaw?: boolean): details.column[];
    /**
     * Get column object for index or name
     * @param {number | string} _Index return column object for index or name
     * @param {boolean} [bNull] If true and index to column isn't found then return null. Otherwise undefined behavior if column isn't found
     * @param {boolean} [bRaw] if true then position is exact index for column in table data
     */
    COLUMNGet(_Index: number | string, bNull?: boolean, bRaw?: boolean): details.column;
    /**
     * Update matching index for objects that uses table data based on property values that marks columns as hidden or disabled
     * @param {boolean} [bInternal] If true update m_aColumnIndex to set the column order when order do not match the physical order for columnd
     */
    COLUMNUpdatePositionIndex(bInternal?: boolean): void;
    /**
     * Count columns and return how many.
     * This can also count column with properties, like how many key columns there are.
     * The property sent is name for object property that is investigated. Some properties have child object so the syntax for finding a key is
     * "key.key". Another sample is to find position and in child object we want page. Then the property name is "position.name".
     * @param {string} [sProperty] property name, if child property remember the format is "property.property"
     * @param {string|number} [_Value] Value to compare with if specified values are counted
     */
    COLUMNGetCount(sProperty?: string, _Value?: string | number): number;
    /**
     * Returns selected property value from column or columns.
     * Each column holds a number of property values. With this function you can get any of them.
     * @param {boolean}  _Index if true return property value for all columns in array
     * @param {number}   _Index index to column property is returned for, property is returned as value
     * @param {string}   _Index id or name to column property is returned for, property is returned as value
     * @param {number[]} _Index index array to columns properties is returned for, property for columns is returned as array
     * @param {string[]} _Index id or name array to columns properties is returned for, property for columns is returned as array
     * @param {string} _Property property name, if child property remember the format is "property.property"
     * @param {string[]} _Property property names, return multiple properties
     * @param {boolean} [bRaw] Index for column will use direct index in internal column array.
     */
    COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], bRaw?: boolean): unknown | [string | number, unknown][];
    COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], bRaw: boolean, callIf: ((column: details.column) => boolean)): unknown | [string | number, unknown][];
    COLUMNGetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], callIf: ((column: details.column) => boolean)): unknown | [string | number, unknown][];
    COLUMNGetIndexForPropertyValue(sProperty: string, _Value?: unknown): number[];
    static GetPropertyValue(aSource: any, _Index: boolean | number | string | number[] | string[], _Property: string | string[], _Raw?: boolean | ((value: string | number) => any)): unknown | [string | number, unknown][];
    /**
     * check if property value exists in column properties
     * @param {boolean | number | string | number[] | string[]} _Index index to columns that are checked
     * @param _Property
     * @param _Value
     */
    COLUMNHasPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], _Value?: unknown | unknown[]): boolean;
    static HasPropertyValue(aSource: any, bAll: boolean, _Property: string | string[], _Value?: unknown | unknown[]): boolean;
    static HasPropertyValue(aSource: any, _Index: number | string, _Property: string | string[], _Value?: unknown | unknown[]): boolean;
    static HasPropertyValue(aSource: any, aIndex: number[] | string[], _Property: string | string[], _Value?: unknown | unknown[]): boolean;
    /**
     * Set property value for column
     * @param {boolean|number|string|number[]} _Index index or name for column that you want to set
     * @param {string | string[]} _Property property name, if child property remember the format is "property.property"
     * @param {unknown} _Value value set to property, if array then each array value are matched to column setting multiple column properties
     * @param {boolean} [bRaw] Index for column will use direct index in internal column array.
     * @returns {unknown} old property value
     */
    COLUMNSetPropertyValue(_Index: boolean | number | string | number[] | string[], _Property: string | string[], _Value: unknown, _Raw?: boolean): unknown | unknown[];
    /**
     * Set property value for item or items in array
     * @param {TYPE[]} aTarget index or name for column that you want to set
     * @param {boolean|number|string|number[]} _Index index or name for column that you want to set
     * @param {string | string[]} _Property property name, if child property remember the format is "property.property"
     * @param {unknown} _Value value set to property, if array then each array value are matched to column setting multiple column properties
     * @param {boolean} [bRaw] Index for column will use direct index in internal column array.
     * @returns {unknown} old property value
     */
    static SetPropertyValue<TYPE>(aTarget: TYPE[], _Index: boolean | number | number[] | string[], _Property: string | string[], _Value: unknown): unknown | unknown[];
    /**
     * Set type for columns based on value types in array:
     * Remember to take array with values that match number of values in each row.
     * @param aType array with values that types are extracted from
     */ /**
    * Set type for specified column
    * @param {number} iIndex index to column type is set to
    * @param {unknown|details.type} _Type Column type, if single value function tries to figure out what type it is
    */
    COLUMNSetType(aType: unknown[]): any;
    COLUMNSetType(iIndex: number, _Type: unknown | details.type): any;
    COLUMNSetType(sName: string, _Type: unknown | details.type): any;
    /**
     * Get value in cell
     * @param  {number} iRow index for row in source array
     * @param  {number|string} _Column index or key to column value
     * @param  {number} [iFormat] if raw value cell value from raw row is returned
     */
    CELLGetValue(iRow: number, _Column: string | number, iFormat?: number): unknown;
    /**
     * Set value in cell
     * @param  {number} iRow key for row in source array
     * @param  {number|string} _Column index or column name to column value is set to
     * @param  {unknown} value value set to cell
     * @param  {boolean} bRaw if raw value cell value from raw row is set
     */
    CELLSetValue(iRow: number, _Column: string | number, value: unknown, bRaw?: boolean): void;
    CELLSetValue(aRange: [iR: number, _C: string | number], value: unknown, bRaw?: boolean): void;
    CELLSetValue(aRange: [iR1: number, _C1: string | number, iR2: number, _C2: string | number], value: unknown, bRaw?: boolean): void;
    /**
     * Is value in cell array or a primitive, if array then this return true
     * @param  {number} iRow key for row in source array
     * @param  {number|string} _Column index or name for column where value is checked for array value
     * @param  {boolean} bRaw if raw then iRow access index in internal source array (not row key)
     */
    CELLIsArray(iRow: number, _Column: string | number, bRaw?: boolean): boolean;
    /**
     * Get number of rows in table
     * @param {boolean} [bRaw] if raw then return all rows in internal body, otherwise header and footer rows are subtracted
     */
    ROWGetCount(bRaw?: boolean): number;
    /**
     * Return internal physical index to row
     * @param iRow key to row that physical index is returned for
     */
    ROWGetRowIndex(iRow: number): number;
    /**
     * Return values for row as array
     * @param iRow key to row or if bRay it is the physical index
     * @param bRaw if true then access internal row
     */
    ROWGet(iRow: number, bRaw?: boolean): unknown[];
    /**
     * Set values to cells in row. Using this you need to know the internal data. No checking is done
     * @param {number} iRow Index to row where column values are set
     * @param {unknown} [_Value] Value set to row cells
     * @param {boolean} [bRaw] if raw position in internal data is used, if not true then `iRow` is the row index
     */
    ROWSet(iRow: number, _Value?: unknown, bRaw?: boolean): void;
    ROWSet(iRow: number, aValue: unknown[], bRaw?: boolean): void;
    /**
     * Append rows to table. Added rows will always add one more compared to number of columns. First rows holds index number for row.
     * @param {number | unknown[] | unknown[][]} _Row number of rows, or array of values added to row
     * @param {boolean} [bRaw] if true then add to body without calculating position
     * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
     */
    ROWAppend(_Row?: number | unknown[] | unknown[][], bRaw?: boolean): [number, number];
    /**
     *
     * @param {number} iRow row position  where to insert new rows
     * @param _Row
     * @returns [number,number] keys to added rows, first key and first and one more than last key for added rows
     */
    ROWInsert(iRow: number, _Row?: number | unknown[] | unknown[][]): [number, number];
    ROWRemove(iRow: number, iLength?: number): unknown[];
    /**
     * Expands each row in table with 1 or more columns
     * @param {number} iCount number of columns to expand
     * @param {unknown} [_Value] if expanded columns has default value
     * @param {number|string} [_Where] position in row where new values are inserted
     */
    ROWExpand(iCount?: number, _Value?: unknown, _Where?: number | string): void;
    /**
     * Set row as dirty (dirty = modified)
     * @param iKey key to row that is set as dirty
     * @returns number of dirty rows
     */
    DIRTYSet(iKey: number): number;
    DIRTYRemove(iKey: number): void;
    HISTORYPush(_Row: number | [number, number | string], _Column: string | number): void;
    HISTORYPop(_1?: any, _2?: any): boolean;
    /**
     * Convert data to XML
     * @param {unknown[][]} aBody data that is converted to XML
     * @param oOptions
     * @param {number} [oOptions.insert] array with column indexes that is added to xml, indexes are physical indexes
     * @param doc
     */
    XMLGetData(aBody: unknown[][], oOptions: {
        insert?: number[];
        columns?: details.column[];
        values?: string;
        value?: string;
    }, doc?: XMLDocument): XMLDocument;
    /**
     *
     * @param aTrigger
     * @param iReason
     * @param aArgument
     * @param callback
     */
    /**
     *
     * @param iCount
     * @param oColumn
     */
    _create_column(iCount?: number, oColumn?: details.column | object): details.column[];
    /**
     * Get column object for index
     * @param {number|string} _Index index to column data returned
     */
    _column(_Index: number | string): details.column;
    _row(iKey: number): number;
    /**
     * Return index to column in `m_aColumn` where column information is found
     * @param {number|string} _Index index that is converted to index in `m_aColumnIndex`
     */
    _index(_Index: number | string): number;
    /**
     * Return (ui) index from raw column index. UI index is index for object that uses table data to store data
     * @param iIndex raw column index in `m_aColumn`
     */
    _index_in_ui(iIndex: number): number;
    /**
     * Get physical coordinates for cell in body data
     * @param iRow key for row in source array
     * @param  {number|string} _Column index or key to column value
     * @param bRaw {boolean} if raw value cell value from raw row is returned
     */
    _get_cell_coords(iRow: number, _Column: string | number, bRaw?: boolean): [number, number];
    _validate_coords(iR: number, iC: number): boolean;
    /**
     *
     * @param {[ unknown[][], number[] ]} aResult Result is returned in array. Format is the table data in first array slot as array and row indexes in second array slot
     * @param {unknown[][]} aBody Body data where result data is taken from
     * @param {number} iBegin From row
     * @param {number} iEnd To row
     * @param options
     */
    static _get_data(aResult: [unknown[][], number[]], aBody: unknown[][], iBegin: any, iEnd: any, options: {
        table?: CTableData;
        convert?: ((value: unknown, aCell: [number, number]) => string)[];
        hide?: number[];
        index?: boolean;
        order?: number[];
        slice?: number;
    }): unknown[][] | [unknown[][], number[]];
    /**
     * Extract data from internal body based on row keys
     * @param aKey array of row keys for rows to extract
     * @param aBody body having data to extract from
     * @param aColumn if specific columns are taken, with aColumn it is possible to select columns to extract
     */
    static _get_data_for_keys(aKey: number[], aBody: unknown[][], aColumn?: number[]): unknown[][];
    /**
     *
     * @param aBody
     * @param {[ number, number, number ][]} aOrder [index, order, type][]
     */
    static _sort(aBody: unknown[][], aOrder: [number, boolean, string?][]): void;
    /**
     * Generate information how fields are placed. the position.row and position.hide column properties
     * are checked and based on those information about where field is placed is generated.
     * @param {boolean} [bRaw] Use raw position in table data, do not take the index property in position
     */
    _collect_row_design(bRaw?: boolean): [[number, number, HTMLElement], number[]][];
}
/**
 * CRowRows is used to collect information about the layout for each row in CTableData.
 * This is important when component working with CTableData needs to render
 * */
export declare class CRowRows {
    m_aRows: [[number, number, HTMLElement], number[]][];
    constructor(aRows: [[number, number, HTMLElement], number[]][]);
    /**
     * Return number of rows that is needed to generate for one record(row) in table
     */
    get length(): number;
    GetRowLevel(iIndex?: number): number | number[];
    /**
     * Return row element for index
     * @param {number} iIndex index to row element is returned for
     */
    GetRowElement(iIndex: number): HTMLElement;
    /**
     * Return column indexes for row, these are relative positioned indexes from CTableData and should
     * match position for component that uses it
     * @param {number} [iIndex] index for row. if row isn't specified then return columns for row 0 which is the main row.
     */
    GetRowColumns(iIndex?: number): number[];
    /**
     * Set root element for row
     * @param {number} iIndex index for row element is set
     * @param {HTMLElement} eRow root element for row
     */
    SetRowElement(iIndex: number, eRow: HTMLElement): void;
    /**
     * When columns are collected they get the position.index value. If that value hasn't been modified to ignore hidden columns this method can be used to recalculate column indexes
     * @param {number[]} aMatch array that has the physical position index for column in table data in array position where value is presentedO
     */
    OffsetColumns(aMatch: number[]): void;
}
export {};
