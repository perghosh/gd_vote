import { CTableData, CRowRows, enumMove, IUITableData, tabledata_column, tabledata_position, tabledata_format, enumReturn } from "./../library/TableData.js";
import { CTableDataTrigger, EventDataTable } from "./../library/TableDataTrigger.js";
import { CUITableText, enumState, uitabledata_construct } from "./../library/UITableText.js"
import { CQuery } from "./../server/Query.js"
import { CApplication } from "application.js"


export namespace details {
   export const enum enumQueryState { send = 0, waiting = 1, delivered = 2, conditions = 10}

   export type condition = { ready?: boolean, table: string, id: string, value: string|number, simple?: string, operator?: number }

   export type page_construct = {
      callback_action?: ((sMessage: string, data?: any) => void);
      state?: { [key_name: string]: string|number|boolean } // state items for page
   }

   /**
    * options for CQuestion
    * @type {Object}
    */
   export type question_construct = {
      key: number,    // key for question
      min?: number,   // min vote count for question
      max?: number,   // max vote count for question
      comment?: number|boolean,// allow or not allow comment for vote
      label?: string, // label may be used as place holder in comment
   }

   /**
    * options for CQuestion
    * @type {Object}
    */
   export type state_construct = {
      container: HTMLElement,// container element for result markup
      isolated?: boolean;  // if state is runned alone, do not update page when state is ready
      name: string,        // name in page section
      query: [string,number,(condition[] | boolean)][],// query for state, second item is condition or if false no condition is added to query
      section: string,     // page section
   }

   export type query_result = {
      aggregates?: number,
      cell_command?: boolean, // if cells has commands
      cell_style?: string,
      count?: number,
      id?: string,         // query id key
      name?: string,       // query name
      page?: number,
      row_command?: boolean, // if row has commands (lua operations)
      table: {
         body: unknown[][],
         count?: number,    // number of rows in result
         header: { [key_name: string]: string | number }[]
      }
      style?: string
   }
}

//export type query_result = details.query_result;


export class CPageSuper {
   m_callAction: ((sMessage: string, data?: any) => void);// callback array for action hooks
   m_oLabel: { [ label_id: string ]: string }; // labels in page
   m_oApplication: CApplication;
   m_oElement: { [key_name: string]: HTMLElement };

   constructor(oApplication, oOptions?: details.page_construct) {
      const o = oOptions || {};

      this.m_oApplication = oApplication; // application object
      oApplication.page = this;

      this.m_callAction = o.callback_action || null;

      this.m_oLabel = {};

   }

   get app() { return this.m_oApplication; }                                   // get application object
   get session(): string { return this.m_oApplication.request.session; }       // get session value for user

   // Get labels (text) in page
   GetLabel( sId: string ) { return this.m_oLabel[sId]; }

   /**
    * Call owner to page, owner is probably a callback in the html page this page object is used for
    * @param sMessage
    */
   CallOwner( sMessage: string, data?: any ) {
      if( this.m_callAction ) this.m_callAction.call( this, sMessage, data );
   }


   /**
    * Open message in message section. if no parameters then message is removed
    * @param {string} [sMessage] message to user
    * @param {string} [sType] type of message `message` | `error` | `warning`
    * @param {boolean} [bHtml] if text is html formated
    */
   OpenMessage(sMessage?: string, sType?: string, bHtml?: boolean) {
      Object.values( this.m_oElement ).forEach(e => { if( typeof e.dataset.message === "string" ) e.style.display = "none"; });
      if( sMessage === undefined ) return;
      sType = sType || "message";
      let e = this.m_oElement[sType];
      e = e.querySelector("p, pre");
      if( bHtml === true ) {
         sMessage = sMessage.replaceAll("\n", "<br>");
         e.innerHTML = sMessage;
      }
      else e.textContent = sMessage;
      (<HTMLElement>e.closest("[data-message]")).style.display = "block";
      window.scrollTo(0,0);
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
   static ReadColumnInformationFromHeader(oTD, aHeader, callback?: (iIndex: number, oColumn: any, oTD:  CTableData ) => void) {
      const iColumnCount = aHeader.length;
      oTD.COLUMNAppend(iColumnCount);
      for(let i = 0; i < iColumnCount; i++) {
         const o = aHeader[ i ];
         oTD.COLUMNSetPropertyValue(i, "id", o.id);
         oTD.COLUMNSetPropertyValue(i, "name", o.name);
         oTD.COLUMNSetPropertyValue(i, "alias", o.simple || o.alias);
         oTD.COLUMNSetType(i, o.select_type_name);
         if( typeof o.order === "number" && o.order !== 0 ) {
            oTD.COLUMNSetPropertyValue(i, "state.sorted", o.order);   
         }
         if(callback) callback(i, o, oTD);
      }
   }

   /**
    * Save or load session from local storage
    * @param bSave {boolean} if true then session are saved, if false session are loaded
    * @param sSession {string} session value
    * @param sAlias {string} user alias to know if session match user
    */
   static SerializeSession( bSave: boolean, sSession: string, sAlias?: string ): [string,string] |null {
      if( bSave === true ) {
         const oSession = { time: (new Date()).toISOString(), session: sSession, alias: sAlias };
         localStorage.setItem( "session", JSON.stringify( oSession ) );
      }
      else {
         const sSession = localStorage.getItem("session");
         if( sSession ) {
            const oSession: { time: string, session: string, alias: string } = JSON.parse( sSession );
            // Compare date, if older than one hour then skip
            const iDifference: any = <any>(new Date()) - Date.parse(oSession.time);
            if( iDifference <  10000000 ) {
               return [oSession.session,oSession.alias];
            }
         }
      }
      return [null,null];
   }


   /**
    * Callback for action events from ui table
    * @param oEventData
    * @param {any} v value differs based on event sent
    */
   static CallbackVote(oEventData: EventDataTable, v: any): void {

      let sName = CTableDataTrigger.GetTriggerName(oEventData.iEvent); console.log(sName);
      switch(sName) {
         case "AfterSetValue":  {
            if( oEventData.column.id === "select-vote" ) {
               const iSetVote = <number>v[2]; // 0 or 1 if vote is selected or not
               let bError = false;
               let oTD = oEventData.data;
               let oTT = <CUITableText>oEventData.dataUI;
               let eFooter = oTT.GetSection("footer");
               let eError = <HTMLElement>eFooter.querySelector("[data-error]");


               let iCount = oTD.CountValue([ -1, "select-vote" ], 1); // Count values in "check" column, check column is inserted after result is read in page.
               const iMax = oTD.external.max;
               if(typeof iMax === "number") {                        // found max property ? Then this is 
                  if(iMax < iCount) {
                     bError = true;
                     oTD.external.error = true;
                     if(!eError) {
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
                     if(eError) eError.innerText = "";
                  }

                  if(iCount >= oTD.external.min && iCount <= oTD.external.max) oTD.external.ready = true;
                  else oTD.external.ready = false;
                  (<any>window).app.page.IsReadyToVote( true ); // Update vote button

                  if( bError === false && oTD.external.comment === true ) { // if comment is allowed then display comment element for vote
                     const iRow = <number>v[1][0];
                     const eTR = <HTMLElement>oTT.ELEMENTGetRow( iRow );
                     let eComment = <HTMLElement>eTR.querySelector(".answer-comment");
                     if( iSetVote === 1 ) eComment.style.display = "block";
                     else eComment.style.display = "none";
                  }
               }
            }
         }
         break;
      }
   }
}

/**
 * 
 */
export class CQuestion {
   m_iKey: number;       // Question key
   m_iCountMin: number;  // Min number of votes for question
   m_iCountMax: number;  // Max number of votes for question
   m_bComment: boolean;  // Allow to comment vote on question
   m_sLabel: string;     // If question has some specific label to hint what to write in comment

   constructor( options: details.question_construct ) {
      const o = options;
      this.m_iKey = o.key;
      this.m_iCountMin = typeof o.min === "number" ? o.min : 1;
      this.m_iCountMax = typeof o.max === "number" ? o.max : 1;
      this.m_bComment = ( o.comment === 1 || o.comment === true ) ? true : false;
      this.m_sLabel = o.label || null;
   }

   get key() { return this.m_iKey; }
   get min() { return this.m_iCountMin; }
   get max() { return this.m_iCountMax; }
   get comment() { return this.m_bComment; }
   get label() { return this.m_sLabel; }
}


/**
 * Internal state for sections in page
 * This class is mainly used to handle asynchronous calls to get information from a series of queries related to state.
 * When only one query is needed to get information for command it is  easier, but here there are multiple queries so
 * we need some sort of logic to know when all queries has been executed and in what order.
 */
export class CPageState {
   m_bActive: boolean;  // If state is active
   m_bIsolated: boolean; // If state is self contained, should not update rest of page when ready
   m_eContainer: HTMLElement;// container element
   m_sName: string;     // state name
   m_iQuery: number;    // Index to current query that is beeing processed
   m_aQuery: [string,number,details.condition[] | boolean][];  // List of queries needed, what state they are in and how many times query is executed
   m_aTableData: [number, CTableData][];
   m_sSection: string;  // what section in page
   constructor( options: details.state_construct ) {
      const o = options;
      this.m_bActive = false;
      this.m_bIsolated = o.isolated || false;
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

   IsActive(): boolean { return this.m_bActive; }                              // Is state active ? Only one active state for each page section
   IsIsolated(): boolean { return this.m_bIsolated; }                          // Is page state self contained, do not update other page items when this state is active

   GetQueryName(): string {                                                    // Return name for active query
      const aQuery = this.GetOngoingQuery();
      if( aQuery ) return aQuery[0];
      return null;
   }

   /**
    * Get first query that doesn't have the state delivered. If all queries has del
    */
   GetOngoingQuery(): [ string, number, details.condition[] | boolean] {
      for(let i = 0; i < this.m_aQuery.length; i++) {
         const aQuery = this.m_aQuery[i];
         if( aQuery[1] !== details.enumQueryState.delivered ) return aQuery;
      }
      return null;
   }

   /**
    * Set condition/s to current active query.
    * Used when one result is dependent of previous results in chain of queries
    * @param {details.condition[]} aCondition
    */
   SetCondition( aCondition: details.condition[] ) {
      let a = this.GetOngoingQuery();
      a[2] = aCondition;
   }


   AddTableData( iKey: number, oTD: CTableData ) { this.m_aTableData.push( [ iKey, oTD ] ); }
   GetTableData( iKey?: number ): CTableData[]  { 
      let a: CTableData[] = [];      
      let i = this.m_aTableData.length;
      while( --i >= 0 ) {
         if( typeof iKey === "number" ) {
            if( this.m_aTableData[i][0] === iKey ) { a.push( this.m_aTableData[i][1] ); break; }
         }
         else a.push( this.m_aTableData[i][1] );
      }
      return a;
   }

   /**
    * Set if active or not active
    * When set to active add condition or conditions to query/queries. Conditions may be filled later from returned results
    * @param {[details.condition][]} [aCondition] condition set to queries that is executed. index will be matched for query index in query array for page state.
    */
   SetActive(aCondition?: [details.condition][]): [string,number,details.condition[] | boolean][] {
      this.m_aQuery.forEach((aQuery, i) => {
         if(aCondition && i < aCondition.length && aQuery[2] !== false ) {
            (<[string,number,details.condition[]]>aQuery)[2] = aCondition[i];
         }
         else if( aQuery[2] !== false ) (<[string,number,details.condition[]]>aQuery)[2] = null;
      });

      this.m_bActive = aCondition ? true : false;
      this.m_aTableData = [];                              // Delete old table data when activated, prepare for new results

      return this.m_aQuery;
   }

   Reset(): void {
      this.m_iQuery = 0; // set to first query
      this.m_aQuery.forEach(a => { 
         a[1] = details.enumQueryState.send; 
         if( typeof a[2] !== "boolean" ) a[2] = null; 
      });
   }
}
