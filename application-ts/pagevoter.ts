                                                import { CTableData, CRowRows, enumMove, IUITableData, tabledata_column, tabledata_position, tabledata_format, enumReturn } from "./../library/TableData.js";
import { edit } from "./../library/TableDataEdit.js";
import { CTableDataTrigger, EventDataTable, enumTrigger } from "./../library/TableDataTrigger.js";
// import { CUIPagerPreviousNext } from "./../library/UIPagerPreviousNext.js"
import { CDispatch } from "./../library/Dispatch.js"


import { CUITableText, enumState, uitabledata_construct } from "./../library/UITableText.js"
import { CQuery } from "./../server/Query.js"
import { CApplication } from "./application.js"
import { CPageSuper, CQuestion, CPageState } from "./pagesuper.js"


namespace details {

   export type condition = { ready?: boolean, table: string, id: string, value: string|number, simple?: string, operator?: number }

   export type page_construct = {
      callback_action?: ((sMessage: string, data?: any) => void);
      label?: { [key_name: string]: string },
      session?: string,
      set?: string,
   }
}



export class CPageVoter extends CPageSuper {
   m_sQueriesSet: string;            // active query set

   constructor(oApplication, oOptions?: details.page_construct) {
      super( oApplication, oOptions );
      const o: details.page_construct = oOptions || {};

      this.m_sQueriesSet = o.set || "";

   }

   get queries_set() : string { return this.m_sQueriesSet; };



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
         case "delete_condition":
            //if( sHint === "poll_answer_filtercount")
            break;
         case "result": {
            const sQueryName = oResult.name;                                  // get query name

            if(sQueryName === "login") {
               //this.RESULTCreateUserRegister("idUserRegister", oResult);
            }
         }  break;
         //case "load":
         case "load_if_not_found":
            this.CallOwner("load");
            break;
         case "message":
            const sType = oResult.type;
            if(sType === "add_rows") {
            }
            break;
         default: {
            let iPosition = sName.indexOf("get_column_information-");
            if( iPosition === 0 ) {
               sName = sName.substr( 23 );
               if( sName === "login" ) {
                  this.PAGECreateRegisterVoter( oResult );
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
   QUERYGetVoterRegister(): void {
      let request = this.app.request;

      let oCommand = { command: "get_result",  query: "login", set: this.queries_set, count: 0, format: 1 };
      request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) });
   }

   QUERYGetVoterRegisterInformation(): void {
      let request = this.app.request;
      let oCommand: {[key:string]: string|number} = { command: "get_column_information", query: "login", set: this.queries_set };
      request.Get("SCRIPT_Run", { file: "/PAGE_result.lua", json: request.GetJson(oCommand) });
   }

   PAGECreateRegisterVoter( oResult: any ): void {
      console.log( oResult );
      // https://www.databasejournal.com/features/mssql/article.php/3714031/SQL-Server-2005-Encryption-types.htm
   }


   static HISTORYSerializeSession( bSave: boolean, sSession: string, sAlias?: string ): [string,string] |null {
      return CPageSuper.SerializeSession( bSave, sSession, sAlias );
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
            if( e ) e.childNodes[0].textContent = sText;
         }
      }

      // translate labels in page
      for (const [sKey, sText] of Object.entries(oLanguage)) {
         if( typeof sText === "string" ) this.m_oLabel[sKey] = sText;
      }
   }


}