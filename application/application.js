import { edit } from "./../library/TableDataEdit.js";
import { CRequest } from "./../server/ServerRequest.js";
import { CPageOne } from "./pageone.js";
export class CApplication {
    constructor(oOptions) {
        const o = oOptions || {};
        this.m_callAction = o.callback_action || null;
        this.m_oEditors = edit.CEditors.GetInstance();
        // Initialize CRequest for server communication
        this.m_oRequest = new CRequest({
            callback: CApplication.CallbackServer,
            folder: "rSelect",
            methods: { SYSTEM_Init: "l10", SYSTEM_GetUserData: "s03", SYSTEM_GetCountry: "s08", SCRIPT_Run: "f60", REPORT_Pdf: "r02" },
            url: "http://127.0.0.1:8882/jq.srf?"
            //url: "http://goorep.se:1001/changelog/jq.srf?"
            //url: "http://localhost:8080/so/jq.srf?"
        });
        this.m_sAlias = o.alias || "guest"; // change this based on what alias that is used
        //this.m_sAlias = "per";
        this.m_sQueriesSet = "vote";
        if (o.session) {
            this.m_oRequest.session = o.session;
        }
    }
    get alias() { return this.m_sAlias; }
    get request() { return this.m_oRequest; }
    get session() { return this.m_oRequest.session; }
    get page() { return this.m_oPage; }
    set page(oPage) { this.m_oPage = oPage; }
    get queries_set() { return this.m_sQueriesSet; }
    set queries_set(s) { this.m_sQueriesSet = s; }
    /**
       * Initialize objects in CApplication for use.
       */
    Initialize() {
        let oEditors = this.m_oEditors;
        oEditors.Add("string", edit.CEditInput);
        oEditors.Add("password", edit.CEditPassword);
        oEditors.Add("text", edit.CEditTextarea);
        oEditors.Add("number", edit.CEditNumber);
        oEditors.Add("checkbox", edit.CEditCheckbox);
        this.m_oRequest.Get("SYSTEM_Init|SYSTEM_GetCountry|SYSTEM_GetUserData", { name: this.alias, flags: "ip" });
    }
    /**
     * Get user session
     */
    GetSession() {
        this.m_oRequest.Get("SYSTEM_GetUserData", { name: this.alias, flags: "ip" });
    }
    /**
     * Initialize page information, user is verified and it is tome to collect information needed to render page markup
     */
    InitializePage(oState) {
        this.m_oPage = new CPageOne(this, { callback_action: this.m_callAction });
    }
    CallOwner(sMessage, data) {
        if (this.m_callAction)
            this.m_callAction.call(this, sMessage, data);
    }
    OnResponse(eSection, sMethod, sHint) {
        let aItem = eSection.getElementsByTagName('item');
        for (let i = 0; i < aItem.length; i++) {
            let eItem = aItem[i];
            const sName = eItem.getAttribute("name");
            this.page.ProcessResponse(eItem, sName, sHint);
        }
    }
    static CallbackServer(eSection, sMethod, e) {
        let get_text = (eSection, sName) => {
            let e = eSection.querySelector(sName);
            if (e)
                return e.textContent;
            return null;
        };
        let oApplication = window.app;
        var sError = eSection ? eSection.getAttribute("error") : "";
        if (sError === "1") {
            let sError = eSection.textContent;
            throw sError;
        }
        else if (sMethod === "SCRIPT_Run") {
            const sComponent = get_text(eSection, "component");
            const sFile = get_text(eSection, "file");
            const sHint = get_text(eSection, "hint");
            oApplication.OnResponse(eSection, sMethod, sHint);
        }
        else if (sMethod === "SYSTEM_GetUserData") {
            oApplication.CallOwner("server-session");
            oApplication.queries_set = oApplication.page.queries_set;
            if (oApplication.queries_set) {
                let request = oApplication.request;
                let oCommand = { command: "load_if_not_found", set: "vote" };
                request.Get("SCRIPT_Run", { file: "queriesset.lua", json: request.GetJson(oCommand) });
            }
            else {
                oApplication.page.CallOwner("load");
            }
        }
        else if (sMethod === "user") {
            oApplication.request.Get("SYSTEM_GetUserData", { name: "guest" });
        }
        else if (sMethod === "alias") {
            oApplication.m_sAlias = e.sResponseText;
        }
    }
} // class CApplication
