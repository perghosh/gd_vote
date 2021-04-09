/*
# Navigate
   ## Functions
   SetActivePoll - Calling this method triggers a chain of operations that will display needed information about active poll
   OpenMessage - Open a new message for user
   ProcessResponse - Process responses from server

|Name|Description
|:-|:-|

| SendVote | Send vote to server to register vote for user |
| SendVoter | Create new voter for collected information when user tried to logon. |
| SetActivePoll | Calling this method triggers a chain of operations that will display needed information about active poll |
| OpenMessage | Show message to user |
| ProcessResponse | Process responses from server |
| QUERYGetLogin | Get login information for voter. query = `login` |
| QUERYGetPollList | Get active polls. query = poll_list |
| QUERYGetPollOverview | Get information about selected poll. query = poll_overview. query = `poll_overview` |
| QUERYGetPollLinks | Get links for poll. Query used is `poll_links` |
| QUERYGetPollHashtags | Get hashtags for poll or all poll hashtags. Query used is `poll_hashtags` |
| RESULTCreateLogin | Create login section |
| RESULTCreateFindVoter | Result from finding voter, this is called if user tries to login |
| RESULTCreatePollOverview | Process result from  `poll_overview`|
| RESULTCreatePollOverviewLinks | Process result from `poll_links` and render these for user |
| RESULTCreateQuestionPanel | Create panels for each question that belongs to current selected poll. Like containers for selectable votes |
| RESULTCreateVoteCount | Create markup showing vote count on each answer for poll question |
|||
|||
*/
import { CTableData, enumReturn } from "./../library/TableData.js";
import { CTableDataTrigger } from "./../library/TableDataTrigger.js";
import { CUITableText } from "./../library/UITableText.js";
import { CQuery } from "./../server/Query.js";
export class CPage {
    // ## One single poll can have one or more questions. Each questions has one or more answers. 
    // ## When poll is selected page gets information about each question in poll and render information 
    // ## for each question in poll. QUESTION_STATE has states to know in what type of information that is needed.
    // State for each question in poll
    // NO_RESULT = no information about question, need to get it from server
    // WAITING_FOR_RESULT = waits for result from server about poll question
    // RESULT_DELIVERED = Result about question is returned from server
    // VOTE_READY_TO_SEND = Vote is ready to send to server, voter has selected answers
    constructor(oApplication, oOptions) {
        const o = oOptions || {};
        this.m_oApplication = oApplication; // application object
        oApplication.page = this;
        this.m_callAction = o.callback_action || null;
        this.m_oPoll = { poll: -1, vote: -1, count: 0 };
        this.m_oState = o.state || {};
        this.m_sViewMode = "vote"; // In what mode selected poll is. "vote" = enable voting for voter, "count" = view vote count for selected poll
        this.m_aPageState = [
            new CPageState({ section: "body", name: "vote", container: document.getElementById("idPollVote"), query: [["poll_question_list", 0 /* send */, []], ["poll_answer", 0 /* send */, []]] }),
            new CPageState({ section: "body", name: "count", container: document.getElementById("idPollCount"), query: [["poll_question_list", 0 /* send */, []], ["poll_answer_count", 0 /* send */, []]] })
        ];
        this.m_oElement = {
            "error": document.getElementById("idError"),
            "message": document.getElementById("idMessage"),
            "poll_list": document.getElementById("idPollList"),
            "warning": document.getElementById("idWarning")
        };
        this.m_aVoter = [-1, "", ""]; // no voter (-1)
        this.m_aVoteHistory = [];
        this.HISTORYSerialize(false);
    }
    get app() { return this.m_oApplication; } // get application object
    get poll() { return this.m_oPoll; }
    get state() { return this.m_oState; } // get state object
    get view_mode() { return this.m_sViewMode; }
    set view_mode(sMode) {
        console.assert(sMode === "vote" || sMode === "count", "Invalid view mode: " + sMode);
        this.m_sViewMode = sMode;
    }
    set voter(aVoter) { this.m_aVoter = aVoter; }
    GetActivePoll() { return this.poll.poll; }
    /**
     * Activate poll with number
     * @param iActivePoll key to active poll
     * @param {string} [sName] Name for active poll
     * @param {boolean} [bSelect] If page should be updated based on poll. Select poll in dropdown if found
     */
    SetActivePoll(iActivePoll, sName, bSelect) {
        this.CloseQuestions();
        if (typeof iActivePoll === "number") {
            this.poll.poll = iActivePoll;
            if (iActivePoll <= 0)
                return;
        }
        this.QUERYGetPollOverview(this.poll.poll, sName);
        const aCondition = [[{ ready: false, table: "TPollQuestion1", id: "PollK", value: this.poll.poll, simple: sName }]];
        if (!this.m_oPageState)
            this.SetActiveState("body." + this.view_mode, undefined, aCondition);
        else {
            this.m_oPageState.SetActive(aCondition);
        }
        if (bSelect === true) { // Update dependent items in page base on poll key
            let eList = this.m_oElement.poll_list;
            let eSelect = eList.querySelector("select");
            eSelect.value = iActivePoll.toString();
        }
        this.WalkNextState();
    }
    /**
     * Return true if voter key is found
     */
    IsVoter() { return this.m_aVoter[0] !== -1; }
    /**
     * Set callback that gets notified when important operations are taken place in page object
     * @param {string) => void)} callback [description]
     */
    SetCallback(callback) {
        this.m_callAction = callback;
    }
    /**
     * Get CPageState for section and name
     * @param {string} sSection section name
     * @param {string} sName name for page state
     */
    GetPageState(sSection, sName) {
        for (let i = 0; i < this.m_aPageState.length; i++) {
            const o = this.m_aPageState[i];
            if (sSection === o.section && sName === o.name)
                return o;
        }
        console.assert(false, "state not found");
        return null;
    }
    SetActiveState(sState, eElement, aCondition) {
        const [sSection, sName] = sState.split(".");
        if (sSection === "body")
            this.view_mode = sName;
        let oPageState = this.GetPageState(sSection, sName);
        // Clear active state for section
        for (let i = 0; i < this.m_aPageState.length; i++) {
            const o = this.m_aPageState[i];
            if (sSection === o.section)
                o.SetActive(); // clear active state
        }
        oPageState.SetActive(aCondition);
        this.m_oPageState = oPageState;
        //this.WalkNextState();
    }
    CallOwner(sMessage) {
        if (this.m_callAction)
            this.m_callAction.call(this, sMessage);
    }
    /**
     * Walks queries used to collect information for active state
     */
    WalkNextState() {
        if (!this.m_oPageState)
            return;
        let request = this.app.request;
        let aQuery = this.m_oPageState.GetOngoingQuery(); // returns first query where result hasn't been delivered
        if (aQuery === null) {
            this.m_oPageState.Reset(); // reset state (set queries to be sent and removes conditions)
            this.m_oPageState = null;
            return;
        }
        if (aQuery[1] === 2 /* delivered */) {
            let aCondition = aQuery[2];
            let i = 0;
            while (i < aCondition.length && aCondition[i].ready === true)
                ;
            if (i < aCondition.length) {
                aCondition[i].ready = true;
                i++;
            }
            // Check for more conditions?
            if (i < aCondition.length) {
                aQuery[1] = 0 /* send */;
            }
            else {
                // get next non delivered query
                aQuery = this.m_oPageState.GetOngoingQuery();
            }
        }
        if (aQuery && aQuery[1] === 0 /* send */) { // if query is in send state then send it
            // Get first filter that isn't sent
            let aCondition = aQuery[2];
            let oQuery = new CQuery();
            let a = [];
            for (let i = 0; i < aCondition.length; i++) {
                let oC = aCondition[i];
                if (oC.ready === false) {
                    oQuery.CONDITIONAdd(oC);
                    oC.ready = true;
                    break;
                }
            }
            let sXml = oQuery.CONDITIONGetXml();
            const sQuery = aQuery[0];
            let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: sQuery, set: "vote", count: 50, format: 1, start: 0 };
            request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
            aQuery[1] = 1 /* waiting */; // change state to waiting
        }
        else
            this.m_oPageState = null;
    }
    CloseQuestions() {
        document.getElementById("idPollVote").innerHTML = "";
        document.getElementById("idPollCount").innerHTML = "";
        this.OpenMessage(); // close any open message
    }
    /**
     * Is Poll ready to send  to server to register vote for voter?
     * @param {boolean} [bUpdateVoteButton] Update button in page
     * @returns {boolean} true if questions are ready to be sent to server, false if not
     */
    IsReadyToVote(bUpdateVoteButton) {
        let oPageState = this.GetPageState("body", "vote"); // page state 2body.vote" holds information about the user vote
        let aTD = oPageState.GetTableData();
        let iOkCount = 0;
        aTD.forEach(oTD => {
            if (oTD.external.ready === true)
                iOkCount++;
        });
        const bReady = aTD.length === iOkCount;
        if (bUpdateVoteButton === true) {
            let e = oPageState.container.querySelector('[data-section="vote"]').querySelector("button");
            if (e) { // if voter is blocked from voting the button do not exist
                if (bReady)
                    e.removeAttribute("disabled");
                else
                    e.setAttribute("disabled", "");
            }
        }
        return bReady;
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
     * Collect information about what voter has selected and sent that to server to register vote
     */
    SendVote() {
        console.assert(this.GetActivePoll() > 0, "Active poll isn't set.");
        console.assert(this.IsReadyToVote(), "Trying to send vote to server but vote isn't ready to be sent.");
        let aValue = [];
        // ## Extract key values from, values for poll is found i page state body.vote
        const aTD = this.GetPageState("body", "vote").GetTableData();
        aTD.forEach(oTD => {
            const aRow = oTD.CountValue([-1, "check"], 1, enumReturn.Array); // get values from "check" column with value 1
            aRow.forEach(iRowKey => {
                // IMPORTANT! Column 2 in query on server gets value from "PollAnswerK". This binds user vote to answer in poll
                aValue.push({ index: 2, value: oTD.CELLGetValue(iRowKey, "PollAnswerK") }); // column with index 2 gets key to answer
            });
        });
        let aHeader = [{ name: "PollK", value: this.GetActivePoll() }];
        if (this.m_aVoter[0] !== -1) {
            aHeader.push({ name: "VoterK", value: this.m_aVoter[0] });
            ;
        }
        let oQuery = new CQuery({
            header: aHeader,
            values: aValue
        });
        let oDocument = (new DOMParser()).parseFromString("<document/>", "text/xml");
        oQuery.HEADERGetXml({ document: true }, oDocument);
        aValue.forEach((_value, i) => {
            oQuery.values = _value;
            oQuery.VALUEGetXml({ index: i, values: "row", document: true }, oDocument);
        });
        const sXml = (new XMLSerializer()).serializeToString(oDocument);
        let oCommand = { command: "add_rows", query: "poll_vote", set: "vote", table: "TPollVote1" };
        let request = this.app.request;
        request.Get("SCRIPT_Run", { file: "PAGE_result_edit.lua", json: request.GetJson(oCommand) }, sXml);
        this.poll.vote = this.poll.poll; // keep poll index for later when response from server is returned
    }
    /**
     * Create new voter for collected information when user tried to logon.
     * NOTE: This needs to be modified because it cant be that easy to create new users
     */
    SendVoter() {
        const sName = this.m_oTDVoter.CELLGetValue(0, "FName");
        const sAlias = this.m_oTDVoter.CELLGetValue(0, "FAlias");
        const sMail = this.m_oTDVoter.CELLGetValue(0, "FMail");
        let oQuery = new CQuery({
            values: [{ name: "FName", value: sName }, { name: "FAlias", value: sAlias }, { name: "FMail", value: sMail }]
        });
        let request = this.app.request;
        let oDocument = (new DOMParser()).parseFromString("<document/>", "text/xml");
        oQuery.VALUEGetXml({ index: 0, values: "row", document: true }, oDocument);
        const sXml = (new XMLSerializer()).serializeToString(oDocument);
        let oCommand = { command: "add_rows", query: "login", set: "vote", table: "TVoter1" };
        request.Get("SCRIPT_Run", { file: "PAGE_result_edit.lua", json: request.GetJson(oCommand) }, sXml);
    }
    ProcessResponse(eItem, sName) {
        let oResult = JSON.parse(eItem.textContent);
        switch (sName) {
            case "result":
                {
                    const sQueryName = oResult.name; // get query name
                    if (this.m_oPageState) { // found active state ?
                        if (this.m_oPageState.GetQueryName() === sQueryName) { // compare name with current query in page state, if match then walk to next page state
                            let aQuery = this.m_oPageState.GetOngoingQuery();
                            aQuery[1] = 2 /* delivered */;
                            switch (sQueryName) {
                                case "poll_question_list":
                                    this.RESULTCreateQuestionPanel(this.m_oPageState.container, oResult);
                                    break;
                                case "poll_answer":
                                    this.RESULTCreateVote(this.m_oPageState.container, oResult);
                                    break;
                                case "poll_answer_count":
                                    this.RESULTCreateVoteCount(this.m_oPageState.container, oResult);
                                    break;
                                default: console.assert(false, `Result for ${sQueryName} has no stub`);
                            }
                            let aCondition = aQuery[2];
                            let i = 0;
                            while (i < aCondition.length && aCondition[i].ready === true)
                                i++;
                            //if(i < aCondition.length) { aCondition[ i ].ready = true; i++; }
                            // Check for more conditions?
                            if (i < aCondition.length) {
                                aQuery[1] = 0 /* send */;
                            }
                            this.WalkNextState(); // Go to next step in active state
                            //let aQuery = this.m_oPageState.GetOngoingQuery();
                            //aQuery
                        }
                    }
                    if (sQueryName === "login") {
                        this.RESULTCreateLogin("idTopLogin", oResult.table.header);
                    }
                    else if (sQueryName === "poll_list") {
                        this.RESULTCreatePollList("idPollList", oResult);
                    }
                    else if (sQueryName === "poll_overview") {
                        this.RESULTCreatePollOverview("idPollOverview", oResult);
                    }
                    else if (sQueryName === "poll_links") {
                        this.RESULTCreatePollOverviewLinks("idPollOverview", oResult);
                    }
                    else if (sQueryName === "find_voter") {
                        this.RESULTCreateFindVoter("idFindVoter", oResult);
                    }
                    /*
                    else if(sQueryName === "poll_question_list") {
                       this.RESULTCreateQuestionPanel("idPollQuestionList", oResult);
                    }
                    */
                }
                break;
            case "load":
                this.CallOwner("load");
                break;
            case "message":
                const sType = oResult.type;
                if (sType === "add_rows") {
                    const sQueryName = oResult.name;
                    if (sQueryName === "poll_vote") {
                        this.OpenMessage("Din röst har blivit registrerad!");
                        if (this.poll.vote > 0) {
                            this.m_aVoteHistory.push(this.poll.vote);
                            this.HISTORYSerialize(true);
                        }
                        this.poll.vote = -1;
                    }
                    else if (sQueryName === "login") {
                        this.CallOwner("insert-voter");
                    }
                }
                break;
        }
    }
    /**
     * Check if poll is found in history from local storage
     * @param {number} iPoll poll key
     */
    HISTORYFindPoll(iPoll) {
        return this.m_aVoteHistory.findIndex(i => i === iPoll) !== -1 ? true : false;
    }
    HISTORYSerialize(bSave) {
        if (bSave === true) {
            localStorage.setItem("poll_votes", JSON.stringify(this.m_aVoteHistory));
        }
        else {
            const s = localStorage.getItem("poll_votes"); // read votes saved on computer
            if (s)
                this.m_aVoteHistory = JSON.parse(s);
        }
    }
    /**
     * Get login information for voter. query = login
     */
    QUERYGetLogin() {
        let request = this.app.request;
        let oCommand = { command: "get_result", query: "login", set: "vote", count: 1, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    /**
     * Get active polls. query = poll_list
     */
    QUERYGetPollList() {
        let request = this.app.request;
        let oCommand = { command: "get_result", query: "poll_list", set: "vote", count: 100, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    /**
     * Get information about selected poll. query = poll_overview
     * @param {number} iPoll   Index to selected poll
     * @param {string} sSimple name for selected poll
     */
    QUERYGetPollOverview(iPoll, sSimple) {
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPoll1", id: "PollK", value: iPoll, simple: sSimple }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_overview", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    /**
     * Get links associated to poll
     * @param {number} iPoll   Index to selected poll
     */
    QUERYGetPollLinks(iPoll) {
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPoll1", id: "PollK", value: iPoll }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_links", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    /**
     * Return hashtags for selected poll
     * @param {number} [iPoll] Index to selected poll
     */
    QUERYGetPollHashtags(iPoll) {
        let request = this.app.request;
        let sXml;
        if (iPoll) {
            let oQuery = new CQuery({
                conditions: [{ table: "TPoll1", id: "PollK", value: iPoll }]
            });
            sXml = oQuery.CONDITIONGetXml();
        }
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_hashtags", set: "vote", count: 100, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    /**
     * Get questions for selected poll. query = poll_question_list
     */
    QUERYGetPollQuestions(iPoll) {
        iPoll = iPoll || this.poll.poll; // this.m_iActivePoll;
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPoll1", id: "PollK", value: iPoll }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_question_list", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    /****************************************************************** LOGIN
     * Create login section
     * @param eRoot
     * @param aHeader
     */
    RESULTCreateLogin(eRoot, aHeader) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let TDVoter = new CTableData({});
        this.m_oTDVoter = TDVoter;
        CPage.ReadColumnInformationFromHeader(TDVoter, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key === 1) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
            else {
                oTD.COLUMNSetPropertyValue(iIndex, "edit.name", oColumn.group_name);
                oTD.COLUMNSetPropertyValue(iIndex, "edit.edit", true);
            }
        });
        TDVoter.COLUMNSetPropertyValue(true, "edit.element", 1); // Set element property to 1 for edit item in column to mark that there is an existing element that is used for column value.
        TDVoter.COLUMNUpdatePositionIndex(true); // fix position is needed if there are hidden columns
        TDVoter.ROWAppend(1);
        TDVoter.COLUMNSetPropertyValue("FAlias", "format.min", 3); // alias need at least three characters
        TDVoter.COLUMNSetPropertyValue("FAlias", "format.max", 25); // alias need at least three characters
        TDVoter.COLUMNSetPropertyValue("FName", "format.max", 25);
        TDVoter.COLUMNSetPropertyValue("FMail", "format.max", 50);
        /*
              let oStyle = {
                 class_section: "uitabletext_login", class_value_error: "error_value",
                 html_value: `
        <div style='border-bottom: 1px dotted var(--gd-white); padding: 0.5em 1em;'>
           <div style='display: flex; align-items: stretch;'>
              <span data-label='1' style='padding: 0px 1em 0px 0px; text-align: right; width: 120px;'></span>
              <span data-value='1' style='flex-grow: 1; padding: 0px 2px; box-sizing: border-box; background-color: var(--gd-gray);'></span>
           </div>
           <div data-description='1'></div>
           <div class='error-message' data-error='1' style="display: none; margin-left: 120px; text-align:right;"></div>
        </div>
        `
              }
        */
        let oStyle = {
            class_section: "uitabletext_login", class_value_error: "error_value",
            html_value: `
<div class="field is-horizontal mb-1">
  <div class="field-label is-normal">
    <label data-label="1" class="label">Normal label</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <input data-value="1" class="input" type="text">
      </div>
    </div>
  </div>
</div>
`
        };
        let options = {
            parent: eRoot,
            section: ["title", "body", "statusbar", "footer"],
            style: oStyle,
            table: TDVoter,
            name: "login",
            edit: 1,
            state: (8 /* SetValue */ | 1 /* HtmlValue */),
            callback_render: (sType, _value, eElement, oColumn) => {
                if (sType === "afterCellValue") {
                    let eLabel = eElement.querySelector("[data-label]");
                    eLabel.innerText = oColumn.alias;
                }
                //else if( sType === "askCellValue" ) return false;
            }
        };
        let TTVoter = new CUITableText(options);
        TTVoter.edits.GetEdit(1).SetMoveKey([9, 13, 38, 40]);
        TTVoter.edits.GetEdit(2).SetMoveKey([9, 13, 38, 40]);
        TTVoter.edits.GetEdit(3).SetMoveKey([9, 13, 38, 40]);
        TDVoter.UIAppend(TTVoter);
        TTVoter.Render();
        // ## Button to logon
        let eFooter = TTVoter.GetSection("footer");
        eFooter.innerHTML = `
<div>
   <button class='button is-rounded' style='display: inline-block; margin-top: 1em; width: 200px;'>Logga in</button>
   <div data-message style="display: none; margin: 0.5em;"></div>
</div>`;
        eFooter.querySelector("button").addEventListener("click", (e) => {
            let aError = TTVoter.ROWValidate(0);
            if (Array.isArray(aError) && aError.length > 0) {
                let sMessageError = "";
                aError.forEach(a => {
                    let oColumn = TDVoter.COLUMNGet(a[1]); // [row, column, true|false, error-type]
                    if (a[3] === 'min')
                        sMessageError += `<b>${oColumn.alias}</b> har för få tecken`;
                    if (a[3] === 'max')
                        sMessageError += `<b>${oColumn.alias}</b> har för många tecken`;
                });
                if (sMessageError) {
                    this.OpenMessage(sMessageError, "warning", true);
                }
            }
            else {
                let request = this.app.request;
                let oQuery = new CQuery({
                    conditions: [{ table: "TVoter1", id: "FAlias", value: TDVoter.CELLGetValue(0, "FAlias") }]
                });
                let sXml = oQuery.CONDITIONGetXml();
                let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "find_voter", set: "vote", count: 50, format: 1, start: 0 };
                request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
            }
            //if(Array.isArray(aError) && TTLogin.ERRORGetCount() === 0) TTLogin.ERRORSet(aError);
        });
        TTVoter.GetSection("body").focus(); // set focus to body for login values
    }
    RESULTCreateFindVoter(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let eText = eRoot;
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(oTD, aHeader);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        eText.className = ""; // clear classes
        if (oTD.ROWGetCount() === 1) {
            // Get key and name for voter
            const iVoterK = oTD.CELLGetValue(0, "VoterK");
            const sAlias = oTD.CELLGetValue(0, "FAlias");
            const sName = oTD.CELLGetValue(0, "FName");
            this.voter = [iVoterK, sAlias, sName];
            eText.classList.add("has-text-success");
            eText.innerText = `Inloggad (${sAlias})`;
            this.CallOwner("select-voter");
        }
        else {
            eText.classList.add("has-text-warning");
            eText.innerText = "Logga in";
            this.SendVoter(); // Send voter information, try to create if not found
        }
    }
    /**
     * Create dropdown with active polls
     * @param {string|HTMLElement} eRoot id or string to parent element for select list
     * @param oResult data to populate list
     */
    RESULTCreatePollList(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(oTD, aHeader);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        let aBody = oTD.GetData();
        if (aBody[0].length) {
            let aData = aBody[0];
            let aKey = aBody[1];
            let eList = this.m_oElement.poll_list;
            eList.innerHTML = "";
            let eSelect = document.createElement("select");
            let eOption = document.createElement("option");
            eOption.innerText = "Välj omröstning här!";
            eOption.style.fontStyle = "italic";
            eSelect.appendChild(eOption);
            eSelect.className = "has-text-weight-bold";
            aData.forEach((a, i) => {
                eOption = document.createElement("option");
                eOption.value = a[0];
                let sText = a[1];
                const sTitle = sText;
                if (sText.length > 50)
                    sText = sText.substring(0, 48) + "..";
                eOption.innerText = sText;
                eOption.setAttribute("title", sTitle);
                eSelect.appendChild(eOption);
            });
            eList.appendChild(eSelect);
            eList.addEventListener('change', e => {
                let iPoll = parseInt(e.srcElement.value, 10);
                if (isNaN(iPoll)) {
                    this.SetActivePoll(-1);
                    this.RESULTCreatePollOverview("idPollOverview");
                }
                else {
                    let sName = e.srcElement.options[e.srcElement.selectedIndex].text;
                    this.SetActivePoll(iPoll, sName);
                }
            });
        }
        this.CallOwner("ready-poll-list");
    }
    /**
     * result for selected poll
     * If data is found then get questions for poll
     * @param {string|HTMLElement} eRoot
     * @param oResult
     */
    RESULTCreatePollOverview(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        if (oResult === undefined) {
            eRoot.style.display = "none";
            document.getElementById("idContent").style.display = "none";
            return;
        }
        else {
            eRoot.style.display = "block";
            document.getElementById("idContent").style.display = "block";
        }
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        CPage.ReadColumnInformationFromHeader(oTD, oResult.table.header);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        const sName = oTD.CELLGetValue(0, 1); // Poll name
        const sDescription = oTD.CELLGetValue(0, 2); // Poll description
        const iQuestionCount = oTD.CELLGetValue(0, 3); // Number of questions in poll
        const iLinkCount = oTD.CELLGetValue(0, "CountLink"); // Links associated with poll
        const iVoteCount = oTD.CELLGetValue(0, "MyCount"); // if registered voter has voted in this poll
        const iIpCount = oTD.CELLGetValue(0, "IpCount"); // if count number of votes for ip number
        if (typeof iVoteCount === "number")
            this.poll.count = iVoteCount;
        else
            this.poll.count = 0;
        if (this.IsVoter() === false && iIpCount > 0) {
            this.poll.count = iIpCount;
        }
        if (iQuestionCount > 0) {
            // ## Generate title for poll
            let eTitle = eRoot.querySelector("[data-title]");
            eTitle.textContent = sName;
            let eDescription = eRoot.querySelector("[data-description]");
            if (eDescription)
                eDescription.textContent = sDescription || "";
            let eCount = eRoot.querySelector("[data-count]");
            if (eCount)
                eCount.textContent = iQuestionCount.toString();
        }
        let eLink = eRoot.querySelector('[data-section="link"]');
        if (iLinkCount > 0) {
            eLink.style.display = "block";
            this.QUERYGetPollLinks(this.GetActivePoll());
        }
        else {
            eLink.style.display = "none";
        }
    }
    /**
     * Process result from `poll_links` and render these for user
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server result with information about links
     */
    RESULTCreatePollOverviewLinks(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        CPage.ReadColumnInformationFromHeader(oTD, oResult.table.header);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        let eLink = eRoot.querySelector('[data-section="link"]');
        // remove links if any found
        let eA = eLink.lastElementChild;
        while (eA.tagName === "A") {
            let e = eA;
            eA = eA.previousElementSibling;
            e.remove();
        }
        const iCount = oTD.ROWGetCount();
        let eTemplate = document.createElement('div');
        for (let iRow = 0; iRow < iCount; iRow++) {
            const sLink = oTD.CELLGetValue(iRow, 1); // link 
            eTemplate.innerHTML = sLink;
            let eA = eTemplate.firstElementChild;
            eA.className = "panel-block";
            eLink.appendChild(eA);
        }
    }
    /**
     * Create panels for each question that belongs to current selected poll
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server result with questions for selected poll
     */
    RESULTCreateQuestionPanel(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        // ## Create section where questions are placed. Questions are added to vote section on top
        // <div data-section="vote">
        //    <header class="title is-3">${iPollIndex}: ${sName}</header><article class="block"></article>
        //    .. more questions ..
        // </div>
        // <div>
        //    <button>Vote</button>
        // </div>
        let eQuestion = eRoot.querySelector('[data-section="question"]'); // section where vote questions are placed
        if (!eQuestion) {
            eQuestion = document.createElement("div");
            eQuestion.dataset.section = "question";
            eRoot.appendChild(eQuestion);
        }
        if (this.view_mode === "vote") {
            // ## Create section for vote button
            let eVote = eRoot.querySelector('[data-section="vote"]');
            eVote = document.createElement("div");
            eVote.dataset.section = "vote";
            eRoot.appendChild(eVote);
            if (this.HISTORYFindPoll(this.GetActivePoll()) === false && this.poll.count < 1) {
                if (eVote) {
                    eVote.innerHTML = `<button class='button is-white is-rounded is-primary is-large' style='width: 300px;'>RÖSTA</button>`;
                }
                let eButtonVote = eVote.querySelector("button");
                eButtonVote.setAttribute("disabled", "");
                eButtonVote.addEventListener("click", (e) => {
                    e.srcElement.style.display = "none";
                    this.SendVote();
                });
            }
            else {
                eVote.innerText = `Röst är registrerad för aktuell fråga.`;
            }
        }
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        CPage.ReadColumnInformationFromHeader(oTD, oResult.table.header);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        let aBody = oTD.GetData()[0];
        let aCondition = [];
        aBody.forEach((aRow, i) => {
            // For each question in poll we add one condition to page state to return answers for that question where user are able to vote for one or more.
            const iQuestion = aRow[0];
            aCondition.push({ ready: false, table: "TPollQuestion1", id: "PollQuestionK", value: iQuestion });
            let eSection = document.createElement("section");
            eSection.dataset.question = iQuestion.toString();
            const sName = aRow[1];
            eSection.className = "block section";
            const iPollIndex = i + 1; // Index for poll query
            eSection.innerHTML = `<header class="title is-3">${iPollIndex}: ${sName}</header><article style="display: block;"></article>`;
            eQuestion.appendChild(eSection);
        });
        this.m_oPageState.SetCondition(aCondition);
    }
    /**
     * Create vote for poll question. Creates markup for possible answers to poll question
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server result with answers for questions in selected poll
     */
    RESULTCreateVote(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        // ## Find key for first waiting question
        let TDVote = new CTableData({ id: oResult.id, name: oResult.name, external: { max: 1, min: 1 } });
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        TDVote.ReadArray(oResult.table.body, { begin: 0 });
        let aColumn = TDVote.InsertColumn(2, 0, 1);
        CTableData.SetPropertyValue(aColumn, true, "id", "check");
        CTableData.SetPropertyValue(aColumn, true, "alias", "Röst");
        CTableData.SetPropertyValue(aColumn, true, "edit.name", "checkbox");
        CTableData.SetPropertyValue(aColumn, true, "edit.edit", true);
        CTableData.SetPropertyValue(aColumn, true, "edit.element", 1);
        TDVote.COLUMNUpdatePositionIndex();
        let iQuestion = TDVote.CELLGetValue(0, 0);
        this.m_oPageState.AddTableData(iQuestion, TDVote);
        // ## Find container element to question
        let eSection = eRoot.querySelector(`section[data-question="${iQuestion}"]`);
        let eArticle = eSection.querySelector("article");
        //let TDVote = new CTableData({ id: oResult.id, name: oResult.name, external: { max: 1, min: 1 } });
        //aQuestion[ 3 ] = TDVote;
        let oStyle = {
            html_group: "table.table",
            html_row: "tr",
            html_cell_header: "th",
            html_cell: "td",
            html_section_header: "thead",
            html_section_body: "tbody",
            html_section_footer: "tfoot",
        };
        let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPage.CallbackVote });
        let options = {
            parent: eArticle,
            section: ["title", "table.header", "table.body", "footer"],
            table: TDVote,
            name: "vote",
            style: oStyle,
            edit: 1,
            state: 0x0011,
            trigger: oTrigger,
        };
        let TTVote = new CUITableText(options);
        TDVote.UIAppend(TTVote);
        TTVote.COLUMNSetRenderer(0, (e, v, a) => {
            let eCheck = e.querySelector("div");
            let sChecked = "";
            if (v === "1" || v === 1)
                sChecked = "checked";
            let eDiv = document.createElement("div");
            eDiv.innerHTML = `
<label class="vote-check" data-style="rounded" data-color="green" data-size="lg">
<input ${sChecked} type="checkbox" data-value="1" data-commit="1" value="1">
<span class="toggle">
<span class="switch"></span>
</span>
</label>`;
            e.appendChild(eDiv);
        });
        TTVote.Render();
        let eFooter = TTVote.GetSection("footer");
        eFooter.innerHTML = `<div>
<span data-info="data" style='display: inline-block; margin-left: 3em;'></span>
<span data-info="xml" style='display: inline-block; margin-left: 3em;'></span>
</div>`;
    }
    /**
     * Create markup showing vote count on each answer for poll question
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server results for each answer to questions in selected poll
     */
    RESULTCreateVoteCount(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let TDVote = new CTableData({ id: oResult.id, name: oResult.name });
        const aHeader = oResult.table.header;
        CPage.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        TDVote.ReadArray(oResult.table.body, { begin: 0 });
        TDVote.COLUMNSetType(TDVote.ROWGet(1));
        TDVote.COLUMNUpdatePositionIndex();
        let iQuestion = TDVote.CELLGetValue(0, 0);
        // ## Find container element to question
        let eSection = eRoot.querySelector(`section[data-question="${iQuestion}"]`);
        let eArticle = eSection.querySelector("article");
        let oStyle = {
            html_group: "table.table",
            html_row: "tr",
            html_cell_header: "th",
            html_cell: "td",
            html_section_header: "thead",
            html_section_body: "tbody",
            html_section_footer: "tfoot",
        };
        let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPage.CallbackVote });
        let options = {
            parent: eArticle,
            section: ["title", "table.header", "table.body", "footer"],
            table: TDVote,
            name: "vote",
            style: oStyle,
            trigger: oTrigger,
        };
        let TTVote = new CUITableText(options);
        TDVote.UIAppend(TTVote);
        TTVote.Render();
    }
    /**
     *
     */
    URLReadSelectedPoll() {
        const oParams = new URLSearchParams(location.search);
        if (oParams.has("poll")) {
            const iPoll = parseInt(oParams.get("poll"), 10);
            if (typeof iPoll === "number")
                this.SetActivePoll(iPoll, undefined, true);
        }
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
class CPageState {
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
