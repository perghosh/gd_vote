/* Introduction
 *
 * CUITableText has logic to present information in table where data is stored in CTableData.
 *
 * - COLUMN-methods: column logic
 * - ELEMENT-methods: access elements in ui table
 * - INPUT-methods: editing methods.
 * - ROW-methods: row logic
 
 
   https://hacks.mozilla.org/category/es6-in-depth/
 
 */
import { CTableData } from "./TableData.js";
import { edit } from "./TableDataEdit.js";
/*
parent.addEventListener('click', function(e) {
    if(e.target.classList.contains('myclass')) {
        // this code will be executed only when elements with class
        // 'myclass' are clicked on
    }

}); */
/*
 * Naming conventions
 * PascalCase or UpperCamelCase (public): Methods designed to be called from users, similar to public.
 *    Public methods have more error checking and return more information if something goes wrong, they may throw
 * snake_case (protected): Methods used internally, if you know how the object works internally then you could call them. almost like protected methods
 * (underscore) _snake_case (private): these are not designed to be used internally
 * flatcase: getters and setters have flatcase styling. All in lower case letters
 */
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
export class CUITableText {
    constructor(options) {
        const o = options || {};
        this.m_acallAction = [];
        if (o.callback_action)
            this.m_acallAction = Array.isArray(o.callback_action) ? o.callback_action : [o.callback_action];
        this.m_acallCreate = [];
        if (o.callback_create)
            this.m_acallCreate = Array.isArray(o.callback_create) ? o.callback_create : [o.callback_create];
        this.m_acallRender = [];
        if (o.callback_render)
            this.m_acallRender = Array.isArray(o.callback_render) ? o.callback_render : [o.callback_render];
        if (o.callback_renderer)
            this.m_acallRenderer = o.callback_renderer;
        this.m_aRowBody = o.body || [];
        this.m_iColumnCount = 0;
        this.m_eComponent = null;
        this.m_oDispatch = o.dispatch || null;
        this.m_oEdits = o.edits || null;
        this.m_sId = o.id || CUITableText.s_sWidgetName + (new Date()).getUTCMilliseconds() + ++CUITableText.s_iIdNext;
        this.m_aInput = o.edit ? [-1, -1, null, -1, -1] : null;
        this.m_sName = o.name || CUITableText.s_sWidgetName;
        this.m_iOpenEdit = 0;
        this.m_aOrder = [];
        this.m_eParent = o.parent || null;
        this.m_aRowPhysicalIndex = null;
        this.m_iRowStart = o.start || 0;
        this.m_iRowOffsetStart = o.offset_start || 0;
        this.m_iRowCount = 0;
        this.m_iRowCountMax = o.max || -1;
        this.m_aSection = o.section || ["toolbar", "title", "header", "body", "footer", "statusbar"]; // sections "header" and "body" are required
        this.m_aSelected = [];
        this.m_bServer = o.server || false;
        this.m_iState = o.state || 0;
        this.m_oTableData = o.table || null;
        this.m_oTableDataTrigger = o.trigger || null;
        let oStyle = o.style || {};
        this.m_oStyle = { ...CUITableText.s_oStyle, ...oStyle };
        this.m_aValueError = [];
        /*
              this.m_oStyle = {
                 ...{
                    header: "border: 1px solid grey;display: inline-block; margin: 1px 2px; overflow: hidden;",
                    //value: "border: 1px solid grey;display: inline-block; margin: 1px 2px;",
                    value: null,
                    cell_focus: null,
                    cell_selected: null,
                    //cell_selected: "border: 1px solid blue; display: inline-block; margin: 1px 2px; background-color: yellow;",
                    cell_input: null,
                    //cell_input: "border: 1px solid blue; display: inline-block; margin: 1px 2px; background-color: green;",
                    class_header: null,
                    class_value: null,
                    class_section: null,
                    class_component: null,
                    class_cell_input: null,
                 }, ...o.style
              };
        */
        this.m_oWidth = o.width || {};
        if (o.create !== false) {
            if (this.m_eParent) {
                this.Create();
            }
            if (o.support_element) {
                if (typeof o.support_element === "string")
                    this.m_eSupportElement = this.GetSection(o.support_element);
                else
                    this.m_eSupportElement = o.support_element;
            }
            if (o.edit) {
                if (this.GetSupportElement() !== null)
                    this.INPUTInitialize(); // if edit and support element is set then initialize inputs
                this.set_state(true, 2 /* SetDirtyRow */);
                this.set_state(true, 4 /* SetHistory */);
            }
        }
    }
    /**
     * Return id
     */
    get id() { return this.m_sId; }
    /**
     * Name (set and get methods)
     */
    get name() { return this.m_sName; }
    set name(sName) { this.m_sName = sName; }
    /**
     * Get table data object that manages table data logic
     */
    get data() { return this.m_oTableData; }
    get trigger() { return this.m_oTableDataTrigger; }
    get dispatch() { return this.m_oDispatch; } // get dispatcher if any connected
    set dispatch(oDispatch) { this.m_oDispatch = oDispatch; }
    /**
     * Get edits object
     */
    get edits() { return this.m_oEdits; }
    // ## row attributes 
    get row_count() { return this.m_iRowCount; } // get number of rows in table
    get row_page() { return this.m_iRowStart / this.m_iRowCountMax; } // calculate active page
    set row_page(iPage) {
        this.m_iRowStart = iPage * this.m_iRowCountMax;
        if (this.dispatch) {
            this.dispatch.NotifyConnected(this, { command: "set.page", data: { page: this.row_page } });
        }
    }
    get row_max() { return this.m_iRowCountMax; } // max number of rows in ui table
    get selected() { return this.m_aSelected; } // selected cells 
    get state() { return this.m_iState; } // custom states for ui table, not used internally
    /**
     * Ask if state is on or off. state can be many things
     * @param i
     */
    is_state(i) { return (this.m_iState & i) !== 0; }
    /**
     *
     * @param _On
     * @param iState
     */
    set_state(_On, iState) {
        this.m_iState = _On ? this.m_iState | iState : this.m_iState & ~iState;
    }
    SetProperty(sName, _Value) {
        sName = sName.toLowerCase();
        switch (sName) {
            case "name":
                this.m_sName = _Value;
                break;
            case "rowstart":
                this.m_iRowStart = _Value;
                break;
            case "rowcount":
                this.m_iRowCount = _Value;
                break;
            case "rowcountmax":
                this.m_iRowCountMax = _Value;
                break;
        }
    }
    /**
     * General update method where operation depends on the iType value
     * @param iType
     */
    update(iType) {
        switch (iType) {
            case 28 /* UpdateDataNew */: {
                this.Render();
            }
        }
    }
    /**
     * Collect dispatch messages here for connected components
     * @param oMessage
     * @param sender
     */
    on(oMessage, sender) {
        const [sCommand, sType] = oMessage.command.split(".");
        switch (sCommand) {
            case "update":
                this.Render();
                break;
            case "move":
                {
                    let iMoveRows = this.m_iRowCountMax !== -1 ? this.m_iRowCountMax : this.m_iRowCount;
                    if (oMessage?.data?.trigger & 65536 /* TRIGGER_BEFORE */) {
                        if (sType === "previous" && this.m_iRowStart <= 0) {
                            this.ROWMove(-iMoveRows, true);
                            return false;
                        }
                        else if (sType === "next") {
                            // Trying to move beyond number of rows in table data
                            if (this.data.ROWGetCount() < (this.m_iRowStart + this.m_iRowOffsetStart + this.m_iRowCountMax)) {
                                this.ROWMove(iMoveRows, true);
                                return false;
                            }
                        }
                        return;
                    }
                    if (sType === "previous")
                        this.ROWMove(-iMoveRows); // move back one "page"
                    else if (sType === "next")
                        this.ROWMove(iMoveRows); // move forward one "page"
                }
                break;
        }
    }
    /**
     * Create html sections for ui table
     * @param {HTMLElement} [eParent] parent element for sections.
     */
    Create(eParent) {
        eParent = eParent || this.m_eParent;
        let eComponent = this.GetComponent(true); // create component in not created
        this.create_sections(eComponent);
        if (eComponent.parentElement === null) {
            eParent.appendChild(eComponent);
        }
    }
    /**
     * Get value from body data. Body data is the data taken from table data that is processed
     * with rules set. May be sorted and formated based on what settings that is made.
     * @param _Row
     * @param _Column
     */
    GetBodyValue(_Row, _Column) {
        let iRow, iColumn; // index for row and column in body data
        if (Array.isArray(_Row) && _Row.length === 2) {
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        const value = this.m_aRowBody[iRow][iColumn];
        return value;
    }
    /** BLOG: children, childNodes and dataset
     * Get root html element for components, create the component element if argument is true and component element isn't found
     * UI root element has three important data attributes.
     * - data-section = "component"
     * - data-id = id for ui item
     * - data-table = id to table data object
     * @param bCreate
     */
    GetComponent(bCreate) {
        if (this.m_eComponent)
            return this.m_eComponent;
        /*
        let aChildren = this.m_eParent.children;
        let i = aChildren.length;
        while(--i >= 0) {
           let e = <HTMLElement>aChildren[ i ];
           if(e.tagName === "SECTION" && e.dataset.id === this.id && e.dataset.section === "section") return <HTMLElement>e;
        }
        */
        //this._trigger(enumTrigger.BeforeCreate);
        if (bCreate === true) {
            let eComponent = document.createElement("section");
            Object.assign(eComponent.dataset, { section: "component", id: this.id, table: this.data.id }); // set "data-" ids.
            this.m_eComponent = eComponent;
            this._has_create_callback("afterCreate", { data: this.data, dataUI: this, eElement: eComponent }, "component");
        }
        return this.m_eComponent;
    }
    /**
     * Element, use this if child elements is to be used. Child elements are added to this
     * @returns {HTMLElement}
     */
    GetSupportElement() {
        console.assert(typeof this.m_eComponent === "object", "Support element not created!");
        let e = this.m_eSupportElement || this.GetSection("body", true);
        return e || this.m_eComponent;
    }
    /** BLOG: querySelector
     * Return element for specified section.
     * Section elements are stored in array with section names, when section is created it is also stored. Array works as cache.
     * Sample secitons could be "toolbar", "title", "header", "body", "footer", "statusbar". It depends on what sections is set to be created.
     * @param {string} sName name for section, valid names are found in this.m_aSection
     * @param {boolean} [bNoThrow] If true then return null if section isn't found
     * @returns {HTMLElement} Element for section or null if not found
     * @throws {string} string with valid section names
     */
    GetSection(_Name, bNoThrow) {
        let sName;
        if (typeof _Name !== "string") {
            const e = _Name.closest("[data-section]");
            if (e)
                sName = e.dataset.section;
        }
        else
            sName = _Name;
        let i = this.m_aSection.length;
        while (--i >= 0) {
            let a = this.m_aSection[i];
            if (Array.isArray(a) === true && a[0] === sName)
                return a[1];
        }
        if (bNoThrow === true)
            return null;
        throw "No section for \"" + sName + "\" valid sections are: " + this.m_aSection.join(" ");
    }
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
    GetRowCol(eElement, bData) {
        let eRow = eElement;
        let eCell = eElement;
        while (eRow && eRow.dataset.type !== "row") { // Find row for element
            eRow = eRow.parentElement;
        }
        if (eRow === null)
            return null;
        while (eRow && eRow.dataset.row === undefined) { // Find main row, holds key to row in table data
            eRow = eRow.parentElement;
        }
        if (eRow === null)
            return null;
        let iR = parseInt(eRow.dataset.line, 10); // Line in ui table
        let sSection = this.ELEMENTGetSection(eRow).dataset.section;
        let e = eCell;
        while (e && e.dataset.c === undefined && e.isEqualNode(eRow) === false) { // find column ? column is always a child to row element
            e = e.parentElement;
        }
        let iC = 0;
        if (e.dataset.c)
            iC = parseInt(e.dataset.c, 10); // found column ?
        else if (sSection !== "body") { // not in body ?
            e = eCell;
            e = e.previousElementSibling;
            while (e) {
                iC++;
                e = e.previousElementSibling;
            }
        }
        else
            return null;
        if (bData === true) {
            iR = this._row_in_data(iR);
            iC = this._column_in_data(iC); // if column index should represent index in table data. 
        }
        return [iR, iC, sSection];
    }
    HideColumn(_1, _2) {
        let bAdd = false;
        let aColumn;
        if (typeof _1 === "number") {
            _1 = this._column_in_data(_1);
            aColumn = [_1];
        }
        else if (Array.isArray(_1))
            aColumn = _1;
        if (typeof _2 === "boolean")
            bAdd = _2;
        if (bAdd === false) {
            this.data.COLUMNSetPropertyValue(true, "position.hide", 0);
        }
        aColumn.forEach((iColumn) => {
            this.data.COLUMNSetPropertyValue(iColumn, "position.hide", 1);
        });
    }
    /**
     * Set cell value to CTableData.
     * Setting values to table data has added logic with triggers.
     * @param {number | [number,number]} _Row Index to row in CTableData or array with row index and column index
     * @param _Column Index to column in CTableData
     * @param value Value set to cell
     * @param {EventDataTable} oTriggerData Trigger information for value
     */
    SetCellValue(_Row, _Column, value, oTriggerData) {
        let bOk;
        let iRow, iColumn; // index for row and column in UI
        const oTrigger = this.trigger; // Get trigger object with trigger logic
        if (Array.isArray(_Row) && _Row.length === 2) {
            oTriggerData = value;
            value = _Column;
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        const iDataRow = this._row_in_data(iRow), iDataColumn = this._column_in_data(iColumn); // index for row and column in CTableData, its physical position
        const oColumn = this.data.COLUMNGet(iDataColumn, undefined, true);
        let get_value_stack = () => {
            if (oTriggerData.edit)
                return oTriggerData.edit.GetValueStack();
            return [[iRow, iColumn], null, value, null];
        };
        if (oTriggerData) {
            oTriggerData.column = oColumn;
            oTriggerData.data = this.data;
            oTriggerData.dataUI = this;
        }
        if (oTrigger) {
            bOk = oTrigger.Trigger(65545 /* BeforeValidateValue */, oTriggerData, get_value_stack());
            if (bOk === false)
                return;
        }
        let _result = CTableData.ValidateValue(value, oColumn); // validate value
        // if returning array, check for modified value first. If modified then first value in array isn't boolean and first and second value differs.
        if (Array.isArray(_result) && _result[0] !== false && _result[0] !== value) {
            value = _result[0];
            _result = true;
        }
        if (_result === true || _result[0] === true) {
            if (this.m_aValueError.length > 0)
                this.RemoveCellError(iRow, iColumn); // remove error for this value if it was set before
            if (oTrigger) {
                bOk = oTrigger.Trigger(65546 /* BeforeSetValue */, oTriggerData, get_value_stack());
            }
            if (bOk !== false) {
                if (this.is_state(4 /* SetHistory */))
                    this.data.HISTORYPush(iDataRow, iDataColumn); // add to history
                let aRow = this.m_aRowBody[iRow];
                aRow[iColumn] = value; // Modify value internally
                this.data.CELLSetValue(iDataRow, iDataColumn, value, true); // Set value to cell
                if (this.is_state(2 /* SetDirtyRow */))
                    this.data.DIRTYSet(iDataRow); // Set row as dirty
            }
            if (oTrigger) {
                bOk = oTrigger.Trigger(131083 /* AfterSetValue */, oTriggerData, get_value_stack());
            }
        }
        else {
            if (oTrigger) {
                oTriggerData.information = _result;
                bOk = oTrigger.Trigger(65558 /* BeforeSetCellError */, oTriggerData, oTriggerData.edit.GetValueStack());
                if (bOk === false)
                    return;
            }
            if (this.SetCellError(iRow, iColumn, value, _result[1], oTriggerData) === true) {
                this.data.CELLSetValue(iDataRow, iDataColumn, value, true);
            }
        }
    }
    SetCellError(_Row, _Column, value, type, oTriggerData) {
        let bSetValue = true;
        if (_Row === void 0) {
            this.m_aValueError = [];
            return;
        }
        let iRow, iColumn; // index for row and column in UI
        if (Array.isArray(_Row) && _Row.length === 2) { // check for [row, column] parameter
            value = _Column;
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        let aError;
        let bFound = false;
        let i = this.m_aValueError.length;
        while (--i >= 0 && bFound === false) {
            let aError = this.m_aValueError[i];
            if (aError[0] === iRow && aError[1] === iColumn) {
                aError[2] = value;
                aError[3] = type;
                bFound = true;
            }
        }
        if (bFound === false) {
            this.m_aValueError.push([iRow, iColumn, value, type]);
            aError = this.m_aValueError[this.m_aValueError.length - 1];
        }
        this.render_value_error();
        return bSetValue;
    }
    RemoveCellError(_Row, _Column) {
        let iRow, iColumn; // index for row and column in UI
        if (Array.isArray(_Row)) {
            [iRow, iColumn] = _Row;
        }
        else {
            iRow = _Row;
            iColumn = _Column;
        }
        let bFound = false;
        let i = this.m_aValueError.length;
        while (--i >= 0 && bFound === false) {
            let aError = this.m_aValueError[i];
            if (aError[0] === iRow && aError[1] === iColumn) {
                bFound = true;
                this.m_aValueError.splice(i, 1);
                break;
            }
        }
        if (bFound) {
            this.render();
        }
    }
    ERRORGet(_Index) {
        if (_Index === void 0)
            return this.m_aValueError;
        else if (typeof _Index === "number")
            return this.m_aValueError[_Index];
        else if (Array.isArray(_Index)) {
            let a = [];
            _Index.forEach((aError) => { a.push(aError); });
            return a;
        }
        return null;
    }
    /**
     * Set value error
     * @param {[ number, number, unknown, unknown ] | [ number, number, unknown, unknown ][]} aError
     */
    ERRORSet(aError) {
        if (aError.length && typeof aError[0] === "number")
            aError = [aError];
        this.m_aValueError = aError;
    }
    ERRORGetCount() { return this.m_aValueError.length; }
    /** BLOG: firstChild or hasChildNodes to find child nodes. children.length to check elements
     * Render complete table
     * */
    Render(sSection, callback) {
        // return alias and name properties from table data, used for header to column
        if (typeof sSection === "string") {
            if (sSection === "body") {
                this.render_body_restore();
            }
            return;
        }
        let aHeader = this.data.COLUMNGetPropertyValue(true, ["alias", "name", "position.header"], true, (column) => {
            const o = column.position;
            if (o.hide)
                return false;
            return true;
        });
        this.m_aColumnPhysicalIndex = [];
        aHeader.forEach((a) => { this.m_aColumnPhysicalIndex.push(a[0]); });
        this.m_aColumnPosition = [];
        let aPosition = this.data.COLUMNGetPropertyValue(this.m_aColumnPhysicalIndex, "position", true);
        aPosition.forEach(aP => {
            this.m_aColumnPosition.push(aP[1]);
        });
        this.m_aColumnFormat = [];
        let aFormat = this.data.COLUMNGetPropertyValue(this.m_aColumnPhysicalIndex, "format", true);
        aFormat.forEach(aF => {
            this.m_aColumnFormat.push(aF[1]);
        });
        this.m_oRowRows = this.data.GetRowRows(true);
        this.m_iColumnCount = aHeader.length; // Set total column count
        if (this.m_acallRenderer)
            this.COLUMNSetRenderer(this.m_iColumnCount - 1); // Make sure that array for renders holds as many columns as columns
        const oRowRows = this.m_oRowRows;
        let aHeaderColumns = oRowRows.GetRowColumns(); // header takes columns from main row
        // ## Pick columns that is shown from main row. Columns that is placed above or below should is not added to column header
        let a = [];
        for (let i = 0; i < aHeaderColumns.length; i++) {
            const iC = aHeaderColumns[i];
            let j = aHeader.length;
            while (--j >= 0) {
                if (iC === aHeader[j][0]) {
                    if (aHeader[j][1][2] === 0)
                        aHeader[j][1][2] = false;
                    a.push(aHeader[j]);
                    break;
                }
            }
            //a.push( aHeader[ aHeaderColumns[i] ] );
        }
        aHeader = a;
        this.render_header(aHeader);
        let o = {};
        if (this.m_iRowCountMax >= 0)
            o.max = this.m_iRowCountMax; // if max rows returned is set
        if (this.m_bServer === true)
            o.begin = 0; // data is from server and fetched dynamically, table data only has the active page data
        else if (this.m_iRowStart >= 0)
            o.begin = this.m_iRowStart + this.m_iRowOffsetStart;
        if (this.m_aInput) {
            this.m_aInput[0] = -1;
            this.m_aInput[1] = -1;
        }
        let aBody = this.data.GetData(o);
        this.render_body(aBody, this.create_body(aBody[0]));
        this.render_selected();
        this.INPUTSet();
        if (this.m_aInput && this.m_aInput[0] !== -1)
            this.render_input();
        if (this.m_aValueError.length)
            this.render_value_error();
    }
    render() {
        this.create_body();
        this.render_body();
    }
    SetSelected(_1, _2, _3) {
        let bAdd = false;
        let bSet = true;
        let aSelect = [];
        if (_1 === void 0) {
            this.m_aSelected = [];
            return 0;
        }
        if (typeof _3 === "boolean")
            bAdd = _3;
        if (typeof _2 === "boolean")
            bAdd = _2;
        if (Array.isArray(_2)) {
            if (bAdd === false)
                this.m_aSelected = [];
            for (let iR = _1[0]; iR <= _2[0]; iR++) {
                for (let iC = _1[1]; iC <= _2[1]; iC++) {
                    this._set_selected([[iR, iC]], true);
                }
            }
            bSet = false;
        }
        else if (Array.isArray(_1)) {
            if (Array.isArray(_1[0]))
                aSelect = _1;
            else
                aSelect.push(_1);
        }
        else if (typeof _1 === "number" && typeof _2 === "number")
            aSelect.push([_1, _2]);
        if (bSet)
            this._set_selected(aSelect, bAdd);
        return this.m_aSelected.length;
    }
    /**
     * Set sort columns.
     * @param {number | string | [number|string][]} _Sort
     * @param bToggle
     * @param bAdd
     */
    Sort(_Sort, bToggle, bAdd) {
        let aSort = Array.isArray(_Sort) === false ? [_Sort] : _Sort; // if not array then convert to array
        let bOk;
        const oTrigger = this.trigger;
        if (oTrigger) {
            bOk = oTrigger.Trigger(65554 /* BeforeSetSort */, { iReason: 4 /* Command */, dataUI: this }, arguments);
            if (bOk === false)
                return;
        }
        this.data.COLUMNSetPropertyValue(true, "state.sort", 0); // clear sort
        if (_Sort === void 0) {
            this.m_aOrder = [];
            return;
        } // clear sort array and return if no sort value
        let aNew = [];
        for (let i = 0; i < aSort.length; i++) {
            let _Column = aSort[i];
            if (typeof _Column === "number")
                _Column = this._column_in_data(_Column); // convert to physical index in table data
            let iFind = this.m_aOrder.findIndex((_C) => { return _Column === _C[0]; });
            if (iFind === -1) {
                aNew.push([_Column, 1]);
            }
            else { // is column already sorted, then switch order
                let a = this.m_aOrder[iFind];
                a[1] = -a[1];
                if (bAdd !== true) {
                    aNew.push(a);
                }
            }
        }
        if (bAdd === true)
            this.m_aOrder = this.m_aOrder.concat(aNew);
        else
            this.m_aOrder = aNew;
        this.m_aOrder.forEach((_Column) => {
            this.data.COLUMNSetPropertyValue(_Column[0], "state.sort", _Column[1]);
        });
        if (oTrigger) {
            bOk = oTrigger.Trigger(131091 /* AfterSetSort */, { iReason: 4 /* Command */, dataUI: this }, arguments);
        }
    }
    Destroy() {
        if (this.m_eComponent) {
            let eComponent = this.m_eComponent;
            this.m_eComponent = null;
            eComponent.parentNode.removeChild(eComponent);
        }
    }
    /**
     * Get number of columns
     * @returns {number} number of visible columns.
     */
    COLUMNGetCount() { return this.m_iColumnCount; }
    /**
     * Get column object and index for column in ui table
     * @param {number | string | HTMLElement} _Index
     */
    COLUMNGet(_Index) {
        let iColumn;
        if (typeof _Index === "number") {
            iColumn = this._column_in_data(_Index);
        }
        else if (typeof _Index === "string") {
            iColumn = this.data._index(_Index);
        }
        else {
            let aRowCol = this.GetRowCol(_Index);
            if (aRowCol) {
                iColumn = aRowCol[1];
            }
        }
        if (typeof iColumn === "number" && iColumn >= 0)
            return [iColumn, this.data.COLUMNGet(iColumn, undefined, true)];
        return null;
    }
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
    COLUMNCalculateMaxWidth(sSectionName, _MaxWidth, iRowCount) {
        let aWidth = new Array(this.m_iColumnCount);
        aWidth.fill(0);
        let iMaxWidth = 0, aMax;
        if (Array.isArray(_MaxWidth))
            aMax = _MaxWidth;
        else if (typeof _MaxWidth === "number")
            iMaxWidth = _MaxWidth;
        let eSection = this.GetSection(sSectionName);
        if (!eSection)
            return aWidth; // section not found, just return empty array
        let eRow = eSection.firstElementChild;
        while (eRow) {
            let eColumn = eRow.firstElementChild;
            let iTo = this.m_iColumnCount;
            for (let i = 0; i < iTo; i++) {
                if (aMax)
                    iMaxWidth = aMax[i];
                let iWidth = eColumn.offsetWidth;
                if (iMaxWidth && iWidth > iMaxWidth)
                    iWidth = iMaxWidth; // if max width then check for not above
                if (iWidth > aWidth[i])
                    aWidth[i] = iWidth;
                eColumn = eColumn.nextElementSibling;
            }
            //eRow = eRow.nextElementSibling;
            while ((eRow = eRow.nextElementSibling) !== null && eRow.dataset.record !== "1")
                ;
        }
        return aWidth;
    }
    /**
     *
     * @param aWidth
     * @param eSection
     */
    COLUMNSetWidth(aWidth, _Section) {
        let eSection;
        if (typeof _Section === "string") {
            eSection = this.GetSection(_Section);
        }
        else
            eSection = _Section;
        if (eSection === null)
            return;
        let set_width = (eSection) => {
            let eRow = eSection.firstElementChild;
            while (eRow) {
                let eColumn = eRow.firstElementChild;
                let iTo = this.m_iColumnCount;
                for (let i = 0; i < iTo; i++) {
                    eColumn.style.width = "" + aWidth[i] + "px";
                    eColumn = eColumn.nextElementSibling;
                }
                eRow = eRow.nextElementSibling;
            }
        };
        let sDisplay = eSection.style.display;
        eSection.style.display = "none";
        set_width(eSection);
        eSection.style.display = sDisplay;
    }
    COLUMNGetRenderer(iIndex) {
        if (this.m_acallRenderer)
            return this.m_acallRenderer[iIndex];
        return null;
    }
    /**
     * Set renderer for column
     * @param {number | string} _Index index to column renderer are set for
     * @param {details.renderer | null } [callback] callback that will render value
     */
    COLUMNSetRenderer(_Index, callback) {
        let iIndex;
        if (typeof _Index === "number")
            iIndex = _Index;
        else {
            const i = this.data._index(_Index);
            console.assert(i !== -1, "no column for: " + _Index);
            iIndex = this._column_in_ui(i);
        }
        if (!this.m_acallRenderer) {
            const iLength = Math.max(this.m_iColumnCount, iIndex + 1);
            this.m_acallRenderer = new Array(iLength);
        }
        else {
            const iLength = Math.max(this.m_iColumnCount, iIndex + 1);
            while (this.m_acallRenderer.length < iLength)
                this.m_acallRenderer.push(null);
        }
        if (callback !== undefined)
            this.m_acallRenderer[iIndex] = callback;
    }
    /**
     * Get number of rows displayed in table
     */
    ROWGetCount() { return this.m_aRowBody.length; }
    /**
     * Get indexes to new rows in table. New rows has the index -1 set to it, it do not exist in table data source and therefore no matching row
     */
    ROWGetIndexForNew() {
        let a = [];
        let aIndex = this.m_aRowPhysicalIndex;
        let iTo = aIndex.length;
        for (let i = 0; i < iTo; i++) {
            if (aIndex[i] === -1)
                a.push(i);
        }
        return a;
    }
    /**
     * Return values for row in body
     * @param iRow key to row or if bRay it is the physical index
     */
    ROWGet(iRow) {
        return this.m_aRowBody[iRow];
    }
    ROWInsert(iRow, _Row) {
        _Row = _Row || 1; // 1 row is default
        let iCount;
        let aRow = [];
        let aIndex = [];
        let iColumnCount = this.COLUMNGetCount();
        if (typeof _Row === "number") {
            iCount = _Row;
            for (let i = 0; i < iCount; i++) {
                aRow.push(new Array(iColumnCount));
            }
        }
        else {
            aRow = _Row;
            if (aRow.length === 0)
                return;
            if (Array.isArray(aRow[0]) === false)
                aRow = [aRow];
            // Prepare rows for insertion
            for (let i = 0; i < aRow.length; i++) {
                let a = aRow[i];
                for (let j = a.length; j < iColumnCount; j++) {
                    a.push(null);
                }
            }
        }
        let i = iCount;
        while (--i >= 0) {
            aIndex.push(-1);
        }
        // Rows are prepared, time to insert
        this.m_aRowBody.splice(iRow, 0, ...aRow);
        this.m_aRowPhysicalIndex.splice(iRow, 0, ...aIndex); // Add row index for new rows, these are negative because data do not exist in CTableData
        return aRow;
    }
    /**
     * Validate values in row
     * @param  {number | number[]}    _Row [description]
     * @return {boolean}     [description]
     */
    ROWValidate(_Row) {
        let aError = [];
        if (typeof _Row === "number")
            _Row = [_Row];
        for (let i = 0; i < _Row.length; i++) {
            const iRow = _Row[i];
            let aRow = this.data.ROWGet(iRow);
            aRow.forEach((_Value, iIndex) => {
                let oColumn = this.data.COLUMNGet(iIndex, false, true);
                let _result = CTableData.ValidateValue(_Value, oColumn);
                if (Array.isArray(_result) === true && _result[0] === false) { // if error then add it to array with found error values
                    let iColumn = this._column_in_ui(iIndex);
                    aError.push([iRow, iColumn, _Value, _result[1]]);
                }
            });
        }
        return aError.length ? aError : true;
    }
    /**
     * Move to row, rows are found in table data and this modifies the first row that is shown from table data
     * @param {number}  iOffset distance to new row position
     * @param {boolean} bFake   when true then no movement is done, just triggers. this is if data is fetched from server
     */
    ROWMove(iOffset, bFake) {
        let iStart = this.m_iRowStart;
        let oTD;
        const oTrigger = this.trigger; // Get trigger object with trigger logic
        if (oTrigger) {
            oTD = this._get_triggerdata();
            oTD.information = { offset: iOffset, start: iStart, count: this.m_iRowCount, max: this.m_iRowCountMax }; // move data
            oTD.iEvent = 65560 /* BeforeMove */;
            const bOk = oTrigger.Trigger(65560 /* BeforeMove */, oTD);
            if (bOk === false)
                return;
        }
        iStart += iOffset;
        if (iStart < 0)
            iStart = 0;
        if (iStart !== this.m_iRowStart) {
            if (bFake !== true)
                this.m_iRowStart = iStart;
            if (this.dispatch) {
                this.dispatch.NotifyConnected(this, { command: "move", data: { start: iStart, count: this.m_iRowCount, max: this.m_iRowCountMax } });
            }
            if (bFake !== true)
                this.Render();
            if (oTrigger) {
                oTD.iEvent = 131097 /* AfterMove */;
                oTrigger.Trigger(131097 /* AfterMove */, oTD);
            }
        }
    }
    /**
     * Get parent section element for element sent as argument
     * @param {HTMLElement} eElement element that sections is returned for.
     */
    ELEMENTGetSection(eElement) {
        while (eElement && eElement.dataset.section === undefined) {
            eElement = eElement.parentElement;
        }
        if (eElement)
            return eElement;
        throw "null section, have table been redrawn?";
    }
    /**
     * Tries to get specified row from section. This is done by lookin for elements with the attribute
     * data-record="1". The data-record marks the main row element for each row in table data.
     * @param  {number}             iRow     index for row element returned
     * @param  {string|HTMLElement} _Section section row is looked for
     * @return {HTMLElement}                 row element for specified row if found
     */
    ELEMENTGetRow(iRow, _Section) {
        _Section = _Section || "body";
        let eSection = typeof _Section === "string" ? this.GetSection(_Section) : _Section;
        let i = iRow;
        let eRow = eSection.firstElementChild; // Position at row
        if (eRow.dataset.record !== "1")
            i++; // no row ?
        while (--i >= 0 && eRow) {
            if (eRow.dataset.record !== "1")
                i++; // no row ?
            eRow = eRow.nextElementSibling;
        }
        if (eRow.dataset.type !== "row") {
            return [eRow, eRow.querySelectorAll('[data-type="row"]')];
        }
        return eRow;
    }
    ELEMENTGetCell(_1, _2, _3) {
        let iRow, iColumn, sSection;
        if (typeof _2 === "number") {
            iColumn = _2;
            iRow = _1;
        }
        else if (typeof _2 === "string")
            sSection = _2;
        if (Array.isArray(_1)) {
            [iRow, iColumn] = _1;
        }
        sSection = sSection || "body";
        let eSection = this.GetSection(sSection);
        let _Cell = this.ELEMENTGetRow(iRow, eSection);
        if (Array.isArray(_Cell) === false) {
            _Cell = _Cell.firstElementChild;
            let i = iColumn;
            while (--i >= 0 && _Cell)
                _Cell = _Cell.nextElementSibling;
            return _Cell;
        }
        // Find row where cell is found
        const aRow = _Cell[1];
        let i = aRow.length;
        const sCIndex = "C" + iColumn + ",";
        while (--i >= 0) {
            const sColumns = aRow[i].dataset.c_row;
            if (sColumns && sColumns.indexOf(sCIndex) !== -1) { // found row where column is?
                _Cell = aRow[i].querySelector('[data-c="' + iColumn + '"]');
                return _Cell;
            }
        }
        console.assert(false, "You are trying to reach a cell [row: " + iRow + ", col:" + iColumn + "] that do not exist in row.");
        return null;
    }
    /**
     * Return element for label.
     * @param {HTMLElement} e Cell element container
     * @returns {HTMLElement} element to label or null if not found
     */
    ELEMENTGetCellLabel(e) {
        if (e && (this.is_state(1 /* HtmlValue */) || e.firstElementChild)) {
            return e.querySelector("[data-label]");
        }
        return null;
    }
    /**
     * Return value element in cell. Get value element in cell if cell has generated dom tree inside
     * @param {HTMLElement} e Cell element
     * @returns {HTMLElement} element to value or null if not found
     */
    ELEMENTGetCellValue(e) {
        if (e && (this.is_state(1 /* HtmlValue */) || e.firstElementChild)) {
            e = e.querySelector("[data-value]") || e;
        }
        return e;
    }
    INPUTInitialize(_1, _2) {
        const bCreate = typeof _1 === "boolean" ? _1 : _2 || true; // default is to create
        if (typeof _1 === "object" || _1 === void 0) {
            let oTableData = _1 || this.data;
            if (!this.m_oEdits)
                this.m_oEdits = new edit.CEdits({ table: oTableData });
            else
                this.m_oEdits.data = this.data;
        }
        this.m_oEdits.Initialize(bCreate, bCreate ? this.GetSupportElement() : null);
    }
    INPUTSet(_1, iC) {
        if (Array.isArray(_1)) {
            iC = _1[1]; // set column first because when setting row the array is destroyed
            _1 = _1[0];
        }
        else if (_1 === undefined) {
            if (!this.m_aInput || this.m_aInput[3] === -1)
                return; // if no input or if row in table data is -1 then no active input and just skip this.
            const iR = this._row_in_ui(this.m_aInput[3]);
            if (iR === -1) {
                this.m_aInput = null;
                return;
            }
            this.m_aInput[0] = iR;
            this.m_aInput[1] = this._column_in_ui(this.m_aInput[4]);
            this.m_aInput[2] = this.ELEMENTGetCell(this.m_aInput);
            return;
        }
        const a = [_1, iC, this.ELEMENTGetCell(_1, iC), this._row_in_data(_1), this._column_in_data(iC)];
        let oTD;
        const oTrigger = this.trigger; // Get trigger object with trigger logic
        if (oTrigger) {
            oTD = this._get_triggerdata();
            oTD.eElement = a[2];
            oTD.iEvent = 65548 /* BeforeSelect */;
            oTD.information = a;
            const bOk = oTrigger.Trigger(65548 /* BeforeSelect */, oTD, a);
            if (bOk === false)
                return;
        }
        this.m_aInput = a;
        if (oTrigger) {
            oTD.iEvent = 131085 /* AfterSelect */;
            oTrigger.Trigger(131085 /* AfterSelect */, oTD, a);
        }
    }
    /**
     * Clear input item, this doesnt dispach any event. it just clears value if input is created
     */
    INPUTClear() {
        if (this.m_aInput) {
            const a = [...this.m_aInput];
            this.m_aInput = [-1, -1, null, -1, -1];
            return a;
        }
        return null;
    }
    /**
     * Move active input based on specified move operation
     * @param {enumMove} e How input is moved
     * @param {boolean}  bRender if body is rendered after move, this will update complete table with new input
     */
    INPUTMove(e, bRender) {
        let [iR, iC] = this.m_aInput;
        if (e < 16 /* page_up */) {
            switch (e) {
                case 1 /* left */:
                    iC--;
                    break;
                case 2 /* right */:
                    iC++;
                    break;
                case 4 /* up */:
                    iR--;
                    break;
                case 8 /* down */:
                    iR++;
                    break;
            }
        }
        else {
            if (e === 64 /* begin */) {
                iC = 0;
                iR = 0;
            }
            else if (e === 256 /* end */) {
                iC = this.m_iColumnCount - 1;
                iR = this.m_iRowCount - 1;
            }
            else if (e === 16 /* page_up */) {
                iR -= this.m_iRowCount;
            }
            else if (e === 32 /* page_down */) {
                iR += this.m_iRowCount;
            }
        }
        if (iC < 0)
            iC = 0;
        else if (iC >= this.m_iColumnCount)
            iC = this.m_iColumnCount - 1;
        if (iR < 0)
            iR = 0;
        else if (iR >= this.m_iRowCount)
            iR = this.m_iRowCount - 1;
        if (e !== 0 /* validate */)
            this.INPUTSet(iR, iC);
        if (bRender === true)
            this.Render("body");
    }
    /*
    INPUTActivate() {
       let iRow = this._row_in_data(this.m_aInput[ 0 ]);
       let iColumn = this._column_in_data(this.m_aInput[ 1 ]);
       this.edits.Activate(iRow, iColumn, this.m_aInput[ 2 ]);
    }
    */
    /**
     * Activate input fields or field for selected row or cell.
     * If cell doesn't have the edit property set it can be edited and no activation is done for that cell
     * @param {number} iRow Row number where input is activated
     * @param {number | number[]} [_Column] Column where inputs are activated, if no column than all inputs for selected row is activated
     */
    INPUTActivate(_Row, _Column, bInput) {
        let iRow;
        if (typeof _Row === "boolean") {
            bInput = _Row;
            _Row = void 0;
        }
        if (_Row === void 0) {
            iRow = this.m_aInput[0];
            _Column = this.m_aInput[1];
        }
        else if (typeof _Row === "number")
            iRow = _Row;
        let aColumn = [];
        if (_Column === void 0) { // No column then activate complete row
            let aValue = this.data.COLUMNGetPropertyValue(true, "edit.edit", (C) => { return C?.edit?.edit === true; }); // get editable columns
            aValue.forEach(aIndex => { aColumn.push(this._column_in_ui(aIndex[0])); }); // convert column in table data to column in table text and add to array.
        }
        let iDataRow = this._row_in_data(iRow);
        let iColumn;
        if (typeof _Column === "number") {
            iColumn = _Column;
            aColumn = [_Column];
        }
        aColumn.forEach(iC => {
            let iDataColumn = this._column_in_data(iC);
            let oEdit = this.m_oEdits.GetEdit(iDataColumn);
            if (oEdit !== null) {
                let eCell = this.ELEMENTGetCell(iRow, iC);
                if (this.is_state(1 /* HtmlValue */) || eCell.firstElementChild) {
                    let e = eCell.matches("[data-value]") || eCell.querySelector("[data-value]"); // try to find element with attribute data-value
                    eCell = e || eCell;
                }
                this.m_oEdits.Activate([iDataRow, iDataColumn, iRow, iC], eCell);
                this.m_iOpenEdit++; // One more edit open
            }
        });
        if (bInput === true)
            this.INPUTSet(iRow, iColumn);
    }
    INPUTDeactivate(_Row, _Column) {
        let iCount = 0;
        if (_Row === void 0) {
        }
        if (this.m_oEdits) {
            if (_Row === false)
                this.m_oEdits.Deactivate(false);
            iCount = this.m_oEdits.Deactivate();
            if (iCount !== -1)
                this.m_iOpenEdit = 0; // Edit controls closed, set to 0
        }
        return iCount;
    }
    // 
    // Element creation and render methods ---------------------------------------------------------
    //
    /**
     * Render header for table
     * @param aHeader
     */
    render_header(aHeader) {
        let eSection = this.GetSection("header", true);
        if (!eSection)
            return null;
        this.create_header(aHeader);
        if (!eSection)
            return null;
        let bCall = this._has_render_callback("askHeaderValue", "header");
        let eRow = eSection.firstElementChild;
        eRow.dataset.row = "0";
        eRow.dataset.line = "0";
        if (eRow.dataset.type !== "row") {
            eRow = eRow.querySelector('[data-type="row"]');
            console.assert(eRow !== null, "No row element for header cells.");
        }
        let eSpan = eRow.firstElementChild;
        const iCount = aHeader.length;
        let EVT = this._get_triggerdata();
        for (let i = 0; i < iCount; i++) {
            const aName = aHeader[i][1];
            if (bCall) {
                let bRender = true;
                EVT.information = aName;
                EVT.eElement = eSpan;
                for (let j = 0; j < this.m_acallRender.length; j++) {
                    let b = this.m_acallRender[j].call(this, "beforeHeaderValue", EVT, "header", this.data.COLUMNGet(this._column_in_data(i), undefined, true));
                    if (b === false)
                        bRender = false;
                }
                if (bRender === false)
                    continue;
            }
            if (eSpan) {
                eSpan.innerText = aName[0] || aName[1]; // alias or name
                eSpan.title = eSpan.innerText;
                eSpan.dataset.c = aHeader[i][0].toString(); // set column index
                if (bCall)
                    this.m_acallRender.forEach((call) => { call.call(this, "afterHeaderValue", EVT, "header", this.data.COLUMNGet(this._column_in_data(i), undefined, true)); });
                eSpan = eSpan.nextElementSibling;
            }
        }
        return eSection;
    }
    render_body(_1, eSection) {
        let EVT = this._get_triggerdata();
        eSection = eSection || this.GetSection("body");
        let aResult;
        let aStyle = this.data.COLUMNGetPropertyValue(this.m_aColumnPhysicalIndex, "style", true); // position data for columns
        const bSetValue = this.is_state(8 /* SetValue */); // If try to set value for html element, when you have INPUT elements in column.
        const bSetElementIfValue = this.is_state(64 /* SetElementIfValue */);
        if (Array.isArray(_1)) {
            aResult = _1;
            this.SetCellError(); // clear errors
            this.m_aRowBody = aResult[0]; // keep body data
            this.m_aRowPhysicalIndex = aResult[1]; // keep index to rows
        }
        if (eSection === null)
            return;
        let bCall = this._has_render_callback("askCellValue", "body");
        const bCancelRowRender = this.is_state(128 /* CancelRowRender */);
        let eRow = eSection.firstElementChild;
        if (eRow === null)
            return;
        if (eRow.dataset.record !== "1") {
            while ((eRow = eRow.nextElementSibling) !== null && eRow.dataset.record !== "1")
                ;
            console.assert(eRow !== null, "No rows to render body");
        }
        const oRowRows = this.m_oRowRows;
        this.m_aRowBody.forEach((aRow, iIndex) => {
            let iRow = this.m_aRowPhysicalIndex[iIndex], s, o;
            let eR = eRow; // eRow is the main row, but row could hold many child rows with values
            eR.dataset.row = iRow.toString();
            eR.dataset.line = iIndex.toString();
            for (let iR = 0; iR < oRowRows.length; iR++) {
                if (eR.dataset.type !== "row") {
                    eR = eR.querySelector('[data-i="' + iR.toString() + '"]');
                    console.assert(eR !== null, "No row element for column cells.");
                }
                else { // rows is not places in a container, just go to next or previous row to get rows for record
                    const iRowElement = parseInt(eR.dataset.i, 10);
                    if (iRowElement !== iR) { // are we not at the same row as current row in CRowRows ?
                        if (iR < iRowElement) { // do we have rows inserted before main record row ?  (iRowElement for record is then over 0)
                            while ((eR = eR.previousElementSibling) !== null && eR.dataset.i !== iR.toString())
                                ;
                        }
                        else {
                            while ((eR = eR.nextElementSibling) !== null && eR.dataset.i !== iR.toString())
                                ;
                        }
                    }
                }
                const aColumn = oRowRows.GetRowColumns(iR);
                let eColumn = eR.firstElementChild;
                const iTo = aColumn.length;
                for (let i = 0; i < iTo; i++) {
                    const iC = this._column_in_ui(aColumn[i]); // index to column in table data
                    let e = this.ELEMENTGetCellValue(eColumn); // get cell value element
                    let sValue = aRow[iC]; // value for active cell
                    //const oColumn = this.data.COLUMNGet( this._column_in_data( i ), undefined, true );
                    const oColumn = this.data.COLUMNGet(aColumn[i], undefined, true); // get column information for current column that is to be rendered
                    const callRenderer = this.COLUMNGetRenderer(iC); // get renderer for cell if custom rendering
                    if (bCall) {
                        let bRender = true;
                        for (let j = 0; j < this.m_acallRender.length; j++) {
                            EVT.eElement = e;
                            EVT.information = sValue;
                            let b = this.m_acallRender[j].call(this, "beforeCellValue", EVT, "body", oColumn);
                            if (b === false)
                                bRender = false;
                        }
                        if (bRender === false)
                            continue;
                    }
                    if (bCancelRowRender)
                        continue;
                    if (Object.keys(aStyle[i][1]).length > 0)
                        Object.assign(e.style, aStyle[i][1]);
                    if (bSetValue === false) {
                        if (callRenderer) {
                            callRenderer.call(this, e, sValue, [[iIndex, i], [iRow, iC], oColumn]); // custom render for column
                        }
                        else if (sValue !== null && sValue != void 0) {
                            if (e.dataset.c)
                                e.innerText = sValue.toString();
                            else {
                                while ((e = e.firstElementChild) !== null) {
                                    if (e.dataset.c) {
                                        e.innerText = sValue.toString();
                                        break;
                                    }
                                }
                            }
                        }
                        else if (e.hasAttribute("value") === false)
                            e.innerText = " ";
                    }
                    else {
                        if (callRenderer) {
                            callRenderer.call(this, e, sValue, [[iIndex, i], [iRow, iC], oColumn]); // custom render for column
                        }
                        else {
                            if (sValue !== null && sValue != void 0) {
                                if ("value" in e) {
                                    e.setAttribute("value", sValue.toString());
                                    if (bSetElementIfValue)
                                        e.innerText = sValue.toString(); // also set element value if state "SetElementIfValue" is set. LI element is one sample
                                }
                                else
                                    e.innerText = sValue.toString();
                            }
                            else if (e.hasAttribute("value") === false) {
                                e.innerText = " ";
                            }
                            e = this.ELEMENTGetCellLabel(eColumn);
                            if (e && !e.firstChild)
                                e.innerText = oColumn.alias;
                        }
                    }
                    if (bCall)
                        this.m_acallRender.forEach((call) => { call.call(this, "afterCellValue", sValue, eColumn, oColumn); });
                    eColumn = eColumn.nextElementSibling;
                }
            }
            while ((eRow = eRow.nextElementSibling) !== null && eRow.dataset.record !== "1")
                ; // go to next sibling root row
        });
        return eSection;
    }
    /**
     * Restore states for each cell in body.
     * If there are changes to cells in body. new cells are selected, there are errors etc. Classes that marks
     * the state for each cell needs to be updated. This method do not change any value in cell but restore
     * cell states to display active state for each cell.
     */
    render_body_restore() {
        //let _Selected: string | string[] = 
        let aClass = [];
        let a = CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_input");
        if (a) {
            if (typeof a === "string")
                aClass.push(a);
            else
                aClass.push(...a);
        }
        a = CTableData.GetPropertyValue(this.m_oStyle, false, "class_selected");
        if (a) {
            if (typeof a === "string")
                aClass.push(a);
            else
                aClass.push(...a);
        }
        let eSection = this.GetSection("body", true);
        if (eSection === null)
            return;
        let eRow = eSection.firstElementChild;
        while (eRow && eRow.dataset.record === "1") {
            let aRow = [eRow];
            if (eRow.dataset.type !== "row") {
                aRow = eRow.querySelectorAll('[data-type="row"]');
            }
            aRow.forEach(eR => {
                let eColumn = eR.firstElementChild;
                while (eColumn) {
                    let e = this.ELEMENTGetCellValue(eColumn);
                    aClass.forEach(s => { e.classList.remove(s); });
                    eColumn = eColumn.nextElementSibling;
                }
            });
            eRow = eRow.nextElementSibling;
        }
        this.render_selected();
        if (this.m_aValueError.length)
            this.render_value_error();
        if (this.m_aInput)
            this.render_input();
        return;
    }
    /**
     * Render value in cell. Cell value is taken from table data
     * @param {number | number[]} _Row Index to row or array with index for row and column
     * @param {number} [iColumn] Index to column. if `_Row` is array then iColumn isn't used
     */
    render_value(_Row, iColumn) {
        if (Array.isArray(_Row))
            [_Row, iColumn] = _Row;
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_value") || "";
        let eElement = this.ELEMENTGetCellValue(this.ELEMENTGetCell(_Row, iColumn));
        let sValue = this.data.CELLGetValue(this._row_in_data(_Row), this._column_in_data(iColumn), 1 /* Raw */ | 2 /* Format */);
        let bValue = false;
        const s = eElement.tagName;
        if (s === "INPUT" || s === "TEXTAREA" || s === "METER")
            bValue = true;
        const callRenderer = this.COLUMNGetRenderer(iColumn);
        if (callRenderer) {
            const iDataColumn = this._column_in_data(iColumn);
            const oColumn = this.data.COLUMNGet(this._column_in_data(iDataColumn), undefined, true);
            callRenderer.call(this, eElement, sValue, [[_Row, iColumn], [this._row_in_data(_Row), iDataColumn], oColumn]); // custom render for column
        }
        else if (sValue !== null && sValue != void 0) {
            if (bValue) {
                eElement.setAttribute("value", sValue.toString());
            }
            else
                eElement.innerText = sValue.toString();
        }
        else {
            const s = eElement.tagName;
            if (bValue) {
                eElement.setAttribute("value", "");
            }
            else
                eElement.innerText = " ";
        }
    }
    /**
     * Render selected cell or cells
     * @param {[number,number][]} [aSelected] Cells to select or if not specified then internal selected cell if any is rendered as selected.
     */
    render_selected(aSelected) {
        aSelected = aSelected || this.selected;
        if (aSelected.length === 0)
            return;
        let EVT; // EventDataTable
        let sStyle = CTableData.GetPropertyValue(this.m_oStyle, false, "cell_selected") || ""; // style
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_selected") || ""; // class
        let bCall = this.m_acallRender.length ? true : false;
        if (bCall === true) {
            EVT = this._get_triggerdata();
        }
        aSelected.forEach((a) => {
            let e = this.ELEMENTGetCell(a);
            let bRender = true;
            if (bCall) {
                EVT.information = a;
                EVT.eElement = e;
                for (let j = 0; j < this.m_acallRender.length; j++) {
                    let b = this.m_acallRender[j].call(this, "beforeSelected", EVT, "body", this.data.COLUMNGet(this._column_in_data(a[1])));
                    if (b === false)
                        bRender = false;
                }
            }
            if (e && bRender) {
                if (sStyle)
                    e.style.cssText = sStyle;
                if (sClass)
                    e.className = sClass;
            }
        });
    }
    render_input() {
        this.INPUTMove(0 /* validate */);
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_cell_input") || CTableData.GetPropertyValue(this.m_oStyle, false, "class_selected");
        const eElement = this.ELEMENTGetCellValue(this.m_aInput[2]);
        let EVT; // EventDataTable
        let bCall = this.m_acallRender.length ? true : false;
        if (bCall === true) {
            EVT = this._get_triggerdata();
            EVT.information = this.m_aInput;
            EVT.eElement = eElement;
            for (let j = 0; j < this.m_acallRender.length; j++) {
                let b = this.m_acallRender[j].call(this, "beforeInput", EVT, "body", this.data.COLUMNGet(this._column_in_data(this.m_aInput[1])));
                if (b === false)
                    return;
            }
        }
        if (sClass) {
            eElement.classList.add(sClass);
        }
    }
    render_value_error(aValueError) {
        let oColumn;
        if (Array.isArray(aValueError)) {
            if (Array.isArray(aValueError[0]) === false)
                aValueError = [aValueError];
        }
        else
            aValueError = this.m_aValueError;
        const iErrorLLength = aValueError.length;
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_error"); // cell class for error
        let sClassValue = CTableData.GetPropertyValue(this.m_oStyle, false, "class_value_error"); // value class for error
        if (sClass || sClassValue) {
            let bCall = this._has_render_callback("askErrorValue", "body"); // ask for external render calls
            let aClass = sClass ? sClass.split(" ") : null;
            let aClassValue = sClassValue ? sClassValue.split(" ") : null;
            for (let i = 0; i < iErrorLLength; i++) {
                let bRender = true;
                const aError = aValueError[i];
                let eCell = this.ELEMENTGetCell(aError, "body");
                if (bCall) { // external rendering ?
                    oColumn = this.data.COLUMNGet(this._column_in_data(aError[1]), undefined, true);
                    for (let j = 0; j < this.m_acallRender.length; j++) {
                        let b = this.m_acallRender[j].call(this, "beforeErrorValue", aError, eCell, oColumn);
                        if (b === false)
                            bRender = false;
                    }
                    if (bRender === false)
                        continue;
                }
                if (sClass && eCell.classList.contains(aClass[0]) === false) { // compare if first class in array is set to element
                    //eCell.className += " " + sClass;
                    eCell.className = (eCell.className + " " + sClass).trim();
                }
                if (aClassValue && this.is_state(1 /* HtmlValue */)) {
                    let e = this.ELEMENTGetCellValue(eCell);
                    if (e && e.classList.contains(aClassValue[0]) === false) {
                        e.className = (e.className + " " + sClassValue).trim();
                    }
                }
                // external rendering?
                if (bCall)
                    this.m_acallRender.forEach((call) => { call.call(this, "afterErrorValue", aError, eCell, oColumn); });
            }
        }
    }
    /**
     * Creates section elements for parts used by `CUITableText`.
     * Sections rendered are found in member m_aSection
     * @param {HTMLElement} [eComponent] Container section
     */
    create_sections(eComponent) {
        eComponent = eComponent || this.m_eComponent;
        let self = this;
        // local function used to append sections
        let append_section = (eComponent, sName, sClass) => {
            let eParent = eComponent;
            let aSection = sName.split("."); // if section name is split with . then it is grouped, name before . creates div group
            if (aSection.length === 2) { // found group name ?
                sName = aSection[1]; // !important - if section is split with . then the section name is the later (after ".""),
                let _Group = CTableData.GetPropertyValue(this.m_oStyle, false, "html_group");
                _Group = this._split(_Group, "div");
                //const sGroup = aSection[ 0 ];                                      // get group name found in active section array
                let eGroup = eComponent.querySelector(_Group[0] + "[data-group='" + aSection[0] + "']");
                if (eGroup === null) { // is group not created ?
                    eGroup = document.createElement(_Group[0]);
                    if (_Group.length > 1)
                        eGroup.className = _Group[1];
                    if (_Group.length > 2)
                        eGroup.style.cssText = _Group[2];
                    eGroup.dataset.group = aSection[0];
                    eParent.appendChild(eGroup); // add group to parent
                }
                eParent = eGroup; // group is parent to section
            }
            let _HtmlSection = "section"; // default section element name is "section"
            switch (sName) {
                case "header":
                    _HtmlSection = CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_header") || _HtmlSection;
                    break;
                case "body":
                    _HtmlSection = CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_body") || _HtmlSection;
                    break;
                case "footer":
                    _HtmlSection = CTableData.GetPropertyValue(this.m_oStyle, false, "html_section_footer") || _HtmlSection;
                    break;
            }
            const aSectionElement = this._create_section(_HtmlSection, sName);
            let eSection = aSectionElement[1];
            //         let eSection = document.createElement(sHtmlSection);                  // create section
            //         eSection.dataset.section = sName;                                     // set section name, used to access section
            //         eSection.dataset.widget = CUITableText.s_sWidgetName;
            if (sName === "body" && this.is_state(32 /* DisableFocus */) === false)
                eSection.tabIndex = -1; // tab index on body to enable keyboard movement
            let a = sClass.split(" ");
            a.push(CUITableText.s_sWidgetName + "-" + sName);
            eSection.classList.add(...a);
            // configure event listeners
            eSection.addEventListener("click", (e) => {
                let eSink = e.currentTarget;
                while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                    eSink = eSink.parentElement;
                if (!eSink)
                    return;
                self._on_action("click", e, eSink.dataset.section);
            });
            if (sName === "body") { // body section has more event listeners
                // configure event listeners
                eSection.addEventListener("keydown", (e) => {
                    let eSink;
                    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                        let oEdit = this.m_oEdits.GetEdit(e.target); // try to get edit object for edit element
                        if (!oEdit || oEdit.IsMoveKey(e.keyCode, e) === false) {
                            return;
                        }
                        eSink = self.m_aInput[2];
                    }
                    else
                        eSink = e.currentTarget;
                    while (eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("keydown", e, eSink.dataset.section);
                }, true);
                eSection.addEventListener("focus", (e) => {
                    let eElement = e.srcElement;
                    if (eElement.tagName === "INPUT") {
                        const a = this.GetRowCol(eElement);
                        if (this.m_aInput[0] === a[0] && this.m_aInput[1] === a[1])
                            return; // no need to set input if same as active input
                        let oEdit = this.m_oEdits.GetEdit(eElement); // try to get edit object for edit element
                        if (oEdit)
                            self.INPUTSet(oEdit.GetPositionRelative());
                    }
                    let eSink = e.currentTarget;
                    while (eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("focus", e, eSink.dataset.section);
                }, true);
                eSection.addEventListener("focusout", (e) => {
                    let eSink = e.currentTarget;
                    while (eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("focusout", e, eSink.dataset.section);
                });
                // configure event listeners
                eSection.addEventListener("dblclick", (e) => {
                    let eSink = e.currentTarget;
                    while (eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("dblclick", e, eSink.dataset.section);
                });
                eSection.addEventListener("change", (e) => {
                    let eSink;
                    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
                        let oEdit = this.m_oEdits.GetEdit(e.target); // try to get edit object for edit element
                        if (oEdit && e.target.matches("[data-commit]")) {
                            oEdit.SetValue(e.target);
                            if (oEdit.IsModified()) {
                                let _Value = oEdit.GetValue(true);
                                this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: 1 /* Edit */, edit: oEdit, eElement: e.target, browser_event: "change" });
                            }
                        }
                    }
                    else
                        eSink = e.currentTarget;
                    while (eSink && eSink.dataset.section === undefined && eSink.dataset.widget !== CUITableText.s_sWidgetName)
                        eSink = eSink.parentElement;
                    if (!eSink)
                        return;
                    self._on_action("change", e, eSink.dataset.section);
                }, true);
            }
            let bOk = this._has_create_callback("afterCreate", { data: this.data, dataUI: this, eElement: eSection }, sName);
            if (bOk !== false)
                eParent.appendChild(eSection);
            return [sName, eSection];
        };
        let sClass = CTableData.GetPropertyValue(this.m_oStyle, false, "class_section") || CUITableText.s_sWidgetName;
        // Create elements for sections that do not have elements stored
        for (let i = 0; i < this.m_aSection.length; i++) {
            let _Name = this.m_aSection[i];
            if (typeof _Name === "string") {
                this.m_aSection[i] = append_section(eComponent, _Name, sClass);
            }
        }
        return eComponent;
    }
    /**
     * Create header element with columns
     * @param aHeader
     */
    create_header(aHeader, callback) {
        let eSection = this.GetSection("header", true);
        if (eSection === null)
            return null;
        eSection.innerHTML = ""; // clear section
        let sClass;
        let iCount = aHeader.length;
        let _HtmlRow = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_header") || CTableData.GetPropertyValue(this.m_oStyle, false, "html_row") || "div";
        let _Cell = CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell_header");
        _Cell = this._split(_Cell, "span");
        let aRow = this._create_row(_HtmlRow);
        aHeader.forEach((a, i) => {
            if (a[1][2] !== false) { // second value in aHeader has selected properties for column header (if third values is false that means that header isn't generated)
                let eSpan = document.createElement(_Cell[0]);
                if (_Cell.length > 1)
                    eSpan.className = _Cell[1];
                if (_Cell.length > 2)
                    eSpan.style.cssText = _Cell[2];
                aRow[1].appendChild(eSpan);
            }
        });
        eSection.appendChild(aRow[0]);
        return eSection;
    }
    /**
     * Create body, body is the section that displays values from table data. Tables are shown as rows with vales for each value in table
     * @param {unknown[][]} aBody value data that elements are created for
     */
    create_body(aBody) {
        aBody = aBody || this.m_aRowBody;
        let eSection = this.GetSection("body", true);
        if (eSection === null)
            return null;
        eSection.innerHTML = ""; // clear body
        this.m_iRowCount = aBody.length; // set number of rows in body
        if (this.m_iRowCount === 0)
            return eSection; // no rows, just skip  creation
        let split_item = (_item, sDefault) => {
            if (!_item)
                _item = sDefault;
            else if (Array.isArray(_item)) {
                let a = [];
                _item.forEach(s => {
                    a.push(this._split(s));
                });
                _item = a;
            }
            else if (_item.indexOf(".") !== -1) {
                _item = this._split(_item);
            }
            return _item;
        };
        //      let sClass: string;
        let sStyle = CTableData.GetPropertyValue(this.m_oStyle, false, "value") || null;
        let _HtmlRowComplete = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_complete");
        let _HtmlRow = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body") || CTableData.GetPropertyValue(this.m_oStyle, false, "html_row") || "div";
        let _HtmlBefore = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body_before") || _HtmlRow;
        let _HtmlAfter = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body_after") || _HtmlRow;
        let _HtmlContainer = CTableData.GetPropertyValue(this.m_oStyle, false, "html_row_body_container"); // if row is more than one row this could be used to group rows within container element
        let _HtmlCell = CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell"); // span is default for cell
        _HtmlCell = this._split(_HtmlCell, "span");
        //      let sHtmlCell: string = <string>CTableData.GetPropertyValue(this.m_oStyle, false, "html_cell") || "span"; // span is default for cell
        let _HtmlValue = CTableData.GetPropertyValue(this.m_oStyle, false, "html_value");
        if (typeof _HtmlValue === "string")
            _HtmlValue = _HtmlValue.trim();
        this.set_state(_HtmlValue, 1 /* HtmlValue */); // set state if cell is a dom tree or not
        let set_row_attr = (eRow, iRow, aColumn, _HtmlCell, _HtmlValue, sStyle) => {
            eRow.dataset.r = iRow.toString();
            eRow.dataset.c_row = "C" + aColumn.join(",C") + ",";
            aColumn.forEach((i, j) => {
                let e;
                let eCell;
                let iColumn = this._column_in_ui(i);
                if (iColumn === -1)
                    iColumn = j;
                if (typeof _HtmlCell === "string") {
                    eCell = e = document.createElement(_HtmlCell);
                }
                else if (Array.isArray(_HtmlCell)) {
                    _HtmlCell.forEach((a, i) => {
                        if (Array.isArray(a)) {
                            e = document.createElement(a[0]);
                            if (a.length > 1)
                                e.className = a[1];
                            if (a.length > 2)
                                e.style.cssText = a[2];
                            if (eCell === undefined)
                                eCell = e;
                            else
                                eCell.appendChild(e);
                        }
                        else {
                            if (i === 0)
                                e = eCell = document.createElement(a);
                            else if (i === 1)
                                eCell.className = a;
                            else if (i === 2)
                                eCell.style.cssText = a;
                        }
                    });
                }
                /*
                let e = document.createElement(sHtmlCell);
                if( sClass ) e.className = sClass;
                */
                e.dataset.c = iColumn.toString();
                const oFormat = this.m_aColumnFormat[iColumn];
                if (typeof oFormat.html === "string")
                    e.innerHTML = oFormat.html;
                else if (_HtmlValue) {
                    let s;
                    if (typeof _HtmlValue === "string")
                        s = _HtmlValue;
                    else {
                        for (let iValueIndex = 0; iValueIndex < _HtmlValue.length; iValueIndex++) {
                            const a = _HtmlValue[iValueIndex];
                            if (a[0] === i) {
                                s = a[1];
                                break;
                            }
                            else if (a[0] === -1)
                                s = a[1]; // default value has -1
                        }
                    }
                    e.innerHTML = s;
                }
                if (sStyle)
                    e.style.cssText = sStyle;
                eRow.appendChild(eCell);
            });
        };
        // ## oRowRows is a temporary CRowRows object used to make it easier to create the markup tree for row in browser
        const oRowRows = this.m_oRowRows || this.data.GetRowRows(); // get temporary CRowRows object, do not store this. Works only as CTableData isn't modified
        let eFragment = document.createDocumentFragment(); // fragment used to collect markup that is added to table, markup is cloned into page
        let eContainer;
        let aRowMain = _HtmlRowComplete ? this._create_row(_HtmlRowComplete) : this._create_row(_HtmlRow);
        let aContainer;
        if (_HtmlContainer) {
            aContainer = this._create_container(_HtmlContainer);
            eContainer = aContainer[1];
            eFragment.appendChild(aContainer[0]);
        }
        else if (_HtmlRowComplete) {
            eFragment.appendChild(aRowMain[0]);
            eContainer = eFragment;
        }
        else {
            eContainer = eFragment;
        } // rows without container, set container to fragment
        let iLevelIndex = 0;
        const aRowLevel = oRowRows.GetRowLevel();
        while (aRowLevel[iLevelIndex] < 0) { // rows before main row
            let aRow = this._create_row(_HtmlBefore);
            oRowRows.SetRowElement(iLevelIndex, aRow[1]);
            set_row_attr(aRow[1], aRowLevel[iLevelIndex], oRowRows.GetRowColumns(iLevelIndex), _HtmlCell, _HtmlValue, sStyle);
            aRow[1].dataset.i = iLevelIndex.toString();
            iLevelIndex++;
        }
        oRowRows.SetRowElement(iLevelIndex, aRowMain[1]); // main row
        if (!_HtmlRowComplete) { // If no complete row then render all columns, complete row will need toe external code to manage columns
            set_row_attr(aRowMain[1], aRowLevel[iLevelIndex], oRowRows.GetRowColumns(iLevelIndex), _HtmlCell, _HtmlValue, sStyle);
        }
        aRowMain[1].dataset.i = iLevelIndex.toString();
        iLevelIndex++;
        if (aRowLevel[iLevelIndex] > 0) { // rows after main row
            let aRow = this._create_row(_HtmlAfter);
            oRowRows.SetRowElement(iLevelIndex, aRow[1]);
            set_row_attr(aRow[1], aRowLevel[iLevelIndex], oRowRows.GetRowColumns(iLevelIndex), _HtmlCell, _HtmlValue, sStyle);
            aRow[1].dataset.i = iLevelIndex.toString();
            iLevelIndex++;
        }
        // ## Build row tree
        if (!aContainer) { // no container ?
            aContainer = [null, eSection]; // if no container, then section will be container for all rows. This is used when row exists in html tables
            aRowMain[1].dataset.record = "1"; // Set main row to record when no container element is used
        }
        // Connect rows with container
        let iTo = oRowRows.length;
        for (let i = 0; i < iTo; i++) {
            eContainer.appendChild(oRowRows.GetRowElement(i));
        }
        // Create rows by cloning them into body
        for (let i = 0; i < this.m_iRowCount; i++) {
            eSection.appendChild(eFragment.cloneNode(true));
        }
        if (this.dispatch) {
            this.dispatch.NotifyConnected(this, { command: "update.body", data: { start: this.m_iRowStart, max: this.m_iRowCountMax, count: this.m_iRowCount, trigger: 65538 /* AfterCreate */ } });
        }
        return eSection;
    }
    /**
     * Create container for each row or row "row-tree" of elements from string or array with strings
     * @param {string | string[]} aContainer element names for  row tree
     */
    _create_container(aContainer) {
        if (!Array.isArray(aContainer))
            aContainer = [aContainer];
        let eRoot = null, eRow, eParent;
        for (let i = 0; i < aContainer.length; i++) {
            const sRow = aContainer[i].trim();
            if (sRow[0] === "<") { // markup template ?
            }
            const a = this._split(aContainer[i]); // aContainer[i].split(".");
            eRow = document.createElement(a[0]);
            if (eParent)
                eParent.appendChild(eRow);
            if (a.length > 1) {
                eRow.className = a[1];
            }
            if (a.length > 2) {
                eRow.style.cssText = a[2];
            }
            if (eRoot === null) {
                eRoot = eRow;
            }
            eParent = eRow;
        }
        eRoot.dataset.record = "1";
        return [eRoot, eRow];
    }
    /**
     * Create row or row "row-tree" of elements from string or array with strings
     * @param {string | string[]} aRow element names for row tree. If row is array the first array element
     * is used as class and second is used as style
     */
    _create_row(aRow) {
        if (typeof aRow === "string")
            aRow = [aRow];
        // let eRoot: HTMLElement = null, eRow: HTMLElement, eParent: HTMLElement;
        let fCreateFromElement = (eRow) => {
            let eMarkup = aRow.content.cloneNode(true);
            let e = eMarkup.firstElementChild;
            e.dataset.type = "row";
            return [e, e];
        };
        let fCreateFromArray = (aRow) => {
            let eRoot = null, eRow, eParent;
            for (let i = 0; i < aRow.length; i++) {
                const a = this._split(aRow[i]); //   aRow[i].split(".");
                eRow = document.createElement(a[0]);
                if (eParent)
                    eParent.appendChild(eRow);
                if (a.length > 1) {
                    eRow.className = a[1];
                }
                if (a.length > 2) {
                    eRow.style.cssText = a[2];
                }
                if (eRoot === null) {
                    eRoot = eRow;
                }
                eParent = eRow; // parent is always the last row created, may be used when rows has a tree markup
            }
            eRow.dataset.type = "row";
            return [eRoot, eRow];
        };
        if (typeof aRow !== "string" && Array.isArray(aRow) === false) {
            return fCreateFromElement(aRow);
        }
        return fCreateFromArray(aRow);
        /*
              for( let i = 0; i < aRow.length; i++ ) {
                 const a = this._split( aRow[i] ); //   aRow[i].split(".");
                 eRow = document.createElement(a[0]);
                 if( eParent ) eParent.appendChild( eRow );
                 if( a.length > 1 ) { eRow.className = a[1]; }
                 if( a.length > 2 ) { eRow.style.cssText = a[2]; }
        
                 if( eRoot === null ) {
                    eRoot = eRow;
                 }
                 eParent = eRow; // parent is always the last row created, may be used when rows has a tree markup
              }
        
              eRow.dataset.type = "row";
              return [eRoot,eRow];
              */
    }
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
    _create_row_extra(aRow, oPosition, aRows) {
        const eRecordRoot = aRows[0][1]; // main record element row
        if (!Array.isArray(aRow))
            aRow = [aRow];
        let eRoot = null, eRow, eParent;
        for (let i = 0; i < aRow.length; i++) {
            const row = aRow[i];
            if (typeof row === "number") { // travel root tree to generate row?
                eParent = eRoot || eRecordRoot;
                let j = row;
                while (--j >= 0) {
                    eParent = eParent.firstElementChild;
                    console.assert(eParent !== null, "Parent error, make sure correct number of parent exists: total = " + row + ", failed at: " + (j + 1));
                }
            }
            else {
                //const a = row.split(".");
                const a = this._split(row);
                eRow = document.createElement(a[0]);
                if (eParent)
                    eParent.appendChild(eRow);
                if (a.length > 1) {
                    eRow.className = a[1];
                }
                if (a.length > 2) {
                    eRow.style.cssText = a[2];
                }
                if (eRoot === null) {
                    eRoot = eRow;
                }
                eParent = eRow;
            }
        }
        eRow.dataset.type = "row"; // set "data-type"
        eRow.dataset.position_row = oPosition.row.toString(); // set "data-position_row"
        return [oPosition.row, eRoot, eRow];
    }
    /*
     * Row attributes
     * data-type = row : all rows that has columns. If getting row from clicked element this is the first element to search for
     * data-record = main row for record. this is the root for complete row in result
     * data-position_row = position.row
     */
    /**
     * Create row or row "row-tree" of elements from string or array with strings
     * @param {string | string[]} aRow element names for  row tree
     */
    _create_section(aSection, sName) {
        if (typeof aSection === "string")
            aSection = [aSection];
        let eRoot = null, eSection, eParent;
        for (let i = 0; i < aSection.length; i++) {
            //const a = aSection[i].split(".");
            const a = this._split(aSection[i], "div");
            eSection = document.createElement(a[0]);
            if (eParent)
                eParent.appendChild(eSection);
            if (a.length > 1) {
                eSection.className = a[1];
            }
            if (a.length > 2) {
                eSection.style.cssText = a[2];
            }
            if (eRoot === null) {
                eSection.dataset.root = "1"; // Set first item as root item
            }
            eRoot = eSection;
            eRoot.dataset.widget = CUITableText.s_sWidgetName;
        }
        eSection.dataset.section = sName;
        return [eRoot, eSection];
    }
    _has_create_callback(sName, v, sSection, call) {
        let a = call ? [call] : this.m_acallCreate;
        let bCall = a !== undefined;
        if (bCall) {
            for (let i = 0; i < a.length; i++) {
                let b = a[i].call(this, sName, v, sSection);
                if (b === false)
                    bCall = false;
            }
        }
        return bCall;
    }
    _has_render_callback(sName, sSection) {
        let bCall = this.m_acallRender !== undefined;
        if (bCall) {
            for (let i = 0; i < this.m_acallRender.length; i++) {
                let b = this.m_acallRender[i].call(this, sName, sSection);
                if (b === false)
                    bCall = false;
            }
        }
        return bCall;
    }
    /**
     * Call action callbacks
     * @param  {string}  sType Type of action
     * @param  {Event}   e        event data if any
     * @param  {string}  sSection section name
     * @return {unknown} if false then disable default action
     */
    _action(sType, e, sSection) {
        if (this.m_acallAction && this.m_acallAction.length > 0) {
            let EVT = this._get_triggerdata();
            EVT.eEvent = e;
            let i = 0, iTo = this.m_acallAction.length;
            let callback = this.m_acallAction[i];
            while (i++ < iTo) {
                let bResult = callback.call(this, sType, EVT, sSection);
                if (bResult === false)
                    return false;
            }
        }
    }
    /**
     * Handle element events for ui table text. Events from elements calls this method that will dispatch it.
     * @param {string} sType event name
     * @param {Event} e event data
     * @param {string} sSection section name, table text has container elements with a name (section name)
     */
    _on_action(sType, e, sSection) {
        if (this.m_acallAction && this.m_acallAction.length > 0) {
            let EVT = this._get_triggerdata();
            EVT.eEvent = e;
            let i = 0, iTo = this.m_acallAction.length;
            let callback = this.m_acallAction[i];
            while (i++ < iTo) {
                let bResult = callback.call(this, sType, EVT, sSection);
                if (bResult === false)
                    return;
            }
        }
        if (sSection === "header") {
            //this.GetRowCol(<HTMLElement>e.srcElement);
        }
        else if (sSection === "body") {
            if (sType === "click") {
                let aCell = this.GetRowCol(e.srcElement);
                if (aCell && this.m_aInput && (aCell[0] !== this.m_aInput[0] || aCell[1] !== this.m_aInput[1])) {
                    this.INPUTSet(aCell);
                    this.INPUTMove(0 /* validate */, true);
                    if (this.is_state(16 /* SetOneClickActivate */)) { // is state set to activate 
                        if (this.INPUTDeactivate() !== -1) {
                            this.INPUTActivate();
                        }
                    }
                }
            }
            else if (sType === "keydown" && this.m_aInput) {
                let eMove;
                if (e.keyCode === 9) {
                    eMove = e.shiftKey === true ? 1 /* left */ : 2 /* right */;
                    e.preventDefault();
                }
                else if (e.keyCode === 13 || e.keyCode === 39) {
                    eMove = 2 /* right */;
                }
                else if (e.keyCode === 37)
                    eMove = 1 /* left */;
                else if (e.keyCode === 38)
                    eMove = 4 /* up */;
                else if (e.keyCode === 40)
                    eMove = 8 /* down */;
                else if (e.keyCode === 36)
                    eMove = 64 /* begin */;
                else if (e.keyCode === 35)
                    eMove = 256 /* end */;
                else if (e.keyCode === 33)
                    eMove = 16 /* page_up */;
                else if (e.keyCode === 34)
                    eMove = 32 /* page_down */;
                else if (e.keyCode === 27)
                    eMove = 128 /* disable */;
                if (eMove) {
                    if (this.m_iOpenEdit > 0) { // any open edit elements?
                        let oEdit = this.edits.GetEdit(e.srcElement) || this.edits.GetEdit(this.m_aInput);
                        if (oEdit && oEdit.IsModified() === true) { // Is value modified
                            let bOk = true;
                            let _Value = oEdit.GetValue(true);
                            this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: 1 /* Edit */, edit: oEdit, eElement: e.srcElement, browser_event: sType });
                        }
                        if (eMove == 128 /* disable */)
                            this.INPUTDeactivate(false);
                        else {
                            this.INPUTDeactivate(); // close all edits
                        }
                        if (oEdit)
                            this.render_value(oEdit.GetPositionRelative());
                        this.GetSection("body").focus({ preventScroll: true }); // Set focus to body, closing edit elements will make it loose focus
                        this.INPUTMove(eMove, true);
                        if (this.is_state(16 /* SetOneClickActivate */)) { // is state set to activate 
                            this.INPUTActivate();
                        }
                    }
                    else {
                        this.INPUTMove(eMove, true);
                    }
                    //this.INPUTActivate();   NOTE: acitvate or not activate edit on move keys?                   
                }
                else if (this.m_oEdits && e.keyCode >= 32) { // space and above
                    let oEdit = this.m_oEdits.GetEdit(this._column_in_data(this.m_aInput[1])); // Get edit for column (second value in input array)
                    if (oEdit !== null) {
                        if (oEdit.IsOpen() === false) {
                            if (this.INPUTDeactivate() !== -1) {
                                this.INPUTActivate();
                            }
                        }
                    }
                }
            }
            else if (sType === "dblclick" && this.m_aInput) { // open editor if any on double click
                if (this.INPUTDeactivate() !== -1) {
                    this.INPUTActivate();
                }
            }
            else if (sType === "focus") {
                if (this.m_aInput) {
                    const a = this.GetRowCol(e.srcElement);
                    if (a && (a[1] != this.m_aInput[1] || a[0] != this.m_aInput[0])) {
                        let oEdit = this.edits.GetEdit(this.m_aInput);
                        if (oEdit && oEdit.IsModified() === true) {
                            let _Value = oEdit.GetValue();
                            this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: 1 /* Edit */, edit: oEdit, eElement: e.srcElement, browser_event: sType });
                            this.render_value(oEdit.GetPositionRelative());
                        }
                        this.INPUTDeactivate();
                        this.INPUTActivate(a[0], a[1], true);
                    }
                }
            }
            else if (sType === "focusout") {
                if (e.srcElement.dataset.input === "1" || e.srcElement.matches("[data-value]")) {
                    let oEdit = this.edits.GetEdit(e.srcElement) || this.edits.GetEdit(this.m_aInput);
                    if (oEdit && oEdit.IsModified() === true) { // Is value modified
                        let bOk = true;
                        let _Value = oEdit.GetValue();
                        this.SetCellValue(oEdit.GetPositionRelative(), _Value, { iReason: 1 /* Edit */, edit: oEdit, eElement: e.srcElement, browser_event: sType });
                        this.INPUTDeactivate();
                        this.render_value(oEdit.GetPositionRelative());
                    }
                }
            }
        }
    }
    /**
     * Split element string before creating markup for t able
     * @param  {string | string[]} _item element string to split
     * @param  {string} sDefault default element name
     * @return {string | string[]} prepared string or array of strings that is used to create markup
     */
    _split(_item, sDefault) {
        if (!_item)
            _item = sDefault;
        else if (Array.isArray(_item)) {
            let a = [];
            _item.forEach(s => {
                a.push(this._split(s));
            });
            _item = a;
        }
        else if (_item.indexOf(".") !== -1) {
            let bReplace = false;
            if (_item.indexOf("\\.") !== -1) {
                _item = _item.replaceAll("\\.", "$£%½");
                bReplace = true;
            }
            let a = _item.split(".");
            if (bReplace === true) {
                let i = a.length;
                while (--i >= 0) {
                    a[i] = a[i].replaceAll("$£%½", ".");
                }
            }
            _item = a;
        }
        if (typeof _item === "string")
            _item = [_item];
        return _item;
    }
    /**
     * Return index to physical position in table data. This is needed if operations based on data is executed
     * @param iIndex
     */
    _column_in_data(iIndex) { return this.m_aColumnPhysicalIndex[iIndex]; }
    /**
     * Get column position in table, this position can differ from the position in  table data
     * @param iIndex
     */
    _column_in_ui(iIndex) {
        if (!this.m_aColumnPhysicalIndex || this.m_aColumnPhysicalIndex.length === 0)
            this._generate_physicalindex();
        if (this.m_aColumnPhysicalIndex) {
            let i = this.m_aColumnPhysicalIndex.length;
            while (--i >= 0) {
                if (this.m_aColumnPhysicalIndex[i] === iIndex)
                    return i;
            }
            return -1;
        }
        return iIndex;
    }
    /**
     * Generate index to physical position in table data where to column that value is placed in ui table.
     * Check if column is hidden, if hide is set then column is ignored in ui table
     */
    _generate_physicalindex() {
        this.m_aColumnPhysicalIndex = [];
        let aPosition = this.data.COLUMNGetPropertyValue(true, "position", true);
        aPosition.forEach(aP => {
            // if column isn,t hidden then add to physical index
            if (!aP[1].hide) {
                this.m_aColumnPhysicalIndex.push(aP[0]);
            }
        });
    }
    _get_triggerdata() {
        let o = { dataUI: this, data: this.data };
        return o;
    }
    _set_selected(aSelect, bAdd) {
        if (bAdd === true) {
            this.m_aSelected = [].concat(this.m_aSelected, aSelect);
        }
        else
            this.m_aSelected = aSelect;
    }
    _row_in_data(iIndex) { return this.m_aRowPhysicalIndex[iIndex]; }
    _row_in_ui(iDataIndex) {
        let i = this.m_aRowPhysicalIndex.length;
        while (--i >= 0) {
            if (this.m_aRowPhysicalIndex[i] === iDataIndex)
                return i;
        }
        console.assert(false, "no ui row for data row");
        return -1;
    }
    _trigger(_Trigger) {
        let oTrigger = this.trigger;
        if (oTrigger) {
        }
    }
}
CUITableText.s_sWidgetName = "uitabletext";
CUITableText.s_iIdNext = 0;
/**
 * Default styles
 */
CUITableText.s_oStyle = {
    class_component: "",
    class_header: "",
    class_input: "input",
    class_section: "uitabletext",
    class_selected: "selected",
    class_error: "error",
};
