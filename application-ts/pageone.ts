/*
# Navigate 
   ## Functions
   SetActivePoll - Calling this method triggers a chain of operations that will display needed information about active poll
   OpenMessage - Open a new message for user
   ProcessResponse - Process responses from server

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
| QUERYGetPollHashtags | Get hash tags for poll or all poll hash tags. Query used is `poll_hashtags` |
| RESULTCreatePollList | Create drop-down with active polls |
| RESULTCreateLogin | Create login section |
| RESULTCreateFindVoter | Result from finding voter, this is called if user tries to login |
| RESULTCreatePollHashtags | Create hash tags to filter from |
| RESULTCreatePollOverview | Process result from  `poll_overview`|
| RESULTCreatePollOverviewLinks | Process result from `poll_links` and render these for user |
| RESULTCreatePollFilterCount | Create table with poll result |
| RESULTCreateQuestionPanel | Create panels for each question that belongs to current selected poll. Like containers for selectable votes |
| RESULTCreateVoteCount | Create markup showing vote count on each answer for poll question |
| CONDITIONMarkFilterVote |  Mark items that has been filtered |
| ELEMENTGetFilterButton |  Get button that adds or removes filter from poll result |

|||

D3
https://dev.to/plebras/want-to-learn-d3-let-s-make-a-bar-chart-3o5n
*/

import { CTableData, CRowRows, enumMove, IUITableData, tabledata_column, tabledata_position, tabledata_format, enumReturn } from "./../library/TableData.js";
import { edit } from "./../library/TableDataEdit.js";
import { CTableDataTrigger, EventDataTable } from "./../library/TableDataTrigger.js";


import { CUITableText, enumState, uitabledata_construct } from "./../library/UITableText.js"
import { CQuery } from "./../server/Query.js"
import { CApplication } from "./application.js"
import { CPageSuper, CPageState } from "./pagesuper.js"

namespace details {
   export const enum enumQueryState { send = 0, waiting = 1, delivered = 2, conditions = 10}

   export type condition = { ready?: boolean, table: string, id: string, value: string|number, simple?: string, operator?: number }

   export type page_construct = {
      callback_action?: ((sMessage: string) => void);
      state?: { [key_name: string]: string|number|boolean } // state items for page
   }
}


export class CPageOne extends CPageSuper {
   m_aPageState: CPageState[];
   m_oPageState: CPageState;        // current page state that is being processed
   /**
    * active poll information
    * @type {number} m_oPoll.poll Key for selected poll
    * @type {number} m_oPoll.vote Key for vote that voter just has voted for (temporary storage when vote is sent to server)
    * @type {number} m_oPoll.count number of votes found for selected poll and voter
    */
   m_oPoll: { poll: number, vote: number, count: number };
   m_oState: { [ key_name: string ]: string | number | boolean }; // States for page, may be used for outside actions
   m_sSearchMode: string;           // Search mode (this is top section in page), valid types are "hash", "field", "area", "personal"
   m_oTDVoter: CTableData;          // User data for voter
   m_sViewMode: string;             // view mode page is in
   m_aVoter: [ number, string, string ];// key, alias and name for current voter
   m_aVoteHistory: number[];        // Local vote history on computer, this is to avoid abuse but is only for the current browser

   // ## One single poll can have one or more questions. Each questions has one or more answers. 
   // ## When poll is selected page gets information about each question in poll and render information 
   // ## for each question in poll. QUESTION_STATE has states to know in what type of information that is needed.
   // State for each question in poll
   // NO_RESULT = no information about question, need to get it from server
   // WAITING_FOR_RESULT = waits for result from server about poll question
   // RESULT_DELIVERED = Result about question is returned from server
   // VOTE_READY_TO_SEND = Vote is ready to send to server, voter has selected answers

   constructor(oApplication, oOptions?: details.page_construct) {
      super( oApplication, oOptions );
      const o = oOptions || {};

      this.m_oPoll = { poll: -1, vote: -1, count: 0 };
      this.m_oState = o.state || {};
      this.m_sViewMode = "vote";          // In what mode selected poll is. "vote" = enable voting for voter, "count" = view vote count for selected poll

      this.m_aPageState = [
         new CPageState({ section: "body", name: "vote", container: document.getElementById("idPollVote"), query: [ [ "poll_question_list", details.enumQueryState.send, [] ], [ "poll_answer", details.enumQueryState.send, [] ] ] }),
         new CPageState({ section: "body", name: "count", container: document.getElementById("idPollCount"), query: [ [ "poll_question_list", details.enumQueryState.send, [] ], [ "poll_answer_count", details.enumQueryState.send, [] ] ] })
      ];

      this.m_oElement = {
         "error": document.getElementById("idError"),
         "message": document.getElementById("idMessage"),
         "warning": document.getElementById("idWarning")
      };

      this.m_aVoter = [ -1, "", "" ];         // no voter (-1)
      this.m_aVoteHistory = [];
      this.HISTORYSerialize(false);
   }

   get app() { return this.m_oApplication; }                                   // get application object
   get poll() { return this.m_oPoll; }
   get state() { return this.m_oState; }                                       // get state object

   get search_mode() { return this.m_sSearchMode; }
   set search_mode(sMode) {
      this.m_sSearchMode = sMode;
   }

   get view_mode() { return this.m_sViewMode; }
   set view_mode(sMode) {
      console.assert(sMode === "vote" || sMode === "count", "Invalid view mode: " + sMode);
      this.m_sViewMode = sMode;
   }

   set voter( aVoter: [number,string,string] ) { this.m_aVoter = aVoter; }

   GetActivePoll() { return this.poll.poll; }

   /**
    * Activate poll with number
    * @param iActivePoll key to active poll  
    * @param {string} [sName] Name for active poll
    */
   SetActivePoll(iActivePoll?: number, sName?: string ) {
      this.CloseQuestions();

      if( iActivePoll !== this.GetActivePoll() ) {
         (<HTMLElement>document.getElementById( "idPollOverview" ).querySelector('[data-section="result"]')).style.display = "none";
      }

      if( typeof iActivePoll === "number" ) {
         this.poll.poll = iActivePoll;
         if( iActivePoll <= 0 ) {
            this.RESULTCreatePollOverview("idPollOverview");// this clears poll overview
            return;
         }
      }

      this.QUERYGetPollOverview(this.poll.poll, sName);

      const aCondition: [details.condition][] = [[ { ready: false, table: "TPollQuestion1", id: "PollK", value: this.poll.poll, simple: sName } ]];
      if( !this.m_oPageState ) this.SetActiveState( "body." + this.view_mode, undefined, aCondition );
      else {
         this.m_oPageState.SetActive( aCondition );
      }

      this.WalkNextState();

      if( this.view_mode === "count" ) this.QUERYGetPollFilterCount( iActivePoll );
   }


   /**
    * Return true if voter key is found
    */
   IsVoter(): boolean { return this.m_aVoter[0] !== -1; }

   /**
    * Get CPageState for section and name
    * @param {string} sSection section name
    * @param {string} sName name for page state
    */
   GetPageState(sSection: string, sName: string): CPageState {
      for(let i = 0; i < this.m_aPageState.length; i++) {
         const o = this.m_aPageState[i];
         if( sSection === o.section && sName === o.name ) return o;
      }                                                                       console.assert(false, "state not found");

      return null;
   }


   /**
    * Set active state for page, use this when parts in head or body is changed
    * @param sState
    * @param eElement
    * @param aCondition
    */
   SetActiveState(sState: string, eElement?: HTMLElement, aCondition?: [details.condition][]) {
      const [sSection, sName] = sState.split(".");

      if(sSection === "body") {
         this.view_mode = sName;
         let oPageState: CPageState = this.GetPageState(sSection, sName);
         // Clear active state for section
         for(let i = 0; i < this.m_aPageState.length; i++) {
            const o = this.m_aPageState[ i ];
            if(sSection === o.section) o.SetActive();        // clear active state
         }

         oPageState.SetActive(aCondition);
         this.m_oPageState = oPageState;
      }
   }


   /**
    * Walks queries used to collect information for active state
    */
   WalkNextState() {
      if( !this.m_oPageState ) return;

      let request = this.app.request;
      let aQuery = this.m_oPageState.GetOngoingQuery();     // returns first query where result hasn't been delivered
      if( aQuery === null ) {
         this.m_oPageState.Reset();                         // reset state (set queries to be sent and removes conditions)
         this.m_oPageState = null;
         return;         
      }

      if(aQuery[ 1 ] === details.enumQueryState.delivered) {
         let aCondition = aQuery[2];
         let i = 0;
         while( i < aCondition.length && aCondition[i].ready === true );
         if(i < aCondition.length) { aCondition[ i ].ready = true; i++; }

         // Check for more conditions?
         if(i < aCondition.length) { aQuery[1] = details.enumQueryState.send; }
         else {
            // get next non delivered query
            aQuery = this.m_oPageState.GetOngoingQuery();
         }
      }


      if(aQuery && aQuery[ 1 ] === details.enumQueryState.send) {              // if query is in send state then send it
         // Get first filter that isn't sent
         let aCondition = aQuery[ 2 ];

         let oQuery = new CQuery();
         let a = [];
         for(let i = 0; i < aCondition.length; i++) {
            let oC = aCondition[ i ];
            if(oC.ready === false) {
               oQuery.CONDITIONAdd( oC );
               oC.ready = true;
               break;
            }
         }
         let sXml = <string>oQuery.CONDITIONGetXml();
         const sQuery = aQuery[0];
         let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: sQuery, set: "vote", count: 50, format: 1, start: 0 };
         request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
         aQuery[ 1 ] = details.enumQueryState.waiting;                        // change state to waiting
      }
      else this.m_oPageState = null;
   }


   CloseQuestions() {
      document.getElementById("idPollVote").innerHTML = "";
      document.getElementById("idPollCount").innerHTML = "";
      this.OpenMessage();                                   // close any open message
   }

   /**
    * Is Poll ready to send  to server to register vote for voter?
    * @param {boolean} [bUpdateVoteButton] Update button in page
    * @returns {boolean} true if questions are ready to be sent to server, false if not
    */
   IsReadyToVote( bUpdateVoteButton?: boolean ) {
      let oPageState = this.GetPageState("body", "vote" );  // page state 2body.vote" holds information about the user vote
      let aTD = oPageState.GetTableData();
      let iOkCount = 0;
      aTD.forEach(oTD => { 
         if( (<any>oTD.external).ready === true ) iOkCount++;
      })

      const bReady = aTD.length === iOkCount;
      if(bUpdateVoteButton === true) {
         let e = <HTMLElement>oPageState.container.querySelector('[data-section="vote"]').querySelector("button");
         if(e) {  // if voter is blocked from voting the button do not exist
            if(bReady) e.removeAttribute("disabled");
            else e.setAttribute("disabled", "");
         }
      }
      return bReady;
   }

   /**
    * Collect information about what voter has selected and sent that to server to register vote
    */
   SendVote() {                                             console.assert( this.GetActivePoll() > 0, "Active poll isn't set." )
                                                            console.assert( this.IsReadyToVote(), "Trying to send vote to server but vote isn't ready to be sent." );
      let aValue = [];

      // ## Extract key values from, values for poll is found i page state body.vote
      const aTD = this.GetPageState("body", "vote" ).GetTableData();
      aTD.forEach( oTD => {
         const aRow = <number[]>oTD.CountValue([ -1, "check" ], 1, enumReturn.Array); // get values from "check" column with value 1
         aRow.forEach(iRowKey => {
            // IMPORTANT! Column 2 in query on server gets value from "PollAnswerK". This binds user vote to answer in poll
            aValue.push({ index: 2, value: oTD.CELLGetValue(iRowKey, "PollAnswerK") }); // column with index 2 gets key to answer
         });
      });

      let aHeader = [ { name: "PollK", value: this.GetActivePoll() } ];
      if(this.m_aVoter[ 0 ] !== -1) {
         aHeader.push( { name: "VoterK", value: this.m_aVoter[ 0 ] });;
      }

      let oQuery = new CQuery({
         header: aHeader,
         values: aValue
      });

      let oDocument = (new DOMParser()).parseFromString("<document/>", "text/xml");
      oQuery.HEADERGetXml({document: true}, oDocument);
      aValue.forEach((_value, i) => { 
         oQuery.values = _value;
         oQuery.VALUEGetXml({index: i, values: "row", document: true}, oDocument);
      });
      
      const sXml = (new XMLSerializer()).serializeToString(oDocument);
      let oCommand = { command: "add_rows", query: "poll_vote", set: "vote", table: "TPollVote1" };
      let request = this.app.request;
      request.Get("SCRIPT_Run", { file: "PAGE_result_edit.lua", json: request.GetJson(oCommand) }, sXml);
      this.poll.vote = this.poll.poll;                      // keep poll index for later when response from server is returned
   }


   ProcessResponse(eItem: Element, sName: string, sHint: string ) {
      let oResult = JSON.parse(eItem.textContent);
      switch(sName) {
         case "delete_condition":
            //if( sHint === "poll_answer_filtercount")
            break;
         case "result": {
            const sQueryName = oResult.name;                                  // get query name

            if(this.m_oPageState) {                                           // found active state ?
               if(this.m_oPageState.GetQueryName() === sQueryName) {          // compare name with current query in page state, if match then walk to next page state
                  let aQuery = this.m_oPageState.GetOngoingQuery();
                  aQuery[1] = details.enumQueryState.delivered;

                  switch(sQueryName) {
                     case "poll_question_list": this.RESULTCreateQuestionPanel( this.m_oPageState.container, oResult ); break;
                     case "poll_answer": this.RESULTCreateVote( this.m_oPageState.container, oResult ); break;
                     case "poll_answer_count": this.RESULTCreateVoteCount( this.m_oPageState.container, oResult ); break;
                     default: console.assert( false, `Result for ${sQueryName} has no stub` );
                  }


                  let aCondition = aQuery[2];
                  let i = 0;
                  while( i < aCondition.length && aCondition[i].ready === true ) i++;
                  //if(i < aCondition.length) { aCondition[ i ].ready = true; i++; }

                  // Check for more conditions?
                  if(i < aCondition.length) {
                     aQuery[1] = details.enumQueryState.send;
                  }

                  this.WalkNextState(); // Go to next step in active state

               }
            }

            if(sQueryName === "poll_overview") {
               this.RESULTCreatePollOverview("idPollOverview", oResult);
            }
            else if(sQueryName === "poll_links") {
               this.RESULTCreatePollOverviewLinks("idPollOverview", oResult);
            }
            else if(sQueryName === "poll_answer_filtercount") {
               this.RESULTCreatePollFilterCount("idPollOverview", oResult);
            }
         }  break;
         //case "load":
         case "load_if_not_found":
            this.CallOwner("load");
            break;
         case "message":
            const sType = oResult.type;
            if(sType === "add_rows") {
               const sQueryName = oResult.name;
               if(sQueryName === "poll_vote") {
                  this.OpenMessage("Din röst har blivit registrerad!")
                  if(this.poll.vote > 0) {
                     this.m_aVoteHistory.push(this.poll.vote);
                     this.HISTORYSerialize( true );
                     this.QUERYGetPollFilterCount( this.GetActivePoll() );
                  }
                  this.poll.vote = -1;
               }
               else if(sQueryName === "login") {
                  this.CallOwner("insert-voter");
               }
            }
            break;
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
         conditions: [ { table: "TPoll1", id: "PollK", value: iPoll, simple: sSimple } ]
      });
      let sXml = <string>oQuery.CONDITIONGetXml();

      let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_overview", set: "vote", count: 50, format: 1, start: 0 };
      request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
   }

   /**
    * Get links associated to poll
    * @param {number} iPoll   Index to selected poll
    */
   QUERYGetPollLinks(iPoll: number) {
      let request = this.app.request;
      let oQuery = new CQuery({
         conditions: [ { table: "TPoll1", id: "PollK", value: iPoll } ]
      });
      let sXml = <string>oQuery.CONDITIONGetXml();

      let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_links", set: "vote", count: 50, format: 1, start: 0 };
      request.Get("SCRIPT_Run", { file: "PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
   }


   /**
    * Get poll result, result that can be filtered
    * @param {number} iPoll   Index to selected poll
    */
   QUERYGetPollFilterCount(iPoll: number);
   QUERYGetPollFilterCount( oAnswer: { answer: number } );
   QUERYGetPollFilterCount( oAnswer: { condition: string } );
   QUERYGetPollFilterCount( _1: any) {
      let request = this.app.request;
      const sQuery = "poll_answer_filtercount";

      let aCondition: any[];
      let oCommand: {[k:string]: string|number} = { command: "add_condition_to_query get_result", query: sQuery, set: "vote", count: 100, format: 1, start: 0 };

      if( typeof _1 === "number" ) { 
         aCondition = [ { table: "TPoll1", id: "PollK", value: _1 } ];
         oCommand.delete = 1;
      }
      else {
         if( typeof _1.answer === "number" ) {
            aCondition = [ { table: "TPollVote1", id: "TieFilterAnswer", value: _1.answer } ];
            oCommand.command = oCommand.command += " get_query_conditions";
         }
         else if( typeof _1.condition === "string" ) {
            oCommand.command = "delete_condition_from_query get_result get_query_conditions";
            oCommand.uuid = _1.condition;
         }
      }
      let oQuery = new CQuery( { conditions: aCondition });
      let sXml = <string>oQuery.CONDITIONGetXml();

      request.Get("SCRIPT_Run", { file: "PAGE_result.lua", hint: sQuery, json: request.GetJson(oCommand) }, sXml);
   }




   /**
    * result for selected poll
    * If data is found then get questions for poll
    * @param {string|HTMLElement} eRoot
    * @param oResult
    */
   RESULTCreatePollOverview(eRoot: string|HTMLElement, oResult?: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);
      if( oResult === undefined ) {
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

      const sName = <string>oTD.CELLGetValue(0, 1);         // Poll name
      const sDescription = <string>oTD.CELLGetValue(0, 2);  // Poll description
      const iQuestionCount = <number>oTD.CELLGetValue(0, 3);// Number of questions in poll
      const iLinkCount = <number>oTD.CELLGetValue(0, "CountLink");// Links associated with poll
      const iVoteCount = <number>oTD.CELLGetValue(0, "MyCount");// if registered voter has voted in this poll
      const iIpCount = <number>oTD.CELLGetValue(0, "IpCount");// if count number of votes for ip number
      if( typeof iVoteCount === "number" ) this.poll.count = iVoteCount;
      else this.poll.count = 0;

      if(this.IsVoter() === false && iIpCount > 0) {
         this.poll.count = iIpCount;
      }

      if(iQuestionCount > 0) {
         // ## Generate title for poll
         let eTitle = <HTMLElement>eRoot.querySelector("[data-title]");
         eTitle.textContent = sName;
         let eDescription = <HTMLElement>eRoot.querySelector("[data-description]");
         if(eDescription) eDescription.textContent = sDescription || "";
         let eCount = eRoot.querySelector("[data-count]");
         if(eCount) eCount.textContent = iQuestionCount.toString();
      }

      let eLink = <HTMLElement>eRoot.querySelector('[data-section="link"]');
      if( iLinkCount > 0 ) {
         eLink.style.display = "block";
         this.QUERYGetPollLinks( this.GetActivePoll() );
      }
      else { eLink.style.display = "none"; }
   }


   /**
    * Create vote for poll question. Creates markup for possible answers to poll question
    * @param {string|HTMLElement} eRoot
    * @param {any} oResult server result with answers for questions in selected poll
    */
   RESULTCreateVote(eRoot: string|HTMLElement, oResult: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);

      // ## Find key for first waiting question
      let TDVote = new CTableData({ id: oResult.id, name: oResult.name, external: { max: 1, min: 1 } });
      const aHeader = oResult.table.header;
      CPageSuper.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
         if(oColumn.key) {
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


      let iQuestion: number = <number>TDVote.CELLGetValue(0,0);
      this.m_oPageState.AddTableData( iQuestion, TDVote );

      // ## Find container element to question
      let eSection = <HTMLElement>eRoot.querySelector(`section[data-question="${iQuestion}"]`);
      let eArticle = <HTMLElement>eSection.querySelector("article");



      let oStyle = {
         html_group: "table.table",                // "table" element and class table
         html_row: "tr",                           // "tr" element for each row
         html_cell_header: "th",                   // "th" for column headers
         html_cell: "td",                          // "td" for cells
         html_section_header: "thead",             // "thead" for header section
         html_section_body: "tbody",               // "tbody" for body section
         html_section_footer: "tfoot",             // "tfoot" for footer section
      }

      let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPageSuper.CallbackVote });

      let options = {
         parent: eArticle,                         // container
         section: [ "title", "table.header", "table.body", "footer" ],// sections to create
         table: TDVote,                            // source data
         name: "vote",                             // name to access UI table in CTableData
         style: oStyle,                            // styling
         edit: 1,                                  // endable edit
         state: 0x0011,                            // SetOneClickActivate = 0x0010, HtmlValue = 0x0001
         trigger: oTrigger,
      };

      let TTVote = new CUITableText(<uitabledata_construct><unknown>options);
      TDVote.UIAppend(TTVote);

      TTVote.COLUMNSetRenderer(0, (e, v, a) => {
         let eCheck = <HTMLElement>e.querySelector("div");
         let sChecked = "";
         if(v === "1" || v === 1) sChecked = "checked";
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
   RESULTCreatePollOverviewLinks( eRoot: string|HTMLElement, oResult?: any ) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);

      let oTD = new CTableData({ id: oResult.id, name: oResult.name });
      CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
      oTD.ReadArray(oResult.table.body, { begin: 0 });

      let eLink = <HTMLElement>eRoot.querySelector('[data-section="link"]');

      // remove links if any found
      let eA = eLink.lastElementChild;
      while(eA.tagName === "A") {
         let e = eA;
         eA = eA.previousElementSibling;
         e.remove();
      }


      const iCount = oTD.ROWGetCount();
      let eTemplate = document.createElement('div');
      for(let iRow = 0; iRow < iCount; iRow++) {
         const sLink = <string>oTD.CELLGetValue(iRow, 1);                     // link 
         eTemplate.innerHTML = sLink;
         let eA = eTemplate.firstElementChild;
         eA.className = "panel-block";
         eLink.appendChild(eA);
      }
   }

   RESULTCreatePollFilterCount(eRoot: string | HTMLElement, oResult: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);

      let oTD = new CTableData({ id: oResult.id, name: oResult.name });
      CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
      oTD.ReadArray(oResult.table.body, { begin: 0 });
      oTD.COLUMNSetPropertyValue("PollQuestionK", "position.hide", true)


      oTD.COLUMNSetPropertyValue("PollVoteK", "position.hide", false);
      oTD.COLUMNSetPropertyValue("Question", "alias", "Fråga");
      oTD.COLUMNSetPropertyValue("Answer", "alias", "Svar");
      oTD.COLUMNSetPropertyValue("PollVoteK", "alias", "Antal röster");
      oTD.COLUMNSetType( "PollVoteK", "number" );

      let eResult = <HTMLElement>eRoot.querySelector('[data-section="result"]');
      eResult.innerHTML = "";

      let oStyle = {
         html_group: "table.table",                // "table" element and class table
         html_row: "tr",                           // "tr" element for each row
         html_cell_header: "th",                   // "th" for column headers
         html_cell: "td",                          // "td" for cells
         html_section_header: "thead",             // "thead" for header section
         html_section_body: "tbody",               // "tbody" for body section
      }

      let options = {
         parent: eResult,                          // container
         section: [ "table.header", "table.body" ],// sections to create
         table: oTD,                               // source data
         style: oStyle,                            // styling
      };

      let oTT = new CUITableText(options);
      oTD.UIAppend(oTT);

      oTT.COLUMNSetRenderer(0, (e, v, a) => {
         const iRow: number = a[0][0];
         if(iRow > 0) {
            //check if value is same as value in previous row
            const sRowBefore = <string>oTT.GetBodyValue( iRow - 1, 0 );
            if( sRowBefore === <string>v ) return;

         }
         let eB = document.createElement("b");
         eB.innerText = <string>v;
         (<HTMLElement>e).appendChild( eB );
         //(<HTMLElement>e).innerText = <string>v;
/*
         let eCheck = <HTMLElement>e.querySelector("div");
         let sChecked = "";
         if(v === "1" || v === 1) sChecked = "checked";
         let eDiv = document.createElement("div");
         eDiv.innerHTML = `
<label class="vote-check" data-style="rounded" data-color="green" data-size="lg">
<input ${sChecked} type="checkbox" data-value="1" data-commit="1" value="1">
<span class="toggle">
<span class="switch"></span>
</span>
</label>`;
         e.appendChild(eDiv);
         */
      });


      oTT.Render();
      eResult.style.display = "block";                     // show result
   }

   /**
    * Create panels for each question that belongs to current selected poll
    * @param {string|HTMLElement} eRoot
    * @param {any} oResult server result with questions for selected poll
    */
   RESULTCreateQuestionPanel(eRoot: string|HTMLElement, oResult: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);
      
      // ## Create section where questions are placed. Questions are added to vote section on top
      // <div data-section="vote">
      //    <header class="title is-3">${iPollIndex}: ${sName}</header><article class="block"></article>
      //    .. more questions ..
      // </div>
      // <div>
      //    <button>Vote</button>
      // </div>
      let eQuestion = <HTMLElement>eRoot.querySelector('[data-section="question"]'); // section where vote questions are placed
      if(!eQuestion) {
         eQuestion = <HTMLElement>document.createElement("div");
         eQuestion.dataset.section = "question";
         eRoot.appendChild( eQuestion );
      }

      if(this.view_mode === "vote") {
         // ## Create section for vote button
         let eVote = <HTMLElement>eRoot.querySelector('[data-section="vote"]');
         eVote = document.createElement("div");
         eVote.dataset.section = "vote";
         eRoot.appendChild(eVote);

         if(this.HISTORYFindPoll(this.GetActivePoll()) === false && this.poll.count < 1) {
            if(eVote) {
               eVote.innerHTML = `<button class='button is-white is-rounded is-primary is-large' style='width: 300px;'>RÖSTA</button>`;
            }

            let eButtonVote = <HTMLElement>eVote.querySelector("button");
            eButtonVote.setAttribute("disabled", "");
            eButtonVote.addEventListener("click", (e: Event) => {
               (<HTMLElement>e.srcElement).style.display = "none";
               this.SendVote();
            });
         }
         else {
            eVote.innerText = "Röst är registrerad för aktuell fråga.";
         }
      }


      let oTD = new CTableData({ id: oResult.id, name: oResult.name });
      CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
      oTD.ReadArray(oResult.table.body, { begin: 0 });

      let aBody = oTD.GetData()[ 0 ];
      let aCondition: details.condition[] = [];
      aBody.forEach((aRow, i) => {
         // For each question in poll we add one condition to page state to return answers for that question where user are able to vote for one or more.
         const iQuestion = <number>aRow[ 0 ];
         aCondition.push( { ready: false, table: "TPollQuestion1", id: "PollQuestionK", value: iQuestion} );
         let eSection = <HTMLElement>document.createElement("section");
         eSection.dataset.question = iQuestion.toString();
         const sName = aRow[ 1 ];
         eSection.className = "block";
         eSection.style.margin = "1em";
         const iPollIndex = i + 1; // Index for poll query
         eSection.innerHTML = `<header class="title is-3">${iPollIndex}: ${sName}</header><article style="display: block;"></article>`;
         eQuestion.appendChild(eSection);
      });

      this.m_oPageState.SetCondition( aCondition );
   }


   /**
    * Create markup showing vote count on each answer for poll question
    * @param {string|HTMLElement} eRoot
    * @param {any} oResult server results for each answer to questions in selected poll
    */
   RESULTCreateVoteCount(eRoot: string|HTMLElement, oResult: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);

      let oTD = new CTableData({ id: oResult.id, name: oResult.name });

      const aHeader = oResult.table.header;
      CPageSuper.ReadColumnInformationFromHeader(oTD, aHeader, (iIndex, oColumn, oTD) => {
         if(oColumn.key) {
            oTD.COLUMNSetPropertyValue(iIndex, "position.hide", true);
         }
      });

      oTD.ReadArray(oResult.table.body, { begin: 0 });
      oTD.COLUMNSetType( oTD.ROWGet(1) );
      oTD.COLUMNUpdatePositionIndex();

      oTD.COLUMNSetPropertyValue("ID_Answer", "position.hide", false);

      let iQuestion: number = <number>oTD.CELLGetValue(0,0);

      // ## Find container element to question
      let eSection = <HTMLElement>eRoot.querySelector(`section[data-question="${iQuestion}"]`);
      let eArticle = <HTMLElement>eSection.querySelector("article");

      let oStyle = {
         html_group: "table.table",                // "table" element and class table
         html_row: "tr",                           // "tr" element for each row
         html_cell_header: "th",                   // "th" for column headers
         html_cell: "td",                          // "td" for cells
         html_section_header: "thead",             // "thead" for header section
         html_section_body: "tbody",               // "tbody" for body section
         html_section_footer: "tfoot",             // "tfoot" for footer section
      }

      let oTrigger = new CTableDataTrigger({ table: oTD, trigger: CPageSuper.CallbackVote });

      let options = {
         parent: eArticle,                         // container
         section: [ "title", "table.header", "table.body", "footer" ],// sections to create
         table: oTD,                               // source data
         name: "vote",                             // name to access UI table in CTableData
         style: oStyle,                            // styling
         trigger: oTrigger,
      };

      let oTT = new CUITableText(options);
      oTD.UIAppend(oTT);

      oTT.COLUMNSetRenderer(0, (e, v, a) => {
         e.innerHTML = `<button class="button is-primary is-light" data-answer="${v}">Ta bort</button>`;
      });

      oTT.Render();
      eSection = oTT.GetSection("body");
      eSection.addEventListener("click", (e: Event) => {
         const eButton = <HTMLElement>e.srcElement;
         if( eButton.tagName === "BUTTON" ) {
            if( typeof eButton.dataset.uuid === "string" ) {
               this.QUERYGetPollFilterCount({ condition: eButton.dataset.uuid });
               eButton.className = "button is-primary is-light";
               eButton.innerText = "Ta bort";
               delete eButton.dataset.uuid;
            }
            else {
               const iAnswer = parseInt( eButton.dataset.answer, 10 );
               this.QUERYGetPollFilterCount({ answer: iAnswer });
            }
         }
      });
   }



   /**
    * Check if poll is found in history from local storage
    * @param {number} iPoll poll key
    */
   HISTORYFindPoll(iPoll: number): boolean {
      return this.m_aVoteHistory.findIndex( i => i === iPoll ) !== -1 ? true : false;
   }

   /**
    * Serialize polls that user has voted  for
    * @param bSave if true then save poll ids, if false load poll ids
    */
   HISTORYSerialize(bSave: boolean) {
      if(bSave === true) {
         localStorage.setItem( "poll_votes", JSON.stringify( this.m_aVoteHistory ) );
      }
      else {
         const s = localStorage.getItem("poll_votes");                         // read votes saved on computer
         if( s ) this.m_aVoteHistory = JSON.parse(s);
      }
   }

   /**
    * Return element for filter button
    * @param iAnswer key to active answer
    */
   ELEMENTGetFilterButton( iAnswer: number ): HTMLButtonElement {
      const eArticle = document.getElementById("idPollCount");
      const eButton = eArticle.querySelector(`button[data-answer="${iAnswer}"]`);
      return <HTMLButtonElement>eButton;
   }


}