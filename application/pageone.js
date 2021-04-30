/*

pageone = page logic for managing one vote, user can not select any votes. active vote is sent as parameter

# Navigate

|Name|Description
|:-|:-|
| SendVote | Send vote to server to register vote for user |
| **SetActiveState** | Set active state for page, use this when parts in head or body is changed |
| **SetActivePoll** | Calling this method triggers a chain of operations that will display needed information about active poll |
| OpenMessage | Show message to user |
| **ProcessResponse** | Process responses from server |
| QUERYGetPollList | Get active polls. query = poll_list |
| QUERYGetPollOverview | Get information about selected poll. query = poll_overview. query = `poll_overview` |
| QUERYGetPollLinks | Get links for poll. Query used is `poll_links` |
| QUERYGetPollFilterCount | Get poll result (votes are counted) |
| RESULTCreatePollList | Create drop-down with active polls |
| RESULTCreateLogin | Create login section |
| RESULTCreateFindVoter | Result from finding voter, this is called if user tries to login |
| RESULTCreatePollHashtags | Create hash tags to filter from |
| RESULTCreatePollOverview | Process result from  `poll_overview`|
| RESULTCreatePollOverviewLinks | Process result from `poll_links` and render these for user |
| RESULTCreatePollFilterCount | Create table with poll result |
| RESULTCreateQuestionPanel | Create panels for each question that belongs to current selected poll. Like containers for selectable votes |
| RESULTCreateVote | Create vote for poll question. Creates markup for possible answers to poll question |
| RESULTCreateVoteCount | Create markup showing vote count on each answer for poll question |
| RESULTCreateSearch | Create search table used to select active poll, toolbar with navigation is also created here |
| CONDITIONMarkFilterVote |  Mark items that has been filtered |
| WalkNextState | Walks queries used to collect information for active state |
| PAGECreateToolbarForSearch | Walks queries used to collect information for active state |

|||

D3
https://dev.to/plebras/want-to-learn-d3-let-s-make-a-bar-chart-3o5n
*/
import { CTableData, enumReturn } from "./../library/TableData.js";
import { CTableDataTrigger } from "./../library/TableDataTrigger.js";
import { CUIPagerPreviousNext } from "./../library/UIPagerPreviousNext.js";
import { CDispatch } from "./../library/Dispatch.js";
import { CUITableText } from "./../library/UITableText.js";
import { CQuery } from "./../server/Query.js";
import { CPageSuper, CPageState } from "./pagesuper.js";
import { CD3Bar } from "./pageone_d3.js";
export class CPageOne extends CPageSuper {
    constructor(oApplication, oOptions) {
        super(oApplication, oOptions);
        const o = oOptions || {};
        this.m_oD3Bar = new CD3Bar();
        this.m_bFilterConditionCount = false;
        this.m_oPoll = { poll: -1, vote: -1, count: 0 };
        this.m_sSession = o.session || null;
        this.m_oState = o.state || {};
        this.m_oUITableText = {};
        this.m_sViewMode = "vote"; // In what mode selected poll is. "vote" = enable voting for voter, "count" = view vote count for selected poll
        this.m_aPageState = [
            new CPageState({ section: "body", name: "vote", container: document.getElementById("idPollVote"), query: [["poll_question_list", 0 /* send */, []], ["poll_answer", 0 /* send */, []]] }),
            new CPageState({ section: "body", name: "count", container: document.getElementById("idPollFilterCount"), query: [["poll_question_list", 0 /* send */, []], ["poll_answer_count", 0 /* send */, []]] }),
            new CPageState({ section: "body", name: "search", container: document.getElementById("idPollSearch"), isolated: true, query: [["poll_search", 0 /* send */, false]] }),
            new CPageState({ section: "body", name: "select", container: null, query: [["poll_question_list", 0 /* send */, []], ["poll_answer", 0 /* send */, []]] }),
        ];
        this.m_oElement = {
            "error": document.getElementById("idError"),
            "message": document.getElementById("idMessage"),
            "warning": document.getElementById("idWarning")
        };
        this.m_aVoter = [-1, "", ""]; // no voter (-1)
        this.m_aVoteHistory = [];
        this.HISTORYSerialize(false);
    }
    get app() { return this.m_oApplication; } // get application object
    get poll() { return this.m_oPoll; }
    get state() { return this.m_oState; } // get state object
    get search_mode() { return this.m_sSearchMode; }
    set search_mode(sMode) {
        this.m_sSearchMode = sMode;
    }
    get view_mode() { return this.m_sViewMode; }
    set view_mode(sMode) {
        console.assert(sMode === "vote" || sMode === "count" || sMode === "search" || sMode === "select", "Invalid view mode: " + sMode);
        this.m_sViewMode = sMode;
    }
    set voter(aVoter) { this.m_aVoter = aVoter; }
    GetActivePoll() { return this.poll.poll; }
    /**
     * Activate poll with number
     * @param iActivePoll key to active poll
     * @param {string} [sName] Name for active poll
     */
    SetActivePoll(iActivePoll, sName) {
        this.CloseQuestions();
        if (this.m_oD3Bar)
            this.m_oD3Bar.DeleteQuestion();
        if (iActivePoll !== this.GetActivePoll()) {
            document.getElementById("idPollOverview").querySelector('[data-section="result_vote_count"]').style.display = "none";
        }
        if (typeof iActivePoll === "number") {
            this.poll.poll = iActivePoll;
            if (iActivePoll <= 0) {
                this.RESULTCreatePollOverview("idPollOverview"); // this clears poll overview
                return;
            }
        }
        this.QUERYGetPollOverview(this.poll.poll, sName);
        const aCondition = [[{ ready: false, table: "TPollQuestion1", id: "PollK", value: this.poll.poll, simple: sName }]];
        if (!this.m_oPageState)
            this.SetActiveState("body." + this.view_mode, undefined, aCondition);
        else {
            this.m_oPageState.SetActive(aCondition);
        }
        this.WalkNextState();
    }
    /**
     * Return true if voter key is found
     */
    IsVoter() { return this.m_aVoter[0] !== -1; }
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
    /**
     * Set active state for page, use this when parts in head or body is changed
     * @param sState
     * @param eElement
     * @param aCondition
     */
    SetActiveState(sState, eElement, aCondition) {
        const [sSection, sName] = sState.split(".");
        if (sSection === "body") {
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
        }
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
            if (this.m_oPageState.IsIsolated() === false) {
                this.m_oPageState = null;
                this.QUERYGetPollFilterCount(this.GetActivePoll());
            }
            else {
                this.m_oPageState = null;
            }
            return;
        }
        if (aQuery[1] === 2 /* delivered */) {
            let aCondition = aQuery[2];
            if (typeof aCondition !== "boolean") {
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
            else {
                aQuery = this.m_oPageState.GetOngoingQuery();
            }
        }
        if (aQuery && aQuery[1] === 0 /* send */) { // if query is in send state then send it
            // Get first filter that isn't sent
            let aCondition = aQuery[2];
            let sXml;
            if (aCondition) {
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
                sXml = oQuery.CONDITIONGetXml();
            }
            const sQuery = aQuery[0];
            let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: sQuery, set: "vote", count: 50, format: 1, start: 0 };
            if (sQuery === "poll_search")
                oCommand.count = 10; // max 10 rows for search
            if (!sXml)
                delete oCommand.delete; // No condition then keep active conditions for query
            request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
            aQuery[1] = 1 /* waiting */; // change state to waiting
        }
        else {
            console.assert(false, "we should not go here");
            this.m_oPageState = null;
            this.m_oD3Bar.Render(this.m_bFilterConditionCount);
        }
    }
    CloseQuestions() {
        document.getElementById("idPollVote").innerHTML = "";
        document.getElementById("idPollFilterCount").innerHTML = "";
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
                                case "poll_search":
                                    this.RESULTCreateSearch(this.m_oPageState.container, oResult);
                                    break;
                                default: console.assert(false, `Result for ${sQueryName} has no stub`);
                            }
                            if (typeof aQuery[2] !== "boolean") { // if boolean that means that query for state do not need any conditions
                                let aCondition = aQuery[2];
                                let i = 0;
                                while (i < aCondition.length && aCondition[i].ready === true)
                                    i++;
                                // Check for more conditions?
                                if (i < aCondition.length) {
                                    aQuery[1] = 0 /* send */;
                                }
                            }
                            this.WalkNextState(); // Go to next step in active state
                            return;
                        }
                    }
                    if (sQueryName === "poll_overview") {
                        this.RESULTCreatePollOverview("idPollOverview", oResult);
                    }
                    else if (sQueryName === "poll_links") {
                        this.RESULTCreatePollOverviewLinks("idPollOverview", oResult);
                    }
                    else if (sQueryName === "poll_answer_filtercount") {
                        this.RESULTCreatePollFilterCount("idPollOverview", oResult);
                    }
                    else if (sQueryName === "poll_search") {
                        this.RESULTCreateSearch("idPollSearch", oResult);
                    }
                }
                break;
            //case "load":
            case "load_if_not_found":
                this.CallOwner("load");
                break;
            case "query_conditions":
                if (sHint === "poll_answer_filtercount")
                    this.CONDITIONMarkFilterVote(oResult);
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
                            this.QUERYGetPollFilterCount(this.GetActivePoll());
                        }
                        this.poll.vote = -1;
                    }
                    else if (sQueryName === "login") {
                        this.CallOwner("insert-voter");
                    }
                }
                break;
            default: {
                let iPosition = sName.indexOf("get_query_information-");
                if (iPosition === 0) {
                    if (oResult.name === "poll_search") {
                        this.PAGECreateToolbarForSearch(oResult);
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
    QUERYGetPollOverview(iPoll, sSimple) {
        let request = this.app.request;
        let oQuery = new CQuery({
            conditions: [{ table: "TPoll1", id: "PollK", value: iPoll, simple: sSimple }]
        });
        let sXml = oQuery.CONDITIONGetXml();
        let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_overview", set: "vote", count: 50, format: 1, start: 0 };
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
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
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
    }
    QUERYGetPollFilterCount(_1) {
        let request = this.app.request;
        const sQuery = "poll_answer_filtercount";
        let aCondition;
        let oCommand = { command: "add_condition_to_query get_result", query: sQuery, set: "vote", count: 100, format: 1, start: 0 };
        if (typeof _1 === "number") {
            aCondition = [{ table: "TPoll1", id: "PollK", value: _1 }];
            oCommand.delete = 1;
        }
        else {
            if (typeof _1.answer === "number") {
                aCondition = [{ table: "TPollVote1", id: "TieFilterAnswer", value: _1.answer }];
                oCommand.command = "add_condition_to_query get_query_conditions get_result";
            }
            else if (typeof _1.condition === "string") {
                oCommand.command = "delete_condition_from_query get_query_conditions get_result";
                oCommand.uuid = _1.condition;
            }
        }
        let oQuery = new CQuery({ conditions: aCondition });
        let sXml = oQuery.CONDITIONGetXml();
        this.m_bFilterConditionCount = false;
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", hint: sQuery, json: request.GetJson(oCommand) }, sXml);
    }
    QUERYGetSearch(oCondition) {
        const iStart = oCondition.start || 0;
        let request = this.app.request;
        let sCommand = "";
        let oCommand = { query: "poll_search", set: "vote", count: 10, format: 1, start: iStart };
        if (oCondition.snapshot) {
            oCommand.name = oCondition.snapshot;
            sCommand += " set_snapshot";
        }
        sCommand += " get_result";
        oCommand.command = sCommand;
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", hint: "poll_search", json: request.GetJson(oCommand) });
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
        CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
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
        this.poll.count = 0; // TODO: remove this when voter should be blocked to vote more than once
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
        // show or hide links
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
        CPageSuper.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        TDVote.ReadArray(oResult.table.body, { begin: 0 });
        let iQuestion = TDVote.CELLGetValue(0, 0);
        // add to our voter count chart data
        for (let i = 0, iTo = TDVote.ROWGetCount(); i < iTo; i++) {
            this.m_oD3Bar.AddAnswer(iQuestion, [
                TDVote.CELLGetValue(i, "PollAnswerK"),
                TDVote.CELLGetValue(i, "FName"),
                0, 0
            ]);
        }
        this.m_oPageState.AddTableData(iQuestion, TDVote);
        if (!eRoot)
            return; // no root item then skip
        let aColumn = TDVote.InsertColumn(2, 0, 1);
        CTableData.SetPropertyValue(aColumn, true, "id", "check");
        CTableData.SetPropertyValue(aColumn, true, "alias", "Röst");
        CTableData.SetPropertyValue(aColumn, true, "edit.name", "checkbox");
        CTableData.SetPropertyValue(aColumn, true, "edit.edit", true);
        CTableData.SetPropertyValue(aColumn, true, "edit.element", 1);
        TDVote.COLUMNUpdatePositionIndex();
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
        let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPageSuper.CallbackVote });
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
     * Process result from `poll_links` and render these for user
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server result with information about links
     */
    RESULTCreatePollOverviewLinks(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
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
    RESULTCreatePollFilterCount(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        oTD.COLUMNSetPropertyValue("PollQuestionK", "position.hide", true);
        oTD.COLUMNSetPropertyValue("PollVoteK", "position.hide", false);
        oTD.COLUMNSetPropertyValue("Question", "alias", "Fråga");
        oTD.COLUMNSetPropertyValue("Answer", "alias", "Svar");
        oTD.COLUMNSetPropertyValue("PollVoteK", "alias", "Antal röster");
        oTD.COLUMNSetType("PollVoteK", "number");
        if (this.m_bFilterConditionCount === true)
            this.m_oD3Bar.ResetFilterCount();
        // Update bar chart with values from filter
        for (let i = 0, iTo = oTD.ROWGetCount(); i < iTo; i++) {
            let a = [undefined, undefined];
            if (this.m_bFilterConditionCount === true) {
                //a[1] = Math.floor(Math.random() * 25);
                a[1] = oTD.CELLGetValue(i, "Count");
            }
            else {
                //a[0] = Math.floor(Math.random() * 100);
                a[0] = oTD.CELLGetValue(i, "Count");
            }
            this.m_oD3Bar.SetAnswerCount(oTD.CELLGetValue(i, "PollQuestionK"), oTD.CELLGetValue(i, "Answer"), a //<number>oTD.CELLGetValue(i,"Count") 
            );
        }
        let eResult = eRoot.querySelector('[data-section="result_vote_count"]');
        eResult.innerHTML = "";
        let oStyle = {
            html_group: "table.table",
            html_row: "tr",
            html_cell_header: "th",
            html_cell: "td",
            html_section_header: "thead",
            html_section_body: "tbody",
        };
        let options = {
            parent: eResult,
            section: ["table.header", "table.body"],
            table: oTD,
            style: oStyle,
        };
        let oTT = new CUITableText(options);
        oTD.UIAppend(oTT);
        oTT.COLUMNSetRenderer(0, (e, v, a) => {
            const iRow = a[0][0];
            if (iRow > 0) {
                //check if value is same as value in previous row
                const sRowBefore = oTT.GetBodyValue(iRow - 1, 0);
                if (sRowBefore === v)
                    return;
            }
            let eB = document.createElement("b");
            eB.innerText = v;
            e.appendChild(eB);
        });
        oTT.Render();
        this.m_oD3Bar.Render(this.m_bFilterConditionCount);
        //eResult.style.display = "block";                     // show result
    }
    /**
     * Create panels for each question that belongs to current selected poll
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server result with questions for selected poll
     */
    RESULTCreateQuestionPanel(eRoot, oResult) {
        let eQuestion;
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        let eD3Bars = document.getElementById("idPollOverview").querySelector('[data-section="d3bars"]');
        eD3Bars.innerHTML = "";
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
        if (eRoot) {
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
                eVote.className = "has-text-info is-size-4";
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
                    eVote.innerText = "Röst är registrerad för aktuell fråga.";
                }
            }
        }
        let aBody = oTD.GetData()[0];
        let aCondition = [];
        aBody.forEach((aRow, i) => {
            // For each question in poll we add one condition to page state to return answers for that question where user are able to vote for one or more.
            const iQuestion = aRow[0];
            const sName = aRow[1];
            const iPollIndex = i + 1; // Index for poll query
            aCondition.push({ ready: false, table: "TPollQuestion1", id: "PollQuestionK", value: iQuestion });
            if (eRoot) {
                let eQuestion = eRoot.querySelector('[data-section="question"]'); // section where vote questions are placed
                let eSection = document.createElement("section");
                eSection.dataset.question = iQuestion.toString();
                eSection.className = "block";
                eSection.style.margin = "1em";
                eSection.innerHTML = `<header class="title is-3">${iPollIndex}: ${sName}</header><article style="display: block;"></article>`;
                eQuestion.appendChild(eSection);
            }
            let eSection = document.createElement("section");
            eSection.className = "block box";
            eSection.style.padding = "0.5em";
            eSection.innerHTML = `<div class="is-size-6 has-text-weight-semibold" data-type="title"></div><div data-type="chart"></div>`;
            let eTitle = eSection.querySelector('[data-type="title"]');
            eTitle.innerText = sName;
            let eChart = eSection.querySelector('[data-type="chart"]');
            this.m_oD3Bar.AddQuestion(iQuestion, sName, eChart); // Add question to d3 chart
            eD3Bars.appendChild(eSection);
        });
        this.m_oPageState.SetCondition(aCondition);
    }
    /**
     * Create markup showing vote count on each answer for poll question
     * @param {string|HTMLElement} eRoot
     * @param {any} oResult server results for each answer to questions in selected poll
     */
    RESULTCreateVoteCount(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTD = new CTableData({ id: oResult.id, name: oResult.name });
        const aHeader = oResult.table.header;
        CPageSuper.ReadColumnInformationFromHeader(oTD, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        oTD.COLUMNSetType(oTD.ROWGet(1));
        oTD.COLUMNUpdatePositionIndex();
        oTD.COLUMNSetPropertyValue("ID_Answer", "position.hide", false);
        let iQuestion = oTD.CELLGetValue(0, 0);
        // add to our voter count chart data
        for (let i = 0, iTo = oTD.ROWGetCount(); i < iTo; i++) {
            this.m_oD3Bar.AddAnswer(iQuestion, [
                oTD.CELLGetValue(i, "PollAnswerK"),
                oTD.CELLGetValue(i, "FName"),
                //Math.floor(Math.random() * 100),
                0,
                0
            ]);
        }
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
        let oTrigger = new CTableDataTrigger({ table: oTD, trigger: CPageSuper.CallbackVote });
        let options = {
            parent: eArticle,
            section: ["title", "table.header", "table.body", "footer"],
            table: oTD,
            name: "vote",
            style: oStyle,
            trigger: oTrigger,
        };
        let oTT = new CUITableText(options);
        oTD.UIAppend(oTT);
        oTT.COLUMNSetRenderer(0, (e, v, a) => {
            e.innerHTML = `<button class="button is-primary is-light" data-answer="${v}">Ta bort</button>`;
        });
        oTT.Render();
        eSection = oTT.GetSection("body");
        eSection.addEventListener("click", (e) => {
            const eButton = e.srcElement;
            if (eButton.tagName === "BUTTON") {
                if (typeof eButton.dataset.uuid === "string") {
                    this.QUERYGetPollFilterCount({ condition: eButton.dataset.uuid });
                    eButton.className = "button is-primary is-light";
                    eButton.innerText = "Ta bort";
                    delete eButton.dataset.uuid;
                }
                else {
                    const iAnswer = parseInt(eButton.dataset.answer, 10);
                    this.QUERYGetPollFilterCount({ answer: iAnswer });
                }
            }
        });
    }
    /**
     * Create search table used to select active poll
     * @param {string|HTMLElement} eRoot   Container element for search table
     * @param {any}                oResult result data for search
     */
    RESULTCreateSearch(eRoot, oResult) {
        if (typeof eRoot === "string")
            eRoot = document.getElementById(eRoot);
        let oTT = this.m_oUITableText.poll_search;
        let oTD = oTT ? oTT.data : null;
        if (oTD) {
            oTD.ClearData("body");
            oTD.ReadArray(oResult.table.body, { begin: 0 });
            oTT.Render(); // render with small caps creates elements for body and renders values
            oTT.row_page = oResult.page; // set active page
            return;
        }
        oTD = new CTableData({ id: oResult.id, name: oResult.name });
        const aHeader = oResult.table.header;
        CPageSuper.ReadColumnInformationFromHeader(oTD, aHeader, (iIndex, oColumn, oTD) => {
            if (oColumn.key) {
                oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
            }
        });
        oTD.ReadArray(oResult.table.body, { begin: 0 });
        if (oTD.ROWGetCount() > 0)
            oTD.COLUMNSetType(oTD.ROWGet(1));
        oTD.COLUMNSetPropertyValue("FName", "alias", "Namn");
        oTD.COLUMNSetPropertyValue("FDescription", "alias", "Beskrivning");
        oTD.COLUMNSetPropertyValue("FBegin", "alias", "Start");
        oTD.COLUMNSetPropertyValue("FEnd", "alias", "Slut");
        oTD.COLUMNUpdatePositionIndex();
        let eResult = eRoot;
        eResult.innerHTML = "";
        let oStyle = {
            html_group: "table.table is-narrow is-hoverable is-fullwidth pointer",
            html_row: "tr",
            html_cell_header: "th",
            html_cell: "td",
            html_section_header: "thead",
            html_section_body: "tbody",
        };
        // trigger logic, this will enable triggering callbacks when CUITableText call methods in CTableData
        let oTrigger = new CTableDataTrigger({ table: oTD, trigger: (oEventData, v) => {
                if (oEventData.iEventAll === 131085 /* AfterSelect */) { // cell is selected
                    // try to get the poll id for row
                    const a = oEventData.information;
                    if (a[0] === -1)
                        return; // -1 = no selected
                    const iRowData = a[3]; // index 3 has index to row that is clicked
                    // Get poll id from table data for requested row
                    const oTD = oEventData.data; // get table data
                    const iPoll = oTD.CELLGetValue(iRowData, "PollK"); // get key to poll
                    this.SetActiveState("body.select");
                    this.SetActivePoll(iPoll); // activate poll
                }
                else if (oEventData.iEventAll === 65560 /* BeforeMove */) {
                    const o = oEventData.information;
                    // ## QUERYGetSearch is used to get search data from server
                    const iMoveTo = o.start + o.offset; // row that we are going to move to
                    if (o.offset < 0 && iMoveTo >= 0) { // If offset is negative that means we move backwards
                        this.QUERYGetSearch({ start: iMoveTo > 0 ? iMoveTo : 0 }); // Can't move to negative row
                    }
                    else if (o.offset > 0 && o.count === o.max) {
                        this.QUERYGetSearch({ start: iMoveTo });
                    }
                    return false; // get new result from server, no internal update return false to cancel command
                }
            } });
        let oDispatch = new CDispatch(); // Dispatcher that manages communication between pager and ui table
        let options = {
            dispatch: oDispatch,
            edit: true,
            max: 10,
            parent: eRoot,
            section: ["toolbar", "table.header", "table.body"],
            server: true,
            style: oStyle,
            table: oTD,
            trigger: oTrigger,
            callback_render: function (sType, e, sSection, oColumn) {
                if (sType === "beforeInput") {
                    let eTR = e.eElement.closest("tr");
                    let eTable = eTR.closest("table");
                    eTable.querySelectorAll("tr").forEach(e => e.classList.remove("selected"));
                    eTR.classList.add("selected");
                    this.INPUTClear();
                    return false;
                }
            }
        };
        oTT = new CUITableText(options);
        oTD.UIAppend(oTT);
        oTT.Render();
        // Make header sticky
        let eSection = oTT.GetSection("header");
        let aTH = eSection.querySelectorAll("th");
        aTH.forEach((e) => {
            Object.assign(e.style, { backgroundColor: "var(--bs-white)", position: "sticky", top: "0px" });
        });
        oTT.GetSection("body").focus({ preventScroll: true });
        this.m_oUITableText.poll_search = oTT;
        eRoot.dataset.one = "1"; // You do not need to fill this again
        this.SNAPSHOTGetFor("poll_search");
        this.CallOwner("table", { name: "poll_search", tt: oTT, td: oTD });
    }
    /**
     * Check if poll is found in history from local storage
     * @param {number} iPoll poll key
     */
    HISTORYFindPoll(iPoll) {
        return this.m_aVoteHistory.findIndex(i => i === iPoll) !== -1 ? true : false;
    }
    /**
     * Serialize polls that user has voted  for
     * @param bSave if true then save poll ids, if false load poll ids
     */
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
    static HISTORYSerializeSession(bSave, sSession) {
        if (bSave === true) {
            const oSession = { time: (new Date()).toISOString(), session: sSession };
            localStorage.setItem("session", JSON.stringify(oSession));
        }
        else {
            const sSession = localStorage.getItem("session");
            if (sSession) {
                const oSession = JSON.parse(sSession);
                // Compare date, if older than one hour then skip
                const iDifference = (new Date()) - Date.parse(oSession.time);
                if (iDifference < 3600000) {
                    return oSession.session;
                }
            }
        }
        return null;
    }
    /**
     * Mark condition, user need to know what is filtered on
     * @param {any} oResult condition items for query
     */
    CONDITIONMarkFilterVote(oResult) {
        let oTD = new CTableData();
        oTD.ReadObjects(oResult);
        this.m_bFilterConditionCount = false;
        let i = oTD.ROWGetCount();
        while (--i >= 0) {
            const sId = oTD.CELLGetValue(i, "condition_id");
            if (sId === "TieFilterAnswer") {
                this.m_bFilterConditionCount = true;
                // find button with filter
                let eButton = this.ELEMENTGetFilterButton(parseInt(oTD.CELLGetValue(i, "value"), 10));
                eButton.className = "button is-warning is-light";
                eButton.innerText = "Lägg till";
                eButton.dataset.uuid = oTD.CELLGetValue(i, "uuid");
            }
        }
    }
    /**
     * Remove condition from poll_list query
     * @param {string} sQuery query that conditions are removed from
     * @param {string | string[]} _Uuid [description]
     */
    CONDITIONRemove(sQuery, _Uuid) {
        let sXml;
        let request = this.app.request;
        let oCommand = { command: "delete_condition_from_query get_result get_query_conditions", query: sQuery, set: "vote", count: 100, format: 1, start: 0 };
        if (_Uuid === undefined) { // no uuid, then delete all
            request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", hint: sQuery, json: request.GetJson(oCommand) }, sXml);
            return;
        }
        if (typeof _Uuid === "string") {
            oCommand.uuid = _Uuid;
        }
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", hint: sQuery, json: request.GetJson(oCommand) }, sXml);
    }
    SNAPSHOTGetFor(sQuery) {
        let request = this.app.request;
        let oCommand = { command: "get_query_information", query: sQuery, set: "vote" };
        request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) });
    }
    /**
     * Create dropdown for setting snapshots for selecting poll and pager to move in result
     * @param {any} oResult query data that contains snapshot information
     */
    PAGECreateToolbarForSearch(oResult) {
        let oTT = this.m_oUITableText.poll_search;
        let eToolbar = oTT.GetSection("toolbar");
        eToolbar.style.display = "flex";
        //
        // ## Create snapshot drop down
        //
        if (oResult.snapshots) {
            let eSelect = document.createElement("select");
            oResult.snapshots.forEach((s, i) => {
                let eOption = document.createElement("option");
                eOption.value = s;
                let sText = s;
                const sTitle = sText;
                eOption.innerText = sText;
                if (s === oResult.selected)
                    eOption.setAttribute("selected", "selected");
                eSelect.appendChild(eOption);
            });
            /*
            for( let i = 0; i < result.snapshots.length; i++ ) {
               if( result.snapshots[i] === result.selected ) { result.snapshots[i] = { name: result.snapshots[i], selected: 1 }; break; }
            }
            */
            let eDiv = document.createElement("div");
            eDiv.className = "select is-primary";
            eDiv.appendChild(eSelect);
            eToolbar.appendChild(eDiv);
            eSelect.addEventListener("change", e => {
                const sSnapshot = e.srcElement.value;
                this.QUERYGetSearch({ snapshot: sSnapshot });
            });
        }
        //
        // ## Create pager
        //
        {
            let oDispatch = this.m_oUITableText.poll_search.dispatch;
            let oTT = this.m_oUITableText.poll_search;
            let oTD = oTT ? oTT.data : null;
            let eContainer = document.createElement("div");
            eContainer.style.display = "inline-block";
            eContainer.style.marginLeft = "auto";
            eToolbar.appendChild(eContainer); // add container to toolbar
            let oPager = new CUIPagerPreviousNext({
                dispatch: oDispatch,
                members: { page_max_count: 10, page_count: oTT.ROWGetCount() },
                parent: eContainer,
                callback_action: function (sAction, e) {
                    const [sType, sItem] = sAction.split(".");
                    if (sType === "render" || sType === "create") {
                        let eComponent = e.eElement;
                        let ePrevious = eComponent.querySelector('[data-type="previous"]');
                        let eNext = eComponent.querySelector('[data-type="next"]');
                        if (sType === "create") {
                            ePrevious.className = "button is-primary is-outlined mr-1";
                            eNext.className = "button is-primary is-outlined";
                        }
                        else {
                            const iPage = this.members.page;
                            const iCount = this.members.page_count;
                            const iMax = this.members.page_max_count;
                            if (iPage === 0) {
                                ePrevious.disabled = true;
                                ePrevious.innerText = "Föregående";
                            }
                            else {
                                ePrevious.disabled = false;
                                ePrevious.innerText = "Föregående (" + (iPage) + ")";
                            }
                            if (iCount < iMax) {
                                eNext.disabled = true;
                                eNext.innerText = "Nästa";
                            }
                            else {
                                eNext.disabled = false;
                                eNext.innerText = "Nästa (" + (iPage + 2) + ")";
                            }
                        }
                    }
                    return true;
                }
            });
            oDispatch.AddChain(oPager, oTT); // connect pager with ui table
            oDispatch.AddChain(oTT, [oPager]); // connect ui table with pager
        }
    }
    /**
     * Return element for filter button
     * @param iAnswer key to active answer
     */
    ELEMENTGetFilterButton(iAnswer) {
        const eArticle = document.getElementById("idPollFilterCount");
        const eButton = eArticle.querySelector(`button[data-answer="${iAnswer}"]`);
        return eButton;
    }
}
