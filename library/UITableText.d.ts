import { CTableData, CRowRows, enumMove, DispatchMessage, IUITableData, tabledata_column, tabledata_position, tabledata_format } from "./TableData.js";
import { edit } from "./TableDataEdit.js";
import { CTableDataTrigger, EventDataTable } from "./TableDataTrigger.js";
import { CDispatch } from "./Dispatch.js";
export declare const enum enumState {
    HtmlValue = 1,
    SetDirtyRow = 2,
    SetHistory = 4,
    SetValue = 8,
    SetOneClickActivate = 16,
    DisableFocus = 32
}
declare namespace details {
    type construct = {
        body?: unknown[][];
        callback_action?: ((sType: string, e: EventDataTable, sSection: string) => boolean | void) | ((sType: string, e: Event | EventDataTable, sSection: string) => boolean | void)[];
        callback_create?: ((sType: string, e: EventDataTable, sSection: string) => boolean | void) | ((sType: string, e: EventDataTable, sSection: string) => boolean | void)[];
        callback_render?: ((sType: string, e: EventDataTable, sSection: string, oColumn?: tabledata_column) => boolean | void) | ((sType: string, e: EventDataTable, sSection: string, oColumn?: tabledata_column) => boolean | void)[];
        callback_renderer?: details.renderer[];
        create?: boolean;
        dispatch?: CDispatch;
        edit?: boolean;
        edits?: edit.CEdits;
        id?: string;
        offset_start?: number;
        start?: number;
        max?: number;
        name?: string;
        parent?: HTMLElement;
        section?: string[];
        separator?: {
            header?: string;
            value?: string;
        };
        settings?: {
            layout?: string;
        };
        server?: boolean;
        state?: number;
        style?: {
            header?: string;
            value?: string;
            class_header?: string;
            class_value?: string;
            class_section?: string;
            class_component?: string;
            class_cell_input?: string;
            class_cell_selected?: string;
            class_value_error?: string;
            html_group?: string;
            html_header?: string;
            html_cell?: string | string[];
            html_cell_header?: string;
            html_cell_footer?: string;
            html_row?: string | string[];
            html_row_body?: string | string[];
            html_row_body_before?: string | string[];
            html_row_body_after?: string | string[];
            html_row_body_container?: string | string[];
            html_value?: string;
            html_section_header?: string;
            html_section_body?: string;
            html_section_footer?: string;
        };
        support_element?: string | HTMLElement;
        table?: CTableData;
        trigger?: CTableDataTrigger;
        width?: {
            max_value_width?: number;
            max_row_width?: number;
        };
    };
    type renderer = ((e: HTMLElement, value: unknown, aCell: [[number, number], [number, number], tabledata_column]) => void);
}
export declare type uitabledata_construct = details.construct;
/**
 *
 *
 * section [section="component"]
 *    section [section="toolbar"]
 *    section [section="header"]
 *       div [type="row"]
 *          span
 *    section [section="body"]
 *       div [row=data_row_index, type="row", line=ui_row_index ,record="1"]
 *          span [c=ui_column_index]
 *    section [section="footer"]
 *       div [row=index, type="row"]
 *          span
 *    section [section="statusbar"]
 *
 * */
export declare class CUITableText implements IUITableData {
    m_acallAction: ((sType: string, e: Event | EventDataTable, sSection: string) => boolean | void)[];
    m_acallCreate: ((sType: string, e: EventDataTable, sSection: string) => boolean | void)[];
    m_acallRender: ((sType: string, e: EventDataTable, sSection: string, oColumn: any) => boolean | void)[];
    m_acallRenderer: details.renderer[];
    m_iColumnCount: number;
    m_aColumnFormat: tabledata_format[];
    m_aColumnPhysicalIndex: number[];
    m_aColumnPosition: tabledata_position[];
    m_eComponent: HTMLElement;
    m_oDispatch: CDispatch;
    m_oEdits: edit.CEdits;
    m_sId: string;
    m_aInput: [number, number, HTMLElement, number, number];
    m_sName: string;
    m_iOpenEdit: number;
    m_aOrder: [number | string, number][];
    m_eParent: HTMLElement;
    m_aRowBody: unknown[][];
    m_iRowStart: number;
    m_iRowOffsetStart: number;
    m_iRowCount: number;
    m_iRowCountMax: number;
    m_aRowPhysicalIndex: number[];
    m_oRowRows: CRowRows;
    m_aSelected: [number, number][];
    m_bServer: boolean;
    m_iState: number;
    m_oTableData: CTableData;
    m_oTableDataTrigger: CTableDataTrigger;
    m_aSection: string[] | [string, HTMLElement][];
    m_oStyle: {
        header?: string;
        value?: string;
        cell_focus?: string;
        cell_selected?: string;
        class_header?: string;
        class_value?: string;
        class_section?: string;
        class_component?: string;
        class_cell_input?: string;
        class_cell_selected?: string;
        html_header?: string;
        html_value?: string;
    };
    m_eSupportElement: HTMLElement;
    m_aValueError: [number, number, unknown, unknown][];
    m_oWidth: {
        max_row_width?: number;
        max_value_width?: number;
    };
    static s_sWidgetName: string;
    static s_iIdNext: number;
    /**
     * Default styles
     */
    static s_oStyle: {
        class_component: string;
        class_header: string;
        class_input: string;
        class_section: string;
        class_selected: string;
        class_error: string;
    };
    constructor(options: details.construct);
    /**
     * Return id
     */
    get id(): string;
    /**
     * Name (set and get methods)
     */
    get name(): string;
    set name(sName: string);
    /**
     * Get table data object that manages table data logic
     */
    get data(): CTableData;
    get trigger(): CTableDataTrigger;
    get dispatch(): CDispatch;
    set dispatch(oDispatch: CDispatch);
    /**
     * Get edits object
     */
    get edits(): edit.CEdits;
    get row_count(): number;
    get row_page(): number;
    set row_page(iPage: number);
    get row_max(): number;
    get selected(): [number, number][];
    get state(): number;
    /**
     * Ask if state is on or off. state can be many things
     * @param i
     */
    is_state(i: number): boolean;
    /**
     *
     * @param _On
     * @param iState
     */
    set_state<T>(_On: T, iState: number): void;
    SetProperty(sName: string, _Value: string | number): void;
    /**
     * General update method where operation depends on the iType value
     * @param iType
     */
    update(iType: number): any;
    /**
     *
     * @param oMessage
     * @param sender
     */
    on(oMessage: DispatchMessage, sender: IUITableData): boolean;
    /**
     * Create html sections for ui table
     * @param {HTMLElement} [eParent] parent element for sections.
     */
    Create(eParent?: HTMLElement): void;
    /**
     * Get value from body data. Body data is the data taken from table data that is processed
     * with rules set. May be sorted and formated based on what settings that is made.
     * @param _Row
     * @param _Column
     */
    GetBodyValue(_Row: any, _Column: any): unknown;
    /** BLOG: children, childNodes and dataset
     * Get root html element for components, create the component element if argument is true and component element isn't found
     * UI root element has three important data attributes.
     * - data-section = "component"
     * - data-id = id for ui item
     * - data-table = id to table data object
     * @param bCreate
     */
    GetComponent(bCreate?: boolean): HTMLElement;
    /**
     * Element, use this if child elements is to be used. Child elements are added to this
     * @returns {HTMLElement}
     */
    GetSupportElement(): HTMLElement;
    /** BLOG: querySelector
     * Return element for specified section.
     * Section elements are stored in array with section names, when section is created it is also stored. Array works as cache.
     * @param {string} sName name for section, valid names are found in this.m_aSection
     * @param {boolean} [bNoThrow] If true then return null if section isn't found
     * @returns {HTMLElement} Element for section or null if not found
     * @throws {string} string with valid section names
     */
    GetSection(_Name: string | HTMLElement, bNoThrow?: boolean): HTMLElement;
    /**
     * Return row and column for element
     * method are able to return row and col from any section. Returing row and col from body section differs
     * some compare to returning row and col from other sections. Cells in body always has data-c and parent row has data-row.
     * Rows in other sections do not need data-c with column index.
     * @param {HTMLElement} eElement
     * @param {boolean} [bData] Cell index in table data. When hiding columns, index in ui table for
     * column is not same as index in table data. With his parameter you get index for column in table data.
     * @returns {[ number, number, string ]} row index, column index, section name
     */
    GetRowCol(eElement: HTMLElement, bData?: boolean): [number, number, string];
    HideColumn(iColumn: any, bAdd?: boolean): any;
    /**
     * Set cell value to CTableData.
     * Setting values to table data has added logic with triggers.
     * @param {number | [number,number]} _Row Index to row in CTableData or array with row index and column index
     * @param _Column Index to column in CTableData
     * @param value Value set to cell
     * @param {EventDataTable} oTriggerData Trigger information for value
     */
    SetCellValue(_Row: number | [number, number], _Column: any, value?: unknown, oTriggerData?: EventDataTable): void;
    SetCellError(_Row?: any, _Column?: any, value?: unknown, type?: unknown, oTriggerData?: EventDataTable): boolean;
    RemoveCellError(_Row?: any, _Column?: any): void;
    ERRORGet(_Index?: number | [number]): [number, number, unknown, unknown] | [number, number, unknown, unknown][];
    /**
     * Set value error
     * @param {[ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][]} aError
     */
    ERRORSet(aError: [number, number, unknown, unknown] | [number, number, unknown, unknown][]): void;
    ERRORGetCount(): number;
    /** BLOG: firstChild or hasChildNodes to find child nodes. children.length to check elements
     * Render complete table
     * */
    Render(sSection?: string, callback?: ((eSection: HTMLElement, sName: string) => void)): void;
    render(): void;
    SetSelected(iRow: number, iColumn: number, bAdd?: boolean): number;
    SetSelected(aCell: [number, number], bAdd?: boolean): number;
    SetSelected(aCells: [number, number][], bAdd?: boolean): number;
    SetSelected(aFirst: [number, number], aLast: [number, number], bAdd?: boolean): number;
    /**
     * Set sort columns.
     * @param {number | string | [number|string][]} _Sort
     * @param bToggle
     * @param bAdd
     */
    Sort(_Sort?: number | string | [number | string][], bToggle?: boolean, bAdd?: boolean): void;
    Destroy(): void;
    /**
     * Get number of columns
     * @returns {number} number of visible columns.
     */
    COLUMNGetCount(): number;
    /**
     * Get column object and index for column in ui table
     * @param {number | string | HTMLElement} _Index
     */
    COLUMNGet(_Index: number | string | HTMLElement): [number, tabledata_column];
    /**
     * Calculate width for columns
     * @param eSection
     */
    /**
     * Calculate width for columns
     * @param {string} sSectionName section where columns gets width from
     * @param {number|number[]} [_MaxWidth] max width value or width for column if array is sent with numbers
     * @param {number} [iRowCount] number of columns to test width for
     */
    COLUMNCalculateMaxWidth(sSectionName: string, _MaxWidth?: number | number[], iRowCount?: number): number[];
    /**
     *
     * @param aWidth
     * @param eSection
     */
    COLUMNSetWidth(aWidth: number[], _Section: HTMLElement | string): void;
    COLUMNGetRenderer(iIndex: number): details.renderer;
    /**
     * Set renderer for column
     * @param {number | string} _Index index to column renderer are set for
     * @param {details.renderer | null } [callback] callback that will render value
     */
    COLUMNSetRenderer(_Index: number | string, callback?: details.renderer | null): void;
    /**
     * Get number of rows displayed in table
     */
    ROWGetCount(): number;
    /**
     * Get indexes to new rows in table. New rows has the index -1 set to it, it do not exist in table data source and therefore no matching row
     */
    ROWGetIndexForNew(): number[];
    /**
     * Return values for row in body
     * @param iRow key to row or if bRay it is the physical index
     */
    ROWGet(iRow: number): unknown[];
    ROWInsert(iRow: number, _Row?: number | unknown[] | unknown[][]): unknown[][];
    /**
     * Validate values in row
     * @param  {number | number[]}    _Row [description]
     * @return {boolean}     [description]
     */
    ROWValidate(_Row: number | number[]): boolean | [number, number, unknown, unknown][];
    /**
     * Move to row, rows are found in table data and this modifies the first row that is shown from table data
     * @param {number}  iOffset distance to new row position
     * @param {boolean} bFake   when true then no movement is done, just triggers. this is if data is fetched from server
     */
    ROWMove(iOffset: number, bFake?: boolean): void;
    /**
     * Get parent section element for element sent as argument
     * @param {HTMLElement} eElement element that sections is returned for.
     */
    ELEMENTGetSection(eElement: HTMLElement): HTMLElement;
    /**
     * Tries to get specified row from section. This is done by lookin for elements with the attribute
     * data-record="1". The data-record marks the main row element for each row in table data.
     * @param  {number}             iRow     index for row element returned
     * @param  {string|HTMLElement} _Section section row is looked for
     * @return {HTMLElement}                 row element for specified row if found
     */
    ELEMENTGetRow(iRow: number, _Section?: string | HTMLElement): HTMLElement | [HTMLElement, NodeList];
    /**
     * Return html element for cell
     * @param {[ number, number ]} aRow array with two numbers, row and column index
     * @param {string} [sSection] section cell is returned from
     */ /**
    *
    * @param {nibmer} iRow index for row where cell is located
    * @param {number} iColumn index for column to cell
    * @param {string} [sSection] section cell is returned from
    */
    ELEMENTGetCell(aRow: [number, number], sSection?: string): HTMLElement;
    ELEMENTGetCell(iRow: number, iColumn: number, sSection?: string): HTMLElement;
    /**
     * Return value element in cell. Get value element in cell if cell has generated dom tree inside
     * @param {HTMLElement} e Cell element
     * @returns {HTMLElement} element to value or null if not found
     */
    ELEMENTGetCellValue(e: HTMLElement): HTMLElement;
    /**
     * Create input controls
     * @param {boolean} bCreate If true then edit controls is created for columns that are editable
     */ /**
    * Initialize (or reinitialize) edit logic for UITableText
    * @param {CTableData} [oTableData] Table data used to initialize edit controls with
    * @param {boolean} [bCreate] if elements is created for edit controls
    */
    INPUTInitialize(bCreate?: boolean): void;
    INPUTInitialize(oTableData?: CTableData, bCreate?: boolean): void;
    /**
     * Set active input cell. Only one input cell can be active at any time.
     * @param {number} iR row index in ui
     * @param {number} iC column index in ui
     */ /**
    * Set active input cell. Only one input cell can be active at any time.
    * @param {[ number, number]} aRC array with first position is row index and second position is column index
    */ /**
    * Calling INPUTSet with no parameter will try to update input position from position in table data
    */
    INPUTSet(iR: number, iC: number): void;
    INPUTSet(aRC: [number, number]): void;
    INPUTSet(): void;
    /**
     * Clear input item, this doesnt dispach any event. it just clears value if input is created
     */
    INPUTClear(): [number, number, HTMLElement, number, number];
    /**
     * Move active input based on specified move operation
     * @param {enumMove} e How input is moved
     * @param {boolean}  bRender if body is rendered after move, this will update complete table with new input
     */
    INPUTMove(e: enumMove, bRender?: boolean): void;
    /**
     * Activate input fields or field for selected row or cell.
     * If cell doesn't have the edit property set it can be edited and no activation is done for that cell
     * @param {number} iRow Row number where input is activated
     * @param {number | number[]} [_Column] Column where inputs are activated, if no column than all inputs for selected row is activated
     */
    INPUTActivate(_Row?: number | boolean, _Column?: number | number[], bInput?: boolean): void;
    INPUTDeactivate(_Row?: number | boolean, _Column?: number | number[]): number;
    /**
     * Render header for table
     * @param aHeader
     */
    render_header(aHeader: [number, [string, string]][]): HTMLElement;
    /**
     * Render body, body is where values from table are shown
     * @param {[ unknown[][], number[] ]} aResult Result is a two array values in array. First is
     *        result and second is index to physical row in result.
     */
    render_body(aResult?: [unknown[][], number[]], eSection?: HTMLElement): any;
    render_body(bUpdate: boolean, eSection?: HTMLElement): any;
    /**
     * Restore states for each cell in body.
     * If there are changes to cells in body. new cells are selected, there are errors etc. Classes that marks
     * the state for each cell needs to be updated. This method do not change any value in cell but restore
     * cell states to display active state for each cell.
     */
    render_body_restore(): void;
    /**
     * Render value in cell. Cell value is taken from table data
     * @param {number | number[]} _Row Index to row or array with index for row and column
     * @param {number} [iColumn] Index to column. if `_Row` is array then iColumn isn't used
     */
    render_value(_Row: number | number[], iColumn?: number): void;
    /**
     * Render selected cell or cells
     * @param {[number,number][]} [aSelected] Cells to select or if not specified then internal selected cell if any is rendered as selected.
     */
    render_selected(aSelected?: [number, number][]): void;
    render_input(): void;
    render_value_error(aValueError?: [number, number, unknown, unknown] | [number, number, unknown, unknown][]): void;
    /**
     * Creates section elements for parts used by `CUITableText`.
     * Sections rendered are found in member m_aSection
     * @param {HTMLElement} [eComponent] Container section
     */
    create_sections(eComponent?: HTMLElement): HTMLElement;
    /**
     * Create header element with columns
     * @param aHeader
     */
    create_header(aHeader: [number, [string, string]][], callback?: ((eSpan: HTMLElement, sSection: string) => void)): HTMLElement;
    /**
     * Create body, body is the section that displays values from table data. Tables are shown as rows with vales for each value in table
     * @param {unknown[][]} aBody value data that elements are created for
     */
    create_body(aBody?: unknown[][]): HTMLElement;
    /**
     * Create container for each row or row "row-tree" of elements from string or array with strings
     * @param {string | string[]} aContainer element names for  row tree
     */
    _create_container(aContainer: string | string[]): [HTMLElement, HTMLElement];
    /**
     * Create row or row "row-tree" of elements from string or array with strings
     * @param {string | string[]} aRow element names for row tree
     */
    _create_row(aRow: string | string[]): [HTMLElement, HTMLElement];
    /**
     * Types of row layouts that are managed
     * 1: <main row>
     *      <extra>
     *        <extra>
     *          <column row>
     *
     * 2: <main row><columns ...
     *    <extra row><columns ...
     *
     * If extra  rows are placed in same tree as the main row then first item in `aRow` has a number
     * that is used to walk main tree to get parent for extra row.
     * @param aRow
     * @param oPosition
     */
    _create_row_extra(aRow: string | (number | string)[], oPosition: tabledata_position, aRows: [HTMLElement, HTMLElement][]): [number, HTMLElement, HTMLElement];
    /**
     * Create row or row "row-tree" of elements from string or array with strings
     * @param {string | string[]} aRow element names for  row tree
     */
    _create_section(aSection: string | string[], sName: string): [HTMLElement, HTMLElement];
    _has_create_callback(sName: any, v: EventDataTable, sSection: any, call?: ((sType: string, v: any, e: HTMLElement) => boolean)): boolean;
    _has_render_callback(sName: any, sSection: any): boolean;
    /**
     * Call action callbacks
     * @param  {string}  sType Type of action
     * @param  {Event}   e        event data if any
     * @param  {string}  sSection section name
     * @return {unknown} if false then disable default action
     */
    private _action;
    /**
     * Handle element events for ui table text. Events from elements calls this method that will dispatch it.
     * @param {string} sType event name
     * @param {Event} e event data
     * @param {string} sSection section name, table text has container elements with a name (section name)
     */
    private _on_action;
    /**
     * Return index to physical position in table data. This is needed if operations based on data is executed
     * @param iIndex
     */
    private _column_in_data;
    /**
     * Get column position in table, this position can differ from the position in  table data
     * @param iIndex
     */
    private _column_in_ui;
    private _get_triggerdata;
    private _set_selected;
    private _row_in_data;
    private _row_in_ui;
    private _trigger;
}
export {};
