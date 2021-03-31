// before = 0x10000000
// after  = 0x
// edit   = 0x010000
// load   = 0x020000
// column = 0x030000
var ResizeObserver;
export class CTableDataTrigger {
    constructor(options) {
        const o = options || {};
        this.m_oTableData = o.table || null;
        this.m_aTrigger = (new Array(32 /* LAST_EVENT */)).fill(true);
        this.m_acallTrigger = [];
        if (o.trigger)
            this.m_acallTrigger = Array.isArray(o.trigger) ? o.trigger : [o.trigger];
        this.m_oRS = null;
    }
    static GetTriggerNumber(sName) {
        const a = CTableDataTrigger.s_aTriggerName;
        let i = a.length;
        while (--i >= 0) {
            if (a[i] === sName)
                return i;
        }
        return -1;
    }
    static GetTriggerName(iTrigger) {
        return CTableDataTrigger.s_aTriggerName[iTrigger & 65535 /* MASK */];
    }
    static SetTriggerName(aName) {
        if (CTableDataTrigger.s_aTriggerName.length === 0)
            CTableDataTrigger.s_aTriggerName = new Array(32 /* LAST_EVENT */);
        if (Array.isArray(aName[0])) {
            let i = aName.length;
            while (--i >= 0)
                CTableDataTrigger.s_aTriggerName[aName[i][0]] = aName[i][1];
        }
        else {
            let i = aName.length;
            while (--i >= 0)
                CTableDataTrigger.s_aTriggerName[i] = aName[i];
        }
    }
    /**
     * Get table data object that manages table data logic
     */
    get data() { return this.m_oTableData; }
    Call(aTrigger) {
        let aCall = [];
        aTrigger.forEach(iTrigger => {
            if (this.m_aTrigger[iTrigger & 65535 /* MASK */])
                aCall.push(iTrigger);
        });
        return aCall;
    }
    Enable(_Trigger, bEnable) {
        if (Array.isArray(_Trigger) === false)
            _Trigger = [_Trigger];
        _Trigger.forEach(i => {
            this.m_aTrigger[i & 65535 /* MASK */] = bEnable;
        });
    }
    Trigger(_1, e, aArgument, callback) {
        let aTrigger = Array.isArray(_1) ? _1 : [_1];
        e = this._event(e);
        let _trigger = (iTrigger, e, aArgument) => {
            let bOk = true;
            e.iEvent = iTrigger & 65535 /* MASK */;
            e.iEventAll = iTrigger;
            for (let i = 0; bOk === true && i < this.m_acallTrigger.length; i++) {
                // bOk = this.m_acallTrigger[ i ].call(this.data, iTrigger & enumTrigger.MASK, iReason, aArgument);
                bOk = this.m_acallTrigger[i].call(this.data, e, aArgument);
                if (typeof bOk !== "boolean")
                    bOk = true;
            }
            return bOk;
        };
        let bOk = true;
        let iTrigger;
        if (callback === void 0) {
            for (let i = 0; bOk === true && i < aTrigger.length; i++) {
                iTrigger = aTrigger[i];
                bOk = _trigger(iTrigger, e, aArgument);
            }
        }
        else {
            for (let i = 0; bOk === true && i < aTrigger.length; i++) {
                iTrigger = aTrigger[i];
                if ((iTrigger & 65536 /* TRIGGER_BEFORE */) === 65536 /* TRIGGER_BEFORE */) {
                    bOk = _trigger(iTrigger, e, aArgument);
                }
            }
            if (bOk === true && callback) {
                callback(aArgument);
            }
            for (let i = 0; bOk === true && i < aTrigger.length; i++) {
                iTrigger = aTrigger[i];
                if ((iTrigger & 131072 /* TRIGGER_AFTER */) === 131072 /* TRIGGER_AFTER */) {
                    bOk = _trigger(iTrigger, e, aArgument);
                }
            }
        }
        return bOk;
    }
    /**
     *
     * @param aTrigger
     * @param iReason
     * @param _Argument
     */
    TriggerOn(aTrigger, e, _Argument) {
        e = this._event(e);
        let bOk = true;
        let iTrigger;
        let _trigger = (iTrigger, e, aArgument) => {
            let bOk = true;
            e.iEvent = iTrigger & 65535 /* MASK */;
            e.iEventAll = iTrigger;
            for (let i = 0; bOk === true && i < this.m_acallTrigger.length; i++) {
                bOk = this.m_acallTrigger[i].call(this.data, e, aArgument);
                if (typeof bOk !== "boolean")
                    bOk = true;
            }
            return bOk;
        };
        for (let i = 0; bOk === true && i < aTrigger.length; i++) {
            iTrigger = aTrigger[i];
            bOk = _trigger(iTrigger, e, _Argument);
        }
        return bOk;
    }
    TriggerUpdate(iTrigger) {
        const aUITable = this.data.UIGet();
        aUITable.forEach((a) => {
            a[1].update(iTrigger);
        });
    }
    /**
     * Set value to table data
     * @param {EventDataTable} e event data
     * @param {any[]} aArgument data sent to callbacks
     * @param _Row row where value is to update
     * @param _Column column value is that is updated
     * @param value value set
     * @param bRaw if row and column index is exact position in table data (no calculation is done to get posotion)
     */
    CELLSetValue(e, aArgument, _Row, _Column, value, bRaw) {
        let bReturn;
        bReturn = this.Trigger(this.Call([65546 /* BeforeSetValue */, 131083 /* AfterSetValue */]), e, aArgument, () => {
            this.data.CELLSetValue(_Row, _Column, value, bRaw);
        });
        return bReturn;
    }
    ObserveResize(_1, bAdd) {
        if (typeof bAdd !== "boolean")
            bAdd = true;
        if (!this.m_oRS) {
            this.m_oRS = new window.ResizeObserver((aE, oRS) => {
                let e = this._event({ iReason: 2 /* Browser */ });
                for (let _e of aE) {
                    this.TriggerOn(this.Call([262169 /* OnResize */]), e, _e);
                }
            });
        }
        if (_1 instanceof HTMLElement) {
            if (bAdd)
                this.m_oRS.observe(_1);
            else
                this.m_oRS.unobserve(_1);
        }
    }
    /**
     * Get ui objects connected to root element.
     * @param eRoot
     * @param bDeep
     */
    GetUIObjectsFromElement(eRoot, bDeep) {
        let aUI;
        bDeep = bDeep || false;
        const sId = this.data.id;
        if (bDeep === false) {
            var aChildren = eRoot.children;
            let i = aChildren.length;
            while (--i >= 0) {
                let e = aChildren[i];
                if (e.dataset.table === sId) {
                    let oUI = this.data.UIGetById(e.dataset.id);
                    if (oUI)
                        aUI.push(oUI);
                }
            }
        }
        return aUI;
    }
    _event(e) {
        e = e || {};
        e.data = e.data || this.data;
        e.iEvent = e.iEvent || e.iEventAll & 65535 /* MASK */;
        return e;
    }
}
/**
 * Each trigger has a type and that is a number. With `s_aTriggerName` trigger numbers can set a name for each event.
 */
CTableDataTrigger.s_aTriggerName = [];
