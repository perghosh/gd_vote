                                                import { CTableData, CRowRows, enumMove, IUITableData, tabledata_column, tabledata_position, tabledata_format, enumReturn } from "./../library/TableData.js";
import { edit } from "./../library/TableDataEdit.js";
import { CTableDataTrigger, EventDataTable, enumTrigger } from "./../library/TableDataTrigger.js";
import { CDispatch } from "./../library/Dispatch.js"


import { CUITableText, enumState, uitabledata_construct } from "./../library/UITableText.js"
import { CQuery } from "./../server/Query.js"
import { CApplication } from "./application.js"
import { CPageSuper, CQuestion, CPageState, details } from "./pagesuper.js"



type condition = { ready?: boolean, table: string, id: string, value: string|number, simple?: string, operator?: number }

type page_construct = {
   callback_action?: ((sMessage: string, data?: any) => void);
   label?: { [key_name: string]: string },
   session?: string,
   set?: string,
}



export class CPageVoter extends CPageSuper {
   m_sQueriesSet: string;            // active query set
   m_oUITableText: { [ key_name: string ]: CUITableText }; // cache ui table text items
   m_aQuestion: CQuestion[];

   constructor(oApplication, oOptions?: page_construct) {
      super( oApplication, oOptions );
      const o: page_construct = oOptions || {};

      this.m_oUITableText = {};

      this.m_sQueriesSet = o.set || "";

      this.m_oLabel = {
         "register": "Registrera"
      };

      if( o.label ) {
         Object.assign(this.m_oLabel, o.label);
      }

      if( o.label ) { this.TRANSLATEPage() }
   }

   get queries_set() : string { return this.m_sQueriesSet; };
   get uitabletext() : { [ key_name: string ]: CUITableText } { return this.m_oUITableText; };

   /**
    * Send information to register voter in system
    * @return {boolean} true if values was sent
    */
   SendRegisterVoter(): boolean {
      const aTD = this.uitabletext.login.data;

      let oQuery = new CQuery();

      const aRow = aTD.ROWGet( 0 );
      for( let i = 0, iTo = aRow.length; i < iTo; i++ ) {
         const oC = aTD.COLUMNGet( i );
         if( oC.position.hide ) continue;
         oQuery.VALUEAdd( oC.name, aRow[i] );
      }

      oQuery.VALUEAdd( "send_mail", 1 );

      let oDocument = (new DOMParser()).parseFromString("<document/>", "text/xml");
      oQuery.VALUEGetXml({ values: "row", document: true }, oDocument);
      const sXml = (new XMLSerializer()).serializeToString(oDocument);

      let oCommand = { command: "add_rows", query: "login", set: this.queries_set, table: "TVoter1" };
      let request = this.app.request;
      request.Get("SCRIPT_Run", { file: "PAGE_result_edit.lua", json: request.GetJson(oCommand) }, sXml);

      return true;
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

   /**
    * Create section with markup to register voter
    * Password will be set later, first voter gets a unlock key
    * @param {any} oHeader [description]
    */
   PAGECreateRegisterVoter( oHeader: any ): void {
      let TDLogin = new CTableData({ id: "login", name: "login" });
      CPageSuper.ReadColumnInformationFromHeader(TDLogin, oHeader);
      TDLogin.ROWAppend();
      TDLogin.COLUMNSetPropertyValue("VoterK", "position.hide", true);
      TDLogin.COLUMNSetPropertyValue([1,2,3], "edit.element", 1 );  
      TDLogin.COLUMNSetPropertyValue([1,2,3], "edit.name", "string");
      TDLogin.COLUMNSetPropertyValue([1,2,3], [ "edit.edit", "format.required"], true );
      TDLogin.COLUMNSetPropertyValue([1,2,3], [ "format.min"], 3 );
      TDLogin.COLUMNSetPropertyValue([3], [ "format.min"], 8 );
      TDLogin.COLUMNSetPropertyValue([3], [ "format.pattern"], "\\S+@\\S+\\.\\S+" );

      //let _Error = TDLogin.ROWValidate( 0 );

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
      }

      let oTrigger = new CTableDataTrigger({ table: TDLogin, trigger: CPageVoter.CALLBACK_TableData });       
      let eContainer = document.getElementById("idUserRegister").querySelector("article");
      let options = {
         parent: eContainer,                                                    // container
         section: [ "body", "statusbar" ],
         state: enumState.HtmlValue | enumState.SetValue,
         style: oStyle,                                                         // styles for generated elements
         table: TDLogin,                                                        // source data
         name: "login",                                                         // name to access UI table in CTableData
         trigger: oTrigger,                                                     // set trigger object, this will enable triggers
         edit: true                                                             // enable edit
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
   <button class='button is-white is-rounded is-primary is-large' style='width: 300px;' data-command="register">${s}</button>
   <button class='button is-white is-rounded is-primary is-large' style='width: 300px;' data-command="unlock">get unlock</button>
</div>`;

      let eButtonRegister = <HTMLElement>eStatusbar.querySelector("button");

      eStatusbar.querySelectorAll("button").forEach( eButton => {
         eButton.setAttribute("disabled", "");
         eButton.addEventListener("click", (e: Event) => {
            const eButton = <HTMLElement>e.srcElement;
            if( eButton.dataset.command === "register" ) {
               eButton.style.display = "none";
               if( this.SendRegisterVoter() === false ) eButton.style.display = "block";
            }
         });
      });
      /*
      eButtonRegister.setAttribute("disabled", "");
      eButtonRegister.addEventListener("click", (e: Event) => {
         const eButton = <HTMLElement>e.srcElement;
         if( eButton.dataset.command === "register" ) {
            eButton.style.display = "none";
            if( this.SendRegisterVoter() === false ) eButton.style.display = "block";
         }
      });
      */
   }

   PAGECreateUnlockVoter( oResult: details.query_result ): void {   
      let TDUnlock = new CTableData({ id: oResult.id, name: oResult.name });
      CPageSuper.ReadColumnInformationFromHeader(TDUnlock, oResult.table.header);
      TDUnlock.COLUMNSetPropertyValue("VoterK", "position.hide", true);
      TDUnlock.COLUMNSetPropertyValue([2], "edit.element", 1 );  
      TDUnlock.COLUMNSetPropertyValue([2], "edit.name", "string");
      TDUnlock.COLUMNSetPropertyValue([2], [ "format.min"], 6 );
      TDUnlock.COLUMNSetPropertyValue([2], [ "format.pattern"], "^\\d+$" );

      let oStyle = {
         html_value: [ 
[1,`<div class="base">         
   <div class="field is-horizontal my-1">
      <div class="field-label is-normal is-size-5">
         <label class="label" data-label='1'></label>
      </div>
      <div class="field-body">
         <div class="field">
            <p class="control">
               <input data-value='1' class="input is-primary is-size-5" type="text" style="margin: 0px;" readonly>
            </p>
         </div>
      </div>
   </div>
   <div class="is-size-5" data-description='1'></div>
   <div class="is-size-4 has-text-danger" data-error='1' style="text-align: right;"></div>
</div>`],
[2,`
<div class="base">         
   <div class="field is-horizontal my-1">
      <div class="field-label is-normal is-size-5">
         <label class="label" data-label='1'></label>
      </div>
      <div class="field-body">
         <div class="field">
            <p class="control">
               <input data-value='1' class="input is-primary is-size-5" type="text" style="margin: 0px;" pattern="[0-9]{6}" >
            </p>
         </div>
      </div>
   </div>
   <div class="is-size-5" data-description='1'></div>
   <div class="is-size-4 has-text-danger" data-error='1' style="text-align: right;"></div>
</div>`] ]
      }
   }


   /**
    * Callback for events managed by CTableDataTrigger
    * @param {EventDataTable} oEventData standard event data
    * @param {any} e This is dependent on the event.
    */
   static CALLBACK_TableData(oEventData, v ) {                            
      let sName = CTableDataTrigger.GetTriggerName( oEventData.iEvent ); 
      switch( sName ) {
      case "AfterSetValue":
         const bDisable =  oEventData.data.ROWValidate( 0 ) === true ? false : true;
         oEventData.dataUI.GetSection("statusbar").querySelectorAll("button").forEach( eButton => {
            eButton.disabled = bDisable;
         });
         break;
      case "BeforeSetCellError":
         let eCell = oEventData.eElement.closest(".base");
         let _type = oEventData.information;
         let e = eCell.querySelector("[data-error]");
         e.innerText = _type[1];
         oEventData.dataUI.GetSection("statusbar").querySelector("button").disabled = true;
         break;

      }
   }



   /**
    * Serialize session id
    * @param {boolean} bSave    if session is saved or loaded
    * @param {string}  sSession session value if saved
    * @param {string}  sAlias   alias for user
    */
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