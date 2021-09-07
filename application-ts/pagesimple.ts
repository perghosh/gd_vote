/*
# Navigate

|Name|Description
|:-|:-|
| SendVote | Send vote to server to register vote for user |

# queries

|Name|Fields|Alias|
|:-|:-|:-|
poll_question_list
| poll_question_list | PollQuestionK, FName, FLabel, Min, Max, Comment, FDescription | ID, Name, Label, Min, Max, Comment, Description |
| poll_answer_all | PollQuestionK, PollAnswerK, FName, FDescription| ID (Question), ID_Answer, Alternativ, Beskrivning |
 
 */


import { CTableData, CRowRows, enumMove, IUITableData, tabledata_column, tabledata_position, tabledata_format, enumReturn } from "./../library/TableData.js";
import { edit } from "./../library/TableDataEdit.js";
import { CTableDataTrigger, EventDataTable, enumTrigger } from "./../library/TableDataTrigger.js";
import { CUIPagerPreviousNext } from "./../library/UIPagerPreviousNext.js"
import { CDispatch } from "./../library/Dispatch.js"


import { CUITableText, enumState, uitabledata_construct } from "./../library/UITableText.js"
import { CQuery } from "./../server/Query.js"
import { CApplication } from "./application.js"
import { CPageSuper, CQuestion, CPageState } from "./pagesuper.js"
import { CD3Bar } from "./pageone_d3.js"

declare var marked: any;

namespace details {
   export const enum enumQueryState { send = 0, waiting = 1, delivered = 2, conditions = 10}

   export type condition = { ready?: boolean, table: string, id: string, value: string|number, simple?: string, operator?: number }

   export type page_construct = {
      callback_action?: ((sMessage: string, data?: any) => void);
      label?: { [key_name: string]: string },
      state?: { [key_name: string]: string|number|boolean }, // state items for page
      session?: string,
      set?: string,
   }
}

export class CPageSimple extends CPageSuper {
   m_sQueriesSet: string;           // active query set
   m_aPageState: CPageState[];
   m_oPageState: CPageState;        // current page state that is being processed
   /**
    * ## active poll information
    * The poll object is important as a state object for current selected poll. With this object you
    * can important poll data to know how the page works.
    * @type {number} m_oPoll.poll Key for selected poll
    * @type {number} m_oPoll.vote Key for vote that voter just has voted for (temporary storage when vote is sent to server)
    * @type {number} m_oPoll.count number of votes found for selected poll and voter
    * @type {number} m_oPoll.tie if poll answers for voter is glued together
    * @type {number} m_oPoll.ip_count count votes for active ip number
    * @type {boolean} m_oPoll.comment if poll may have comments attached to vote information
    */
   m_oPoll: { root_poll: number, poll: number, poll_group: number, vote: number, count: number, tie: boolean, ip_count: number, comment: boolean };
   m_aQuestion: CQuestion[];
   m_oState: { [ key_name: string ]: string | number | boolean }; // States for page, may be used for outside actions
   m_sSearchMode: string;           // Search mode (this is top section in page), valid types are "hash", "field", "area", "personal"
   m_sSession: string;              // save session to manage reload from user, try to get older version of session avoiding to many users
   m_oTDVoter: CTableData;          // User data for voter
   m_oUITableText: { [ key_name: string ]: CUITableText }; // cache ui table text items
   m_sViewMode: string;             // view mode page is in
   m_aVoter: [ number, string, string ];// key, alias and name for current voter
   m_aVoteHistory: number[];        // Local vote history on computer, this is to avoid abuse but is only for the current browser
   constructor(oApplication, oOptions?: details.page_construct) {
      super( oApplication, oOptions );
      const o: details.page_construct = oOptions || {};

      this.m_oPoll = { root_poll: -1, poll: -1, poll_group: -1, vote: -1, count: 0, tie: true, ip_count: 0, comment: false };
      this.m_sQueriesSet = o.set || "";
      this.m_sSession = o.session || null;
      this.m_oState = o.state || {};
      this.m_oUITableText = {};
      this.m_sViewMode = "vote";          // In what mode selected poll is. "vote" = enable voting for voter, "count" = view vote count for selected poll

      this.m_aPageState = [
         new CPageState({ section: "body", name: "vote", container: document.getElementById("idPollQuestion"), query: [ [ "poll_question_list", details.enumQueryState.send, [] ], [ "poll_answer_all", details.enumQueryState.send, [] ] ] }),
         new CPageState({ section: "body", name: "count", container: document.getElementById("idPollFilterCount"), query: [ [ "poll_question_list", details.enumQueryState.send, [] ], [ "poll_answer_count", details.enumQueryState.send, [] ] ] }),
         new CPageState({ section: "body", name: "search", container: document.getElementById("idPollSearch"), isolated: true, query: [ [ "poll_search", details.enumQueryState.send, false ] ] }),
         new CPageState({ section: "body", name: "select", container: null, query: [ [ "poll_question_list", details.enumQueryState.send, [] ], [ "poll_answer_all", details.enumQueryState.send, [] ] ] }),
      ];

      this.m_oElement = {
         "error": document.getElementById("idError"),
         "message": document.getElementById("idMessage"),
         "warning": document.getElementById("idWarning")
      };

      this.m_aVoter = [ -1, "", "" ];         // no voter (-1)
      this.m_aVoteHistory = [];
      this.HISTORYSerialize(false);


      this.m_oLabel = {
      };

      if( o.label ) {
         Object.assign(this.m_oLabel, o.label);
      }

      if( o.label ) { this.TRANSLATEPage() }
   }

   get poll() { return this.m_oPoll; }
   get queries_set() : string { return this.m_sQueriesSet; };
   get state() { return this.m_oState; }                                       // get state object

   get search_mode() { return this.m_sSearchMode; }
   set search_mode(sMode) {
      this.m_sSearchMode = sMode;
   }

   get view_mode() { return this.m_sViewMode; }
   set view_mode(sMode) {
      console.assert(sMode === "vote" || sMode === "count" || sMode === "search" || sMode === "select", "Invalid view mode: " + sMode);
      this.m_sViewMode = sMode;
   }

   set page_state(oPageState: CPageState) {
      this.m_oPageState = oPageState;
   }
   get page_state() { return this.m_oPageState; }

   /**
    * Get active poll key
    */
   GetActivePoll() { return this.poll.poll; }

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
    * Get Question object for question key, question object has rules/limits for what is possible to vote on for user
    * @param {number} iQuestion key to question
    * @returns {CQuestion}
    */
   GetQuestion( iQuestion: number ): CQuestion {
      for( let i = 0; i < this.m_aQuestion.length; i++ ) {
         const o = this.m_aQuestion[i];
         if( o.key === iQuestion ) return o;
      }                                                     console.assert(false, `No Question for ${iQuestion}`);
      return null;
   }

   /**
    * Return true if voter key is found
    */
   IsVoter(): boolean { return this.m_aVoter[0] !== -1; }



   /**
    * Activate poll with number
    * @param iActivePoll key to active poll  
    * @param {string} [sName] Name for active poll
    * @param {number} [iRootPoll] Root poll, if root poll is set then poll tree is not deleted. Activating polls from tree should keep the tree intact
    */
   SetActivePoll(iActivePoll?: number, sName?: string|number, iRootPoll?: number ) {
      if( typeof sName === "number" ) { iRootPoll = <number>sName; sName = undefined; }
      this.CloseQuestions();
      //if( this.m_oD3Bar ) this.m_oD3Bar.DeleteQuestion();

      if( iActivePoll !== this.GetActivePoll() ) {
         this.CallOwner("select-poll");
         //(<HTMLElement>document.getElementById( "idPollOverview" ).querySelector('[data-section="result_vote_count"]')).style.display = "none";
      }

      if( typeof iActivePoll === "number" ) {
         this.poll.poll = iActivePoll;
         if( iActivePoll <= 0 ) {
            this.RESULTCreatePollOverview("idPollOverview");// this clears poll overview
            return;
         }
         this.CallOwner("debug");                           // if debug then print debug information
      }

      if( typeof iRootPoll === "number" ) {
         if( iRootPoll !== -1 ) this.poll.root_poll = iRootPoll;
      }
      else this.poll.root_poll = -1;

      this.QUERYGetPollOverview(this.poll.poll, sName);

      const aCondition: [details.condition][] = [[ { ready: false, table: "TPollQuestion1", id: "PollK", value: this.poll.poll, simple: <string>sName } ]];
      if( !this.m_oPageState ) this.SetActiveState( "body." + this.view_mode, undefined, aCondition );
      else {
         this.m_oPageState.SetActive( aCondition );
      }

      this.WalkNextState();
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
         this.page_state = oPageState;
      }
   }


   /**
    * Walks queries used to collect information for active state
    */
   WalkNextState(): void {
      if( !this.m_oPageState ) return;

      let request = this.app.request;
      let aQuery = this.m_oPageState.GetOngoingQuery();     // returns first query where result hasn't been delivered
      if( aQuery === null ) {
         this.m_oPageState.Reset();                         // reset state (set queries to be sent and removes conditions)
         if( this.m_oPageState.IsIsolated() === false ) {
            //this.page_state = null;
         }
         else {
            this.page_state = null;
         }
         return;         
      }

      if(aQuery[ 1 ] === details.enumQueryState.delivered) {
         let aCondition = aQuery[2];
         if(typeof aCondition !== "boolean") {
            let i = 0;
            while(i < aCondition.length && aCondition[ i ].ready === true);
            if(i < aCondition.length) { aCondition[ i ].ready = true; i++; }

            // Check for more conditions?
            if(i < aCondition.length) { aQuery[ 1 ] = details.enumQueryState.send; }
            else {
               // get next non delivered query
               aQuery = this.m_oPageState.GetOngoingQuery();
            }
         }
         else {
            aQuery = this.m_oPageState.GetOngoingQuery();
         }
      }


      if(aQuery && aQuery[ 1 ] === details.enumQueryState.send) {              // if query is in send state then send it
         // Get first filter that isn't sent
         let aCondition = <details.condition[]>aQuery[ 2 ];
         let sXml;
         if( aCondition ) {
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
            sXml = <string>oQuery.CONDITIONGetXml();
         }
         const sQuery = aQuery[0];
         let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: sQuery, set: this.queries_set, count: 50, format: 1, start: 0 };
         
         if( sQuery === "poll_search" ) oCommand.count = 10;// max 10 rows for search

         if( !sXml ) delete oCommand.delete;               // No condition then keep active conditions for query
         request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
         aQuery[ 1 ] = details.enumQueryState.waiting;                        // change state to waiting
      }
      else {
         console.assert(false, "we should not go here");
         this.m_oPageState = null;
         //this.m_oD3Bar.Render( this.m_bFilterConditionCount );
      }
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
   SendVote():  boolean | void {                            console.assert( this.GetActivePoll() > 0, "Active poll isn't set." )
                                                            console.assert( this.IsReadyToVote(), "Trying to send vote to server but vote isn't ready to be sent." );
      let aValue = [];
      let aErrorText: string[] = [];

      // ## Extract key values from, values for poll is found i page state body.vote
      const aTD = this.GetPageState("body", "vote" ).GetTableData();
      aTD.forEach( oTD => {
         const aRow = <number[]>oTD.CountValue([ -1, "select-vote" ], 1, enumReturn.Array); // get values from "check" column with value 1
         aRow.forEach(iRowKey => {
            // IMPORTANT! Column 2 in query on server gets value from "PollAnswerK". This binds user vote to answer in poll
            const a = [
               { index: 2, value: oTD.CELLGetValue(iRowKey, "PollAnswerK") },   // answer key
               { name: "FComment", value: oTD.CELLGetValue(iRowKey, "FComment", undefined, "") }// vote key
            ];

            if( typeof a[1].value === "string" && (<string>a[1].value).length > 0 ) {
               const _result = CTableData.ValidateValue(a[1].value, oTD.COLUMNGet("FComment"));
               if( _result !== true ) {
                  aErrorText.push( <string>a[1].value );
               }
            }

            aValue.push(a); // column with index 2 gets key to answer
         });
      });

      if( aErrorText.length > 0 ) {
         const sError = "<b>" + this.GetLabel("vote_error") + "</b>\n<hr>" + aErrorText.join("<hr>\n");
         this.OpenMessage( sError, "warning", true );
         return false;
      }

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
      let oCommand = { command: "add_rows", query: "poll_vote", set: this.queries_set, table: "TPollVote1" };
      let request = this.app.request;
      request.Get("SCRIPT_Run", { file: "PAGE_result_edit.lua", json: request.GetJson(oCommand) }, sXml);
      this.poll.vote = this.poll.poll;                      // keep poll index for later when response from server is returned
   }
   



   /**
    * Close markup elements in page that is related to state and  selected poll questions
    */
   CloseQuestions(): void {

      let eVote = document.getElementById("idVote");
      eVote.querySelectorAll("article").forEach( e => { e.classList.remove("is-active");});
      this.m_aQuestion = [];
      //document.getElementById("idPollVote").innerHTML = "";
      //document.getElementById("idPollFilterCount").innerHTML = "";
      //e = document.getElementById("idPollImage");
      //e.innerHTML = "";
      //e.style.display = "none";
      this.OpenMessage();                                   // close any open message
   }


   /**
    * Process server response
    * @param {Element} eItem xml element
    * @param {string}  sName section name for response
    * @param {string}  sHint custom hint if found
    */
   ProcessResponse(eItem: Element, sName: string, sHint: string ): void {
      if( eItem === null ) {
         if( sName === "user" ) this.app.GetSession();
         return;
      }

      let oResult = JSON.parse(eItem.textContent);
      switch(sName) {
         case "result": {
            const sQueryName = oResult.name;                                  // get query name
            if(this.m_oPageState) {                                           // found active state ?
               if(this.m_oPageState.GetQueryName() === sQueryName) {          // compare name with current query in page state, if match then walk to next page state
                  let aQuery = this.m_oPageState.GetOngoingQuery();
                  aQuery[1] = details.enumQueryState.delivered;

                  switch(sQueryName) {
                     case "poll_question_list": this.RESULTCreateQuestionPanel( "idPollQuestion", oResult ); break;
                     case "poll_answer_all": this.RESULTCreateVote( this.m_oPageState.container, oResult ); break;
//                     case "poll_answer_count": this.RESULTCreateVoteCountAndFilter( this.m_oPageState.container, oResult ); break;
//                     case "poll_search": this.RESULTCreateSearch( this.m_oPageState.container, oResult ); break;
                     default: console.assert( false, `Result for ${sQueryName} has no stub` );
                  }

                  if(typeof aQuery[ 2 ] !== "boolean") {                      // if boolean that means that query for state do not need any conditions
                     let aCondition = <details.condition[]>aQuery[ 2 ];
                     let i = 0;
                     while(i < aCondition.length && aCondition[ i ].ready === true) i++;

                     // Check for more conditions?
                     if(i < aCondition.length) {
                        aQuery[ 1 ] = details.enumQueryState.send;
                     }
                  }

                  this.WalkNextState(); // Go to next step in active state
                  return;
               }
            }

            if(sQueryName === "poll_overview") {
               this.RESULTCreatePollOverview("idPollOverview", oResult);
            }
            else if(sQueryName === "poll_answer_all") {
               this.RESULTCreateVote("idPollOverview", oResult);
            }
/*
            else if(sQueryName === "poll_links") {
               this.RESULTCreatePollOverviewLinks("idPollOverview", oResult);
            }
            else if(sQueryName === "poll_vote_comment") {
               this.RESULTCreatePollOverviewVoteComments("idPollOverview", oResult);
            }
            else if(sQueryName === "poll_overview_related") {
               this.RESULTCreatePollOverviewRelated("idPollOverviewRelated", oResult);
            }
            else if(sQueryName === "poll_answer_filtercount") {
               this.RESULTCreatePollFilterCount("idPollOverview", oResult);
            }
            else if(sQueryName === "poll_search") {
               this.RESULTCreateSearch("idPollSearch", oResult);
            }
            else if(sQueryName === "poll_hashtags") {
               this.RESULTCreatePollHashtags(oResult);
            }
*/
         }  break;



         case "load_if_not_found":
            this.CallOwner("load");
            break;
         case "message":
            const sType = oResult.type;
            if(sType === "add_rows") {
               const sQueryName = oResult.name;
               if(sQueryName === "poll_vote") {
                  this.OpenMessage( this.GetLabel("vote_registered") );
                  if(this.poll.vote > 0) {
                     this.m_aVoteHistory.push(this.poll.vote);
                     this.HISTORYSerialize( true );
                     //this.QUERYGetPollFilterCount( this.GetActivePoll() );
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
   QUERYGetPollOverview(iPoll, sSimple): void {
      let request = this.app.request;
      let oQuery = new CQuery({
         conditions: [ { table: "TPoll1", id: "PollK", value: iPoll, simple: sSimple } ]
      });
      let sXml = <string>oQuery.CONDITIONGetXml();

      let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_overview", set: this.queries_set, count: 50, format: 1, start: 0 };
      request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
   }

   /**
    * Get links associated to poll
    * @param {number} iPoll   Index to selected poll
    */
   QUERYGetPollLinks(iPoll: number): void {
      let request = this.app.request;
      let oQuery = new CQuery({
         conditions: [ { table: "TPoll1", id: "PollK", value: iPoll } ]
      });
      let sXml = <string>oQuery.CONDITIONGetXml();

      let oCommand = { command: "add_condition_to_query get_result", delete: 1, query: "poll_links", set: this.queries_set, count: 50, format: 1, start: 0 };
      request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
   }


   /**
    * Set pollgroup condition to poll search query. This is a sticky condition so it will not be possible to 
    * find polls from other groups with this set
    * @param {number} iGroup [description]
    */
   QUERYSetPollGroupCondition( iGroup: number ) {
      let request = this.app.request;
      let sXml;

      let oQuery = new CQuery({
         conditions: [{ table: "TPoll1", id: "PollGroupK-Id", value: iGroup, flags: "locked" }]
      });
      sXml = <string>oQuery.CONDITIONGetXml();

      let oCommand = { command: "delete_condition_from_query add_condition_to_query", query: "poll_search", set: this.queries_set, post: 1 };
      request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) }, sXml);
   }

   /**
    * result for selected poll
    * If data is found then get questions for poll
    * @param {string|HTMLElement} eRoot
    * @param oResult
    */
   RESULTCreatePollOverview(ePollOverview: string|HTMLElement, oResult?: any) {
      if(typeof ePollOverview === "string") ePollOverview = document.getElementById(ePollOverview);
      if( oResult === undefined ) {
         // ## No vote data, clear vote section and remove is-active class that will hide elements
         let eVote = document.getElementById("idVote");
         eVote.querySelectorAll("article").forEach( e => { 
            e.classList.remove("is-active");
            //e.innerHTML = "";
         });

         return;
      }
      else if( oResult.count === 0 ) {
         this.OpenMessage( this.GetLabel("poll_not_found"), "warning" );
         return;
      }
      else {
         document.getElementById("idContent").style.display = "block";
      }

      ePollOverview.classList.add("is-active");                               // Turn on poll overview section


      let oTD = new CTableData({ id: oResult.id, name: oResult.name });
      CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);

      oTD.ReadArray(oResult.table.body, { begin: 0 });

      const sName = <string>oTD.CELLGetValue(0, 1);         // Poll name
      const sDescription = <string>oTD.CELLGetValue(0, "Description");  // Poll description
      const sArticle = <string>oTD.CELLGetValue(0, "Article");  // Poll article
      const iQuestionCount = <number>oTD.CELLGetValue(0, "CountQuestion");// Number of questions in poll
      const iLinkCount = <number>oTD.CELLGetValue(0, "CountLink");// Links associated with poll
      const iVoteCount = <number>oTD.CELLGetValue(0, "MyCount");// if registered voter has voted in this poll
      const iIpCount = <number>oTD.CELLGetValue(0, "IpCount");// if count number of votes for ip number
      const iCountPoll = <number>oTD.CELLGetValue(0, "CountPoll");// Count related polls
      const iTie = <number>oTD.CELLGetValue(0, "Tie");// if vote answers are tied, when tied votes can be filtered
      const iGroup = <number>oTD.CELLGetValue(0, "GroupId");// group poll is connected to
      const iComment = <number>oTD.CELLGetValue(0, "CommentEnabled");// number of questions that can be commented

      if( typeof iVoteCount === "number" ) this.poll.count = iVoteCount;
      else this.poll.count = 0;

      if(this.IsVoter() === false && iIpCount > 0) {
         this.poll.count = iIpCount;
         this.poll.ip_count = iIpCount;
      }

      this.poll.tie = false;
      if(iTie === 1) {                                                         // are votes tied (tied with guid for selected answers)
         this.poll.tie = true;
      }

      this.poll.comment = false;
      if(iComment !== 0) {                                                     // do we have comments for this poll
         this.poll.comment = true;
      }

      if(iQuestionCount > 0) {
         // ## Generate title for poll
         (<HTMLElement>ePollOverview.querySelector(`[data-type="name"]`)).textContent = sName || "";
         (<HTMLElement>ePollOverview.querySelector(`[data-type="description"]`)).textContent = sDescription || "";
         (<HTMLElement>ePollOverview.querySelector(`[data-type="article"]`)).textContent = sArticle || "";
      }

      // show or hide links
      let eLink = <HTMLElement>document.getElementById("idPollLink");
      eLink.innerHTML = "";
      if( iLinkCount > 0 ) {
         eLink.classList.add("is-active");
         this.QUERYGetPollLinks( this.GetActivePoll() );
      }
      else {
         eLink.classList.remove("is-active");
      }

      if( typeof iGroup === "number" && this.state.set_poll_group === true ) {  // set poll group
         this.QUERYSetPollGroupCondition( iGroup );
         this.state.set_poll_group = false;
      }

      this.CallOwner("select-poll-data", this.poll);
   }


   /**
    * Create panels for each question that belongs to current selected poll
    * @param {string|HTMLElement} eRoot, id for html section containing questions are "idPollQuestion"
    * @param {any} oResult server result with questions for selected poll
    */
   RESULTCreateQuestionPanel(ePollQuestion: string|HTMLElement, oResult: any): void {
      if(typeof ePollQuestion === "string") ePollQuestion = document.getElementById(ePollQuestion);
      ePollQuestion.classList.add("is-active");

      let oTD = new CTableData({ id: oResult.id, name: oResult.name });
      CPageSuper.ReadColumnInformationFromHeader(oTD, oResult.table.header);
      oTD.ReadArray(oResult.table.body, { begin: 0 });

      //let eD3Bars = <HTMLElement>document.getElementById("idPollOverview").querySelector('[data-section="d3bars"]');
      //eD3Bars.innerHTML = "";

      // ## Create section where questions are placed. Questions are added to vote section on top
      // <div data-section="vote">
      //    <header class="title is-3">${iPollIndex}: ${sName}</header><article class="block"></article>
      //    .. more questions ..
      // </div>
      // <div>
      //    <button>Vote</button>
      // </div>
      if( ePollQuestion ) {
         let eQuestion = <HTMLElement>ePollQuestion.querySelector('[data-section="question"]'); // section where vote questions are placed
         if(!eQuestion) {
            eQuestion = <HTMLElement>document.createElement("div");
            eQuestion.dataset.section = "question";
            ePollQuestion.appendChild( eQuestion );
         }

         /*
         if(this.view_mode === "vote") {                                      // in vote mode?
            // ## Create section for vote button
            let eVote = <HTMLElement>ePollQuestion.querySelector('[data-section="vote"]');
            eVote = document.createElement("div");
            eVote.dataset.section = "vote";
            eVote.className = "has-text-info is-size-4";
            ePollQuestion.appendChild(eVote);

            if(this.HISTORYFindPoll(this.GetActivePoll()) === false && this.poll.count < 1) {
               if(eVote) {
                  eVote.innerHTML = "<button class='button is-white is-rounded is-primary is-large' style='width: 300px;'>" + this.GetLabel("vote") + "</button>";
               }

               let eButtonVote = <HTMLElement>eVote.querySelector("button");
               eButtonVote.setAttribute("disabled", "");
               eButtonVote.addEventListener("click", (e: Event) => {
                  (<HTMLElement>e.srcElement).style.display = "none";
                  if( this.SendVote() === false ) (<HTMLElement>e.srcElement).style.display = "block";
               });
            }
            else {
               let e = document.getElementById("idPollVoteMessage");
               e.innerText = this.GetLabel("vote_exist");
               e.classList.add("is-active");
               document.getElementById("idPollVote").classList.remove("is-active");
            }
         }
         */
      }


      let eTemplate = <HTMLTemplateElement>document.querySelector('#template_question');
      let aBody = oTD.GetData()[ 0 ];
      // let aCondition: details.condition[] = [];
      aBody.forEach((aRow, i) => {
         // For each question in poll we add one condition to page state to return answers for that question where user are able to vote for one or more.
         const iQuestion = <number>aRow[ 0 ];                                  // Question key "PollQuestionK"
         const sName = <string>aRow[ 1 ];
         const sDescription = aRow[ 6 ] || "";                                 // "FDescription"
         const iPollIndex = i + 1; // Index for poll query
         // aCondition.push( { ready: false, table: "TPollQuestion1", id: "PollQuestionK", value: iQuestion} ); // TODO
         if( ePollQuestion ) {
            let eMarkup = <HTMLElement>eTemplate.content.cloneNode(true);
            (<HTMLElement>ePollQuestion).appendChild( eMarkup );
            let e = <HTMLElement>(<HTMLElement>ePollQuestion).lastElementChild;
            e.dataset.question = iQuestion.toString();
            e.querySelector("header").innerText = sName;
            
            /*
            let eQuestion = (<HTMLElement>ePollQuestion).querySelector('[data-section="question"]'); // section where vote questions are placed
            let eSection = <HTMLElement>document.createElement("section");
            eSection.dataset.question = iQuestion.toString();
            eSection.className = "block";
            eSection.style.margin = "0em 1em";
            if( this.view_mode === "vote" ) {
               eSection.innerHTML = `<header class="title is-3" style="margin-bottom: 0.5em;"><div>${iPollIndex}: ${sName}</div><div class="has-text-weight-normal is-italic is-size-5 pl-6">${sDescription}</div></header><article style="display: block;"></article>`;
            }
            else {
               eSection.innerHTML = `<header class="title is-5 pointer" style="margin-bottom: 0.5em;" data-open="1">${iPollIndex}: ${sName}</header><article style="display: block;"></article>`;
               eSection.firstElementChild.addEventListener("click", e => {
                  let eHeader = <HTMLElement>e.srcElement;
                  if( eHeader.tagName !== "HEADER" ) eHeader = eHeader.closest("header");
                  let bOpen = eHeader.dataset.open === "1" ? true : false;
                  let eArticle = <HTMLElement>eHeader.nextElementSibling;

                  if( bOpen === true ) {
                     eArticle.style.display = "none";
                     eHeader.dataset.open = "0";
                     eHeader.classList.add( "has-text-grey-light" );
                  }
                  else {
                     eArticle.style.display = "block";
                     eHeader.dataset.open = "1";
                     eHeader.classList.remove( "has-text-grey-light" );
                  }
               });
            }
            eQuestion.appendChild(eSection);
            */
         }

         /*
         let eSection = <HTMLElement>document.createElement("section");
         eSection.className = "block box";
         eSection.style.padding = "0.5em";
         eSection.innerHTML = `<div class="is-size-6 has-text-weight-semibold pointer" data-type="title" data-open="1"></div><div data-type="chart" style="top: -1000px;"></div>`;
         let eTitle = <HTMLElement>eSection.querySelector('[data-type="title"]');
         eTitle.innerText = <string>sName;
         eTitle.addEventListener("click", e => {
            let eTitle = <HTMLElement>e.srcElement;
            let bOpen = eTitle.dataset.open === "1" ? true : false;
            let eChart = <HTMLElement>eTitle.nextElementSibling;

            if( bOpen === true ) {
               eChart.style.width = "" + eChart.offsetWidth + "px";
               eChart.style.position = "absolute";
               eTitle.dataset.open = "0";
               eTitle.classList.add( "has-text-grey-light" );
            }
            else {
               eChart.style.width = "unset";
               eChart.style.position = "unset";
               eTitle.dataset.open = "1";
               eTitle.classList.remove( "has-text-grey-light" );
            }
         });
         */

         let oQuestion = new CQuestion({
            key: iQuestion,
            min: <number>oTD.CELLGetValue(i,"Min"),
            max: <number>oTD.CELLGetValue(i,"Max"),
            comment: <number>oTD.CELLGetValue(i,"Comment"),
            label: <string>oTD.CELLGetValue(i,"Label")
         });
         this.m_aQuestion.push( oQuestion );
         
      });

      let aCondition: details.condition[] = [];
      aCondition.push( { ready: false, table: "TPoll1", id: "PollK", value: this.GetActivePoll()} );
      this.m_oPageState.SetCondition( aCondition );
   }

   /**
    * Create vote for poll question. Creates markup for possible answers to poll question
    * @param {string|HTMLElement} eRoot
    * @param {any} oResult server result with answers for questions in selected poll
    */
   _RESULTCreateVote(eRoot: string|HTMLElement, oResult: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);

      // ## Find key for first waiting question
      let TDVote = new CTableData({ id: oResult.id, name: oResult.name, external: { max: 1, min: 1, comment: false } });
      const aHeader = oResult.table.header;
      CPageSuper.ReadColumnInformationFromHeader(TDVote, aHeader, (iIndex, oColumn, oTD) => {
      });
      TDVote.ReadArray(oResult.table.body, { begin: 0 });
      TDVote.COLUMNUpdatePositionIndex();
      // ## get question object for question key, key is found in first column
      const iQuestion: number = <number>TDVote.CELLGetValue(0,0); // key to question
      const oQuestion = this.GetQuestion( iQuestion ); // question object for key

      // Get rules for question
      Object.assign(TDVote.external, { min: oQuestion.min, max: oQuestion.max, comment: oQuestion.comment, ready: oQuestion.min === 0 });

      this.m_oPageState.AddTableData( iQuestion, TDVote );  // cache table data

      let eTemplate = <HTMLTemplateElement>document.querySelector('#template_vote');

      // ## Find container element to question
      let eSection = <HTMLElement>eRoot.querySelector(`div[data-question="${iQuestion}"]`);
      let eArticle = <HTMLElement>eSection.querySelector("article");

      eSection.addEventListener("click", oEvent => { 
         let e: HTMLElement = <HTMLElement>oEvent.srcElement;
         if( e.tagName !== "A" ) e = e.parentElement;
         e.classList.add("selected");

         let eQuestion = <HTMLElement>e.closest("[data-question]");
         const iQuestion = parseInt( eQuestion.dataset.question, 10 );         // key to question
         let eAnswer = <HTMLElement>e.closest("[data-answer]");
         const iAnswer = parseInt( eAnswer.dataset.answer, 10 );               // key to answer
         let eRow = <HTMLElement>e.closest("[data-row]");
         const iRow = parseInt( eRow.dataset.row, 10 );                        // index to row to set value

         let aTD = this.m_oPageState.GetTableData( iQuestion );               console.assert( aTD.length > 0, "No table data for question" );
         let oTD = aTD[0];


         (<CUITableText>oTD.UIGet(0)).SetCellValue([iRow, 0], 1, { iReason: 1, eElement: e, browser_event: "click"} ); // update value in tabledata
      });

      let oStyle = {
         html_row_complete: eTemplate
      }

      let oTrigger = new CTableDataTrigger({ table: TDVote, trigger: CPageSuper.CallbackVote });

      let options = {
         parent: eArticle,                         // container
         section: [ "body" ],
         table: TDVote,                            // source data
         name: "vote",                             // name to access UI table in CTableData
         style: oStyle,                            // styling
         state: enumState.CancelRowRender,         // cancel
         trigger: oTrigger,                        // set trigger object, this will enable triggers for the search table
         callback_render: function (sType: string, e: EventDataTable, sSection: string, oColumn: tabledata_column): boolean {
            if(sType === "askCellValue") {
               return true;
            }
            else if(sType === "beforeCellValue") {
               const sValue = e.information;
               let eContainer = e.eElement;
               let sType;

               if(oColumn.name === "PollAnswerK") {
                  let eAnswer = <HTMLElement>eContainer.closest(`[data-answer]`);
                  eAnswer.dataset.answer = <string>sValue;
               }
               else if(oColumn.name === "FName") { sType = "name"; }
               else if(oColumn.name === "FDescription") { sType = "description"; }
               if(sType && sValue) {
                  (<HTMLElement>eContainer.querySelector(`[data-type="${sType}"]`)).innerText = <string>sValue;
               }
            }
            return false;
         }
      };


      TDVote.COLUMNUpdatePositionIndex();
      let TTVote = new CUITableText(<uitabledata_construct><unknown>options);
      TDVote.UIAppend(TTVote);
      TTVote.Render();




      if( !eRoot ) return;                                 // no root item then skip

      /*
      
      const iCount = TDVote.ROWGetCount();
      for(let iRow = 0; iRow < iCount; iRow++) {
         const iAnswer = <number>oTD.CELLGetValue(iRow, "AnswerK");
         const sLink = <string>oTD.CELLGetValue(iRow, "Link");
         const sName = <string>oTD.CELLGetValue(iRow, "Name");
      }

      const aHeaderText = this.GetLabel("vote_headers").split("|");
      let aColumn = TDVote.InsertColumn(2, 0, 1);           // insert column at position 2, default value is 0, and only one field
      CTableData.SetPropertyValue(aColumn, true, "id", "select-vote");
      CTableData.SetPropertyValue(aColumn, true, "alias", aHeaderText[0]);
      CTableData.SetPropertyValue(aColumn, true, "edit.name", "checkbox");
      CTableData.SetPropertyValue(aColumn, true, "edit.edit", true);
      CTableData.SetPropertyValue(aColumn, true, "edit.element", 1);
      TDVote.COLUMNSetPropertyValue("FName", "alias", aHeaderText[1]);
      TDVote.COLUMNSetPropertyValue("FDescription", "alias", aHeaderText[2]);


      if( oQuestion.comment === true ) {
         aColumn = TDVote.InsertColumn(5, "", 1);           // insert column at position 2, default value is 0, and only one field
         CTableData.SetPropertyValue(aColumn, true, "id", "FComment");
         CTableData.SetPropertyValue(aColumn, true, "alias", this.GetLabel("comment") );
         CTableData.SetPropertyValue(aColumn, true, "edit.name", "text");
         CTableData.SetPropertyValue(aColumn, true, "edit.edit", true);
         CTableData.SetPropertyValue(aColumn, true, "edit.element", 1);
         CTableData.SetPropertyValue(aColumn, true, "position.header", 0);
         CTableData.SetPropertyValue(aColumn, true, "style", { minHeight: "3em", overflowX: "auto" });
         CTableData.SetPropertyValue(aColumn, true, "format", { max: 500, min: 10 });
      }



      TDVote.COLUMNUpdatePositionIndex();

      TTVote.Render();

      let eFooter = TTVote.GetSection("footer");
      eFooter.innerHTML = `<div>
<span data-info="data" style='display: inline-block; margin-left: 3em;'></span>
<span data-info="xml" style='display: inline-block; margin-left: 3em;'></span>
</div>`;
*/
   }


   RESULTCreateVote(eRoot: string | HTMLElement, oResult: any) {
      if(typeof eRoot === "string") eRoot = document.getElementById(eRoot);

      let oResultAnswer = JSON.parse( JSON.stringify( oResult ) );            // clone result


      this.m_aQuestion.forEach(oQuestion => {
         let aTable = oResult.table.body.filter(a => { 
            return a[0] === oQuestion.key; 
         });

         oResultAnswer.table.body = aTable;
         this._RESULTCreateVote(eRoot, oResultAnswer);
      });
   }




   /**
    * Translate pager text
    * @param {object} oLanguage object that has strings to replace page elements with
    */
   TRANSLATEPage( oLanguage?: { [key_name: string]: string } ) {
      oLanguage = oLanguage || this.m_oLabel;
      if( oLanguage.page ) {                               // static page text that need translation
         const ePage = document.getElementById("idPage");
         for (const [sKey, sText] of Object.entries(oLanguage.page)) {
            const e = ePage.querySelector('[data-translate="page.' + sKey + '"]');
            if(e) {
               if( e.hasChildNodes() ) e.childNodes[ 0 ].textContent = sText;
               else e.textContent = sText;
            }
         }
      }

      // translate labels in page
      for (const [sKey, sText] of Object.entries(oLanguage)) {
         if( typeof sText === "string" ) this.m_oLabel[sKey] = sText;
      }
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

   static HISTORYSerializeSession( bSave: boolean, sSession: string, sAlias?: string ): [string,string] |null {
      return CPageSuper.SerializeSession( bSave, sSession, sAlias );
   }


}
