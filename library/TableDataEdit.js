/*
 
 CEditors is a singleton class with controls use to edit values t, tabledata_columnhat are registered.
 This class should be filled with editors at application initialization.

 - If CDataTable is loaded with data and edit is enabled. Then it will try to create edit controls for each column that are  editable.
   - Creating controls is done with class CEdits
 
 
 */
export var edit;
(function (edit) {
    //interface IEdit
    /**
     * Singleton class with registered edit controls
     */
    class CEditors {
        constructor() {
            this.m_aControl = [];
        }
        static GetInstance() {
            if (!CEditors._instance)
                CEditors._instance = new CEditors();
            return CEditors._instance;
        }
        Add(_1, _2) {
            if (Array.isArray(_1))
                this.m_aControl = _1;
            else {
                this.m_aControl.push([_1, _2]);
            }
        }
        GetEdit(sName) {
            let oEdit = this._get_edit(sName);
            if (oEdit)
                return oEdit;
            throw `Control for ${sName} was not found`;
        }
        _get_edit(sName) {
            let i = this.m_aControl.length;
            while (--i >= 0) {
                if (this.m_aControl[i][0] === sName)
                    return this.m_aControl[i][1];
            }
            return null;
        }
    }
    edit.CEditors = CEditors;
    /**
     *
     */
    class CEdits {
        constructor(options) {
            const o = options || {};
            this.m_oTableData = o.table || null;
            this.m_eSupportElement = o.support || null;
        }
        GetEdit(_1) {
            if (typeof _1 === "number")
                return this.m_aColumn[_1];
            else if (_1 instanceof HTMLElement) {
                let i = this.m_aColumn.length;
                while (--i >= 0) {
                    let o = this.m_aColumn[i];
                    if (o && o.Compare(_1) === true)
                        return o;
                }
            }
            else if (Array.isArray(_1)) { // try to find edit for relative position [row, column]
                let i = this.m_aColumn.length;
                while (--i >= 0) {
                    let o = this.m_aColumn[i];
                    if (o && o.Compare(_1) === true)
                        return o;
                }
            }
            return null;
        }
        Initialize(bCreate, eSupportElement) {
            console.assert(this.data !== null, "No source data, to initialize CTableData is required.");
            this.m_aColumn = [];
            const aEdit = this.data.COLUMNGetPropertyValue(true, ["edit.edit", "edit.name", "type.group", "name"]);
            if (eSupportElement)
                this.m_eSupportElement = eSupportElement;
            console.assert(this.m_eSupportElement !== null, "No support element found!");
            //this.m_aEdit = [];
            aEdit.forEach((a, iIndex) => {
                let [bEdit, sEditName, sGroup, sName] = a[1];
                sEditName = sEditName || sGroup;
                if (bEdit !== true || !sEditName)
                    this.m_aColumn.push(null);
                else {
                    let oColumn = this.data.COLUMNGet(iIndex, undefined, true);
                    let Edit = CEditors.GetInstance().GetEdit(sEditName);
                    let iState = 0;
                    if (oColumn.edit.element)
                        iState |= 4 /* Element */;
                    let oEdit = new Edit({ edits: this, name: a[2], column: oColumn, state: iState });
                    this.m_aColumn.push(oEdit);
                    if (bCreate)
                        oEdit.Create(this.m_eSupportElement);
                }
            });
        }
        Activate(_1, _2, _3, _4) {
            let bDeactivate;
            let eElement;
            let iRow, iColumn, iRowRelative, iColumnRelative;
            if (Array.isArray(_1) === true) {
                if (_1.length === 2) {
                    [iRow, iColumn] = _1;
                }
                else {
                    [iRow, iColumn, iRowRelative, iColumnRelative] = _1;
                }
                eElement = _2;
                bDeactivate = _3;
            }
            else {
                iRow = _1;
                iColumn = _2;
                eElement = _3;
                bDeactivate = _4;
            }
            if (bDeactivate === true && this.m_oEditActive) {
                let iOk = this.Deactivate();
                if (iOk === -1)
                    return false;
            }
            let oEdit = this.m_aColumn[iColumn];
            console.assert(oEdit !== null, `No edit for column index ${iColumn}`);
            oEdit.SetPosition([iRow, iColumn], [iRowRelative, iColumnRelative]); // set position in table data and relative for ui control.
            let sValue = this.data.CELLGetValue(iRow, iColumn, 4 /* All */);
            let oRect = eElement.getBoundingClientRect();
            //oEdit.Show(oRect, sValue);
            oEdit.Open(eElement, sValue, oRect);
            oEdit.SetFocus();
            return true;
        }
        Deactivate(_Column, callIf) {
            let iCount = 0;
            let bChange = true;
            let aColumn;
            if (typeof _Column === "number") {
                aColumn.push(this.m_aColumn[_Column]);
            }
            else {
                aColumn = this.m_aColumn;
                if (_Column === false)
                    bChange = false;
            }
            for (let i = 0; i < aColumn.length; i++) {
                let bDeactivate = true;
                let oEdit = aColumn[i];
                if (!oEdit)
                    continue;
                if (bChange === true && oEdit.IsModified() === true) {
                    if (callIf && callIf(oEdit.GetValueStack(), oEdit) === false)
                        bDeactivate = false;
                }
                if (bDeactivate === true && oEdit.IsOpen()) {
                    oEdit.Close();
                    iCount++;
                }
                else
                    oEdit.SetClose();
            }
            return iCount;
        }
        /**
         * Get table data object that manages table data logic
         */
        get data() { return this.m_oTableData; }
        set data(table) { this.m_oTableData = table; }
    }
    edit.CEdits = CEdits;
    /* ********************************************************************** */
    /**
     *
     */
    class CEdit {
        constructor(o) {
            this.m_oEdits = o.edits; // set container (CEdits)
            this.m_sName = o.name; // name for edit control
            this.m_iState = o.state || 0;
            this.m_aPosition = o.position || [-1, -1];
            this.m_oColumn = o.column;
            this.m_sOldValue = "";
        }
        get element() { return this.m_eElement; }
        get column() { return this.m_oColumn; }
        get data() { return this.m_oEdits.m_oTableData; }
        SetPosition(aPosition, aPositionRelative) {
            this.m_aPosition = aPosition;
            if (Array.isArray(aPositionRelative))
                this.m_aPositionRelative = aPositionRelative;
        }
        Create(_1, _2) {
            if (this.IsElement() === false && typeof _1 === "string" && _2) {
                this.m_eElement = document.createElement(_1);
                Object.assign(this.m_eElement.style, { display: "none", position: "absolute", boxSizing: "border-box" });
                this.m_eElement.dataset.input = "1";
                _2.appendChild(this.m_eElement);
                //this.SetListener();
            }
            return this.m_eElement;
        }
        /**
         * Set keys that is passed over for movement or if undefefined keys are reset to tab and enter.
         * @param {number[]} [aKey] Keys used to pass over to component for movement
         */
        SetMoveKey(aKey) { this.m_aMoveKey = aKey; }
        SetListener() {
            if (this.IsListener() === true)
                return;
            this.m_eElement.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    let eFocus = this.m_eElement.closest("[tabIndex]");
                    this.m_iState |= 2 /* Canceled */;
                    this.m_oEdits.Deactivate(false);
                    if (eFocus)
                        eFocus.focus();
                }
                else if (e.key === "Tab") {
                    //e.preventDefault();
                }
            });
            this.m_iState |= 8 /* Listener */;
        }
        Compare(_1) {
            if (_1 instanceof HTMLElement) {
                if (this.m_eElement && this.m_eElement.isSameNode(_1))
                    return true;
                return false;
            }
            else if (Array.isArray(_1) && this.m_aPositionRelative) {
                return (_1[0] === this.m_aPositionRelative[0] && _1[1] === this.m_aPositionRelative[1]);
            }
        }
        Open(eParent, sValue, oPosition) {
            if (this.IsElement()) {
                this.m_eElement = eParent;
                this.SetListener();
            }
            else if (oPosition) {
                this.m_eElement.style.width = "100%";
                this.m_eElement.style.top = "0px";
                this.m_eElement.style.left = "0px";
                this.m_eElement.style.height = "100%";
                this.m_sOldParentPosition = eParent.style.position;
                eParent.style.position = "relative";
                eParent.appendChild(this.m_eElement);
                this.m_eElement.style.display = "inline-block";
            }
            this.SetValue(sValue);
            this.m_iState |= 1 /* Open */;
        }
        GetPosition() { return this.m_aPosition; }
        GetPositionRelative() { return this.m_aPositionRelative; }
        GetValue(bUpdate) {
            if (!this.m_eElement)
                return null;
            let _value = this.m_eElement.value;
            if (bUpdate === true)
                this._update_old_value();
            return _value;
        }
        GetValueStack() { return null; }
        SetValue(_value) { }
        IsElement() { return (this.m_iState & 4 /* Element */) === 4 /* Element */; }
        IsListener() { return (this.m_iState & 8 /* Listener */) === 8 /* Listener */; }
        IsModified() {
            if (!this.m_eElement || this.m_iState & 2 /* Canceled */)
                return false;
            let _value = this.m_eElement.value;
            return this.m_sOldValue !== _value;
        }
        IsOpen() { return (this.m_iState & 1 /* Open */) === 1 /* Open */; }
        /**
         * Ask if key is used to move from edit
         * @param  {number}  iKey number for key
         * @return {boolean}  true if key is valid move key
         */
        IsMoveKey(iKey) {
            if (this.m_aMoveKey) {
                let i = this.m_aMoveKey.length;
                while (--i >= 0) {
                    if (this.m_aMoveKey[i] === iKey)
                        return true;
                }
            }
            else if (iKey === 9 || iKey === 13)
                return true;
            return false;
        }
        SetClose() {
            this.m_iState &= ~1 /* Open */;
        }
        SetFocus() { this.m_eElement.focus(); }
        Close(eSupport) {
            this._update_old_value();
            if (this.IsElement() === false) {
                this.m_eElement.parentElement.style.position = this.m_sOldParentPosition;
                this.m_eElement.style.display = "none";
                this.SetClose();
                if (eSupport)
                    eSupport.appendChild(this.m_eElement);
            }
            else {
                this.m_eElement = null;
            }
        }
        Destroy() {
            if (this.IsElement() === false && this.m_eElement)
                this.m_eElement.remove();
            this.m_eElement = null;
        }
        _update_old_value() {
            if (!this.m_eElement)
                return;
            this.m_sOldValue = this.m_eElement.value;
        }
    }
    edit.CEdit = CEdit;
    class CEditInput extends CEdit {
        constructor(o) {
            super(o);
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            if (e)
                e.type = "text";
            return e;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        IsModified() {
            if (!this.m_eElement || this.m_iState & 2 /* Canceled */)
                return false;
            let _value = this.m_eElement.value;
            return this.m_sOldValue !== _value;
        }
    }
    edit.CEditInput = CEditInput;
    class CEditNumber extends CEdit {
        constructor(o) {
            super(o);
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            if (e) {
                e.type = "text";
                e.pattern = "[0-9]+([\\.,][0-9]+)?";
            }
            return e;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        IsModified() {
            if (!this.m_eElement || this.m_iState & 2 /* Canceled */)
                return false;
            let _value = this.m_eElement.value;
            return this.m_sOldValue !== _value;
        }
    }
    edit.CEditNumber = CEditNumber;
    class CEditPassword extends CEdit {
        constructor(o) {
            super(o);
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            if (e)
                e.type = "password";
            return e;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
    }
    edit.CEditPassword = CEditPassword;
    class CEditCheckbox extends CEdit {
        constructor(o) {
            super(o);
            this.m_iSelected = 0;
        }
        Create(_1) {
            let eParent = _1;
            let e;
            if (this.IsElement() === false) {
                e = document.createElement("INPUT");
                Object.assign(e.style, { display: "none" });
                e.dataset.input = "1";
                eParent.appendChild(e);
                e.type = "checkbox";
                e.value = "1";
                this.m_eElement = e;
            }
            return e;
        }
        /**
         * Open checkbox in table
         * @param eParent
         * @param sValue
         * @param oPosition
         */
        Open(eParent, sValue, oPosition) {
            if (this.IsElement()) { // are we working on one existing input element? the we need to attach to that element
                this.m_eElement = eParent;
                this.SetListener();
            }
            else {
                eParent.appendChild(this.m_eElement);
                this.m_eElement.style.display = "inline";
            }
            this.SetValue(sValue);
            this.m_iState |= 1 /* Open */;
        }
        GetValue(bUpdate) {
            if (!this.m_eElement)
                return null;
            let _value;
            if (this.m_eElement.checked) {
                _value = this.m_aValue[1];
            }
            else {
                _value = this.m_aValue[0];
            }
            if (bUpdate === true)
                this.m_iOldSelected = this.m_iSelected;
            return _value;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        IsModified() {
            if (!this.m_eElement || this.m_iState & 2 /* Canceled */)
                return false;
            //let _value = (<HTMLInputElement>this.m_eElement).value;
            this.m_iSelected = this.m_eElement.checked ? 1 : 0;
            return this.m_iOldSelected !== this.m_iSelected;
        }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        /**
         * Specialization for INPUT[type=checkbox]. It is using the checked attribute and therefore differs from normal INPUT elements.
         * @param {unknown} _Value
         */
        SetValue(_Value) {
            this.m_iSelected = 0;
            if (typeof _Value === "number") {
                this.m_aValue = [0, 1];
                if (_Value !== 0)
                    this.m_iSelected = 1;
                _Value = _Value.toString();
            }
            else if (_Value instanceof HTMLElement) {
                this.m_iSelected = _Value.checked ? 1 : 0;
                return;
            }
            else if (typeof _Value !== "string") {
                this.m_aValue = [false, true];
                if (_Value)
                    this.m_iSelected = 1;
            }
            else {
                this.m_aValue = ["0", "1"];
            }
            this.m_sOldValue = this.m_aValue[this.m_iSelected].toString();
            this.m_iOldSelected = this.m_iSelected;
            this.m_eElement.checked = (this.m_iSelected === 1);
        }
    }
    edit.CEditCheckbox = CEditCheckbox;
    class CEditSelect extends CEdit {
        constructor(o) {
            super(o);
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("SELECT", eParent);
            // create options for select
            if (e) {
                let aList = this.m_oColumn.list;
                aList.forEach((a, i) => {
                    let eO = document.createElement("option");
                    eO.value = a[0].toString();
                    eO.text = a[1].toString();
                    e.appendChild(eO);
                });
                Object.assign(e.style, { display: "none" });
                e.dataset.input = "1";
                eParent.appendChild(e);
            }
            return e;
        }
        GetValue(bUpdate) {
            if (!this.m_eElement)
                return null;
            if (this.m_iState & 2 /* Canceled */)
                return false;
            if (this.m_eElement.selectedIndex === -1)
                return null;
            let _text = this.m_eElement.options[this.m_eElement.selectedIndex].text;
            let _value = this.m_eElement.value;
            if (bUpdate === true)
                this.m_sOldValue = _value;
            return [_text, _value];
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            let aValue = this.data.CELLGetValue(this.m_aPosition[0], this.m_aPosition[1], 4);
            if (Array.isArray(aValue) && aValue.length > 1) {
                this.m_sOldValue = aValue[1];
                this.m_eElement.value = aValue[1];
            }
            else {
                this.m_sOldValue = _Value;
                this.m_eElement.value = _Value;
            }
        }
    }
    edit.CEditSelect = CEditSelect;
    class CEditTextarea extends CEdit {
        constructor(o) {
            super(o);
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("TEXTAREA", eParent);
            return e;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        IsMoveKey(i, e) {
            if (i === 9 || i === 13 && (e.ctrlKey === false && e.shiftKey === false)) {
                return true;
            }
            return false;
        }
    }
    edit.CEditTextarea = CEditTextarea;
    class CEditRange extends CEdit {
        constructor(o) {
            super(o);
        }
        Create(_1) {
            let eParent = _1;
            let e = super.Create("INPUT", eParent);
            if (e) {
                e.type = "range";
                let oFormat = this.m_oColumn.format;
                e.setAttribute("min", oFormat.min.toString());
                e.setAttribute("max", oFormat.max.toString());
            }
            return e;
        }
        GetValueStack() { return [this.m_aPosition, this.m_aPositionRelative, this.GetValue(), this.m_sOldValue]; }
        SetPosition(aPosition, aPositionRelative) {
            super.SetPosition(aPosition, aPositionRelative);
        }
        SetValue(_Value) {
            if (typeof _Value === "number")
                _Value = _Value.toString();
            if (typeof _Value !== "string") {
                if (_Value === null)
                    _Value = "";
                else if (typeof _Value === "number" || typeof _Value === "object")
                    _Value = _Value.toString();
                if (typeof _Value !== "string")
                    _Value = "";
            }
            this.m_sOldValue = _Value;
            this.m_eElement.value = _Value;
        }
        Open(eParent, sValue, oPosition) {
            eParent.innerText = "";
            super.Open(eParent, sValue, oPosition);
        }
    }
    edit.CEditRange = CEditRange;
})(edit || (edit = {}));
