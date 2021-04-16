import { CTableDataTrigger } from "./../library/TableDataTrigger.js";
export class CPageSuper {
    constructor(oApplication, oOptions) {
        const o = oOptions || {};
        this.m_oApplication = oApplication; // application object
        oApplication.page = this;
        this.m_callAction = o.callback_action || null;
    }
    /**
     * Call owner to page, owner is probably a callback in the html page this page object is used for
     * @param sMessage
     */
    CallOwner(sMessage) {
        if (this.m_callAction)
            this.m_callAction.call(this, sMessage);
    }
    /**
     * Open message in message section. if no parameters then message is removed
     * @param {string} [sMessage] message to user
     * @param {string} [sType] type of message `message` | `error` | `warning`
     * @param {boolean} [bHtml] if text is html formated
     */
    OpenMessage(sMessage, sType, bHtml) {
        Object.values(this.m_oElement).forEach(e => { if (typeof e.dataset.message === "string")
            e.style.display = "none"; });
        if (sMessage === undefined)
            return;
        sType = sType || "message";
        let e = this.m_oElement[sType];
        e = e.querySelector("p, pre");
        if (bHtml === true)
            e.innerHTML = sMessage;
        else
            e.textContent = sMessage;
        e.closest("[data-message]").style.display = "block";
        window.scrollTo(0, 0);
    }
    /**
     * Read column information from result header to columns in CTableData
     * @param {CTableData} oTD table data object that is configured from  aHeader
     * @param {object[]} aHeader header object in array
     * @param {string} aHeader[].id id for column
     * @param {string} aHeader[].name column name
     * @param {string} aHeader[].simple simple name for column
     * @param {string} aHeader[].select_type_name type name for column value
     */
    static ReadColumnInformationFromHeader(oTD, aHeader, callback) {
        const iColumnCount = aHeader.length;
        oTD.COLUMNAppend(iColumnCount);
        for (let i = 0; i < iColumnCount; i++) {
            const o = aHeader[i];
            oTD.COLUMNSetPropertyValue(i, "id", o.id);
            oTD.COLUMNSetPropertyValue(i, "name", o.name);
            oTD.COLUMNSetPropertyValue(i, "alias", o.simple);
            oTD.COLUMNSetType(i, o.select_type_name);
            if (callback)
                callback(i, o, oTD);
        }
    }
    /**
     * Callback for action events from ui table
     * @param oEventData
     * @param {any} v value differs based on event sent
     */
    static CallbackVote(oEventData, v) {
        let sName = CTableDataTrigger.GetTriggerName(oEventData.iEvent);
        console.log(sName);
        switch (sName) {
            case "AfterSetValue":
                {
                    let oTD = oEventData.data;
                    let oTT = oEventData.dataUI;
                    let eFooter = oTT.GetSection("footer");
                    let eError = eFooter.querySelector("[data-error]");
                    let iCount = oTD.CountValue([-1, "check"], 1); // c
                    const iMax = oTD.external.max;
                    if (typeof iMax === "number") { // found max property ? Then this is 
                        if (iMax < iCount) {
                            oTD.external.error = true;
                            if (!eError) {
                                let eDiv = document.createElement("div");
                                eDiv.className = "has-text-danger has-text-weight-bold";
                                eDiv.dataset.error = "1";
                                eFooter.appendChild(eDiv);
                                eError = eDiv;
                            }
                            eError.innerText = `Max antal val = ${iMax}, du har valt ${iCount}`;
                        }
                        else {
                            oTD.external.error = false;
                            if (eError)
                                eError.innerText = "";
                        }
                        if (iCount >= oTD.external.min && iCount <= oTD.external.max)
                            oTD.external.ready = true;
                        else
                            oTD.external.ready = false;
                        window.app.page.IsReadyToVote(true); // Update vote button
                    }
                }
                break;
        }
    }
}
/**
 * Internal state for sections in page
 * This class is mainly used to handle asynchronous calls to get information from a series of queries related to state.
 * When only one query is needed to get information for command it is  easier, but here there are multiple queries so
 * we need some sort of logic to know when all queries has been executed and in what order.
 */
export class CPageState {
    constructor(options) {
        const o = options;
        this.m_bActive = false;
        this.m_eContainer = o.container || null;
        this.m_sSection = o.section;
        this.m_sName = o.name;
        this.m_iQuery = 0;
        this.m_aQuery = o.query;
        this.m_aTableData = [];
    }
    get container() { return this.m_eContainer; }
    get name() { return this.m_sName; }
    get section() { return this.m_sSection; }
    IsActive() { return this.m_bActive; } // Is state active ? Only one active state for each page section
    GetQueryName() {
        const aQuery = this.GetOngoingQuery();
        if (aQuery)
            return aQuery[0];
        return null;
    }
    /**
     * Get first query that doesn't have the state delivered. If all queries has del
     */
    GetOngoingQuery() {
        for (let i = 0; i < this.m_aQuery.length; i++) {
            const aQuery = this.m_aQuery[i];
            if (aQuery[1] !== 2 /* delivered */)
                return aQuery;
        }
        return null;
    }
    /**
     * Set condition/s to current active query.
     * Used when one result is dependent of previous results in chain of queries
     * @param {details.condition[]} aCondition
     */
    SetCondition(aCondition) {
        let a = this.GetOngoingQuery();
        a[2] = aCondition;
    }
    AddTableData(iKey, oTD) { this.m_aTableData.push([iKey, oTD]); }
    GetTableData(iKey) {
        let a = [];
        let i = this.m_aTableData.length;
        while (--i >= 0) {
            if (typeof iKey === "number" && this.m_aTableData[i][0] === iKey) {
                a.push(this.m_aTableData[i][1]);
                break;
            }
            else
                a.push(this.m_aTableData[i][1]);
        }
        return a;
    }
    /**
     * Set if active or not active
     * When set to active add condition or conditions to query/queries. Conditions may be filled later from returned results
     * @param {[details.condition][]} [aCondition] condition set to queries that is executed. index will be matched for query index in query array for page state.
     */
    SetActive(aCondition) {
        this.m_aQuery.forEach((aQuery, i) => {
            if (aCondition && i < aCondition.length) {
                aQuery[2] = aCondition[i];
            }
            else
                aQuery[2] = null;
        });
        this.m_bActive = aCondition ? true : false;
        this.m_aTableData = []; // Delete old table data when activated, prepare for new results
        return this.m_aQuery;
    }
    Reset() {
        this.m_iQuery = 0; // set to first query
        this.m_aQuery.forEach(a => { a[1] = 0 /* send */, a[2] = null; });
    }
}
