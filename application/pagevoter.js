import { CPageSuper } from "./pagesuper.js";
export class CPageVoter extends CPageSuper {
    constructor(oApplication, oOptions) {
        super(oApplication, oOptions);
        const o = oOptions || {};
        this.m_sQueriesSet = o.set || "";
    }
    get queries_set() { return this.m_sQueriesSet; }
    ;
    /**
     * Process server response
     * @param {Element} eItem xml element
     * @param {string}  sName section name for response
     * @param {string}  sHint custom hint if found
     */
    ProcessResponse(eItem, sName, sHint) {
        if (eItem === null) {
            if (sName === "user")
                this.app.GetSession();
            return;
        }
        let oResult = JSON.parse(eItem.textContent);
        switch (sName) {
            case "delete_condition":
                //if( sHint === "poll_answer_filtercount")
                break;
            case "result":
                {
                    const sQueryName = oResult.name; // get query name
                    if (sQueryName === "login") {
                        //this.RESULTCreateUserRegister("idUserRegister", oResult);
                    }
                }
                break;
            //case "load":
            case "load_if_not_found":
                this.CallOwner("load");
                break;
            case "message":
                const sType = oResult.type;
                if (sType === "add_rows") {
                }
                break;
            default: {
                let iPosition = sName.indexOf("get_query_information-");
                if (iPosition === 0) {
                    if (oResult.name === "login") {
                        this.PAGECreateRegisterVoter(oResult);
                    }
                }
            }
        }
    }
    /**
     * Get information about selected poll. query = poll_overview
     * @param {number} iPoll   Index to selected poll
     * @param {string} sSimple name for selected poll
     */
    QUERYGetVoterRegister() {
        let request = this.app.request;
        let oCommand = { command: "get_result", query: "login", set: this.queries_set, count: 0, format: 1 };
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    QUERYGetVoterRegisterInformation() {
        let request = this.app.request;
        let oCommand = { command: "get_query_information", query: "login", set: this.queries_set };
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    PAGECreateRegisterVoter(oResult) {
        console.log(oResult);
    }
    static HISTORYSerializeSession(bSave, sSession, sAlias) {
        return CPageSuper.SerializeSession(bSave, sSession, sAlias);
    }
    /**
     * Translate pager text
     * @param {object} oLanguage object that has strings to replace page elements with
     */
    TRANSLATEPage(oLanguage) {
        oLanguage = oLanguage || this.m_oLabel;
        if (oLanguage.page) { // static page text that need translation
            const ePage = document.getElementById("idPage");
            for (const [sKey, sText] of Object.entries(oLanguage.page)) {
                const e = ePage.querySelector('[data-translate="page.' + sKey + '"]');
                if (e)
                    e.childNodes[0].textContent = sText;
            }
        }
        // translate labels in page
        for (const [sKey, sText] of Object.entries(oLanguage)) {
            if (typeof sText === "string")
                this.m_oLabel[sKey] = sText;
        }
    }
}
