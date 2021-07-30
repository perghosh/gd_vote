import { CTableData } from "./../library/TableData.js";
import { CTableDataTrigger } from "./../library/TableDataTrigger.js";
import { CUITableText } from "./../library/UITableText.js";
import { CPageSuper } from "./pagesuper.js";
export class CPageVoter extends CPageSuper {
    constructor(oApplication, oOptions) {
        super(oApplication, oOptions);
        const o = oOptions || {};
        this.m_oUITableText = {};
        this.m_sQueriesSet = o.set || "";
        this.m_oLabel = {
            "register": "Registrera"
        };
        if (o.label) {
            Object.assign(this.m_oLabel, o.label);
        }
        if (o.label) {
            this.TRANSLATEPage();
        }
    }
    get queries_set() { return this.m_sQueriesSet; }
    ;
    get uitabletext() { return this.m_oUITableText; }
    ;
    SendRegisterVoter() {
        const aTD = this.uitabletext.login.data;
        return true;
    }
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
                let iPosition = sName.indexOf("get_column_information-");
                if (iPosition === 0) {
                    sName = sName.substr(23);
                    if (sName === "login") {
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
        let oCommand = { command: "get_column_information", query: "login", set: this.queries_set };
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    PAGECreateRegisterVoter(oHeader) {
        let TDLogin = new CTableData({ id: "login", name: "login" });
        CPageSuper.ReadColumnInformationFromHeader(TDLogin, oHeader);
        TDLogin.ROWAppend();
        TDLogin.COLUMNSetPropertyValue("VoterK", "position.hide", true);
        TDLogin.COLUMNSetPropertyValue([1, 2, 3], "edit.element", 1);
        TDLogin.COLUMNSetPropertyValue([1, 2, 3], "edit.name", "string");
        TDLogin.COLUMNSetPropertyValue([1, 2, 3], ["edit.edit", "format.required"], true);
        TDLogin.COLUMNSetPropertyValue([1, 2, 3], ["format.min"], 3);
        let oStyle = {
            html_value: `
<div class="base">         
   <div class="field is-horizontal my-1">
      <div class="field-label is-normal is-size-5">
         <label class="label" data-label='1'></label>
      </div>
      <div class="field-body">
         <div class="field">
            <p class="control">
               <input data-value='1' class="input is-primary is-size-5" type="text" style="margin: 0px;">
            </p>
         </div>
      </div>
   </div>
   <div class="is-size-5" data-description='1'></div>
   <div class="is-size-4 has-text-danger" data-error='1' style="text-align: right;"></div>
</div>
`
        };
        let oTrigger = new CTableDataTrigger({ table: TDLogin, trigger: CPageVoter.CALLBACK_TableData });
        let eContainer = document.getElementById("idUserRegister").querySelector("article");
        let options = {
            parent: eContainer,
            section: ["body", "statusbar"],
            state: 1 /* HtmlValue */ | 8 /* SetValue */,
            style: oStyle,
            table: TDLogin,
            name: "login",
            trigger: oTrigger,
            edit: true // enable edit
            /*,
            callback_render: (sType, _value, eElement, oColumn) => {
               if(sType === "afterCellValue") {
                  let eLabel = eElement.querySelector("[data-label]");
                  eLabel.innerText = oColumn.alias;
               }
            }*/
        };
        let TTLogin = new CUITableText(options);
        TDLogin.UIAppend(TTLogin);
        TTLogin.Render();
        TTLogin.GetSection("body").focus();
        this.m_oUITableText.login = TTLogin;
        let eStatusbar = TTLogin.GetSection("statusbar");
        let s = this.GetLabel("register");
        eStatusbar.innerHTML =
            `<div style="margin-top: 2em;">
   <button class='button is-white is-rounded is-primary is-large' style='width: 300px;'>${s}</button>
</div>`;
        let eButtonRegister = eStatusbar.querySelector("button");
        eButtonRegister.setAttribute("disabled", "");
        eButtonRegister.addEventListener("click", (e) => {
            e.srcElement.style.display = "none";
            if (this.SendRegisterVoter() === false)
                e.srcElement.style.display = "block";
        });
    }
    /**
     * Callback for events managed by CTableDataTrigger
     * @param {EventDataTable} oEventData standard event data
     * @param {any} e This is dependent on the event.
     */
    static CALLBACK_TableData(oEventData, v) {
        let sName = CTableDataTrigger.GetTriggerName(oEventData.iEvent);
        switch (sName) {
            case "BeforeSetCellError":
                let eCell = oEventData.eElement.closest(".base");
                let _type = oEventData.information;
                let e = eCell.querySelector("[data-error]");
                e.innerText = _type[1];
                //e.style.display = "block";
                break;
        }
    }
    /**
     * Serialize session id
     * @param {boolean} bSave    if session is saved or loaded
     * @param {string}  sSession session value if saved
     * @param {string}  sAlias   alias for user
     */
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
