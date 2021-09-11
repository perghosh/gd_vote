import { CUITableText } from "./../library/UITableText.js";
import { edit  } from "./../library/TableDataEdit.js";
import { CRequest, EventRequest } from "./../server/ServerRequest.js";
import { CPageSuper } from "./pagesuper.js";

namespace details {
   export type application_construct = {
      alias?: string,                                      // user alias
      callback_action?: ((sMessage: string, data: any) => void);
      state?: { [key_name: string]: string|number|boolean } // state items for page
      session?: string;
      protocol?: string;   // protocol used, http or https
      debug?: { debug: boolean, print: HTMLElement };
   }
}


export class CApplication {
   m_callAction: ((sMessage: string, data: any) => void);// callback array for action hooks
   m_sAlias: string;
   m_oPage: CPageSuper;
   m_oPageList: { [key_name: string]: object };
   m_sQueriesSet: string;
   m_oEditors: edit.CEditors;
   m_oRequest: CRequest;
   m_oDebug: { debug: boolean, print: HTMLElement };
   m_sUrl: string;

   // window.location.protocol
   constructor( oOptions?: details.application_construct ) {
      const o = oOptions || {};
      this.m_oDebug = o.debug || null;
      this.m_callAction = o.callback_action || null;
      this.m_oEditors = <edit.CEditors>edit.CEditors.GetInstance();

      let sUrl = o.protocol || "http:";
      sUrl += "//127.0.0.1:8882/jq.srf?";
      // sUrl += "//goorep.se:1001/changelog/jq.srf?";
      // sUrl += "//localhost:8080/so/jq.srf?";



      // Initialize CRequest for server communication
      this.m_oRequest = new CRequest({
         callback: CApplication.CallbackServer,
         folder: "rSelect",
         methods: { SYSTEM_Init: "l10", SYSTEM_GetUserData: "s03", SYSTEM_GetCountry: "s08", SCRIPT_Run: "f60", REPORT_Pdf: "r02" },
         url: sUrl
      });

      this.m_sAlias = o.alias || "guest";                                       // change this based on what alias that is used
      this.m_sQueriesSet = "vote";
      if(o.session) {
         this.m_oRequest.session = o.session;
      }

      this.m_oPageList = {};
   }

   get alias() { return this.m_sAlias; }
   get debug() { return this.m_oDebug; }
   set debug( o: {debug: boolean, print: HTMLElement}) { this.m_oDebug = o; }
   get request() { return this.m_oRequest; }
   get session() { return this.m_oRequest.session; }
   get page() { return this.m_oPage; }
   set page( oPage: CPageSuper ) { this.m_oPage = oPage; }
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
   InitializePage( oState?: { [key_name: string]: string|number|boolean } ) {
      //this.m_oPage = new CPageSuper(this, {callback_action: this.m_callAction});
   }

   AddPage(sName: string, oPage: any) {
      this.m_oPageList[sName] = oPage;
   }

   GetPage( sName: string ): any { return this.m_oPageList[sName]; }

   CallOwner( sMessage: string, data?: any ) {
      if( this.m_callAction ) this.m_callAction.call( this, sMessage, data );
   }

   OnResponse(eSection, sMethod: string , sHint: string ) {
      let aItem = eSection.getElementsByTagName('item');
      for(let i = 0; i < aItem.length; i++) {
         let eItem = aItem[ i ];
         const sName = eItem.getAttribute("name");
         (<any>this.page).ProcessResponse(eItem, sName, sHint);

      }
   }

   static CallbackServer(eSection: Element, sMethod: string, e: EventRequest) {
      let get_text = (eSection, sName) => {
         let e = eSection.querySelector(sName);
         if(e) return e.textContent;
         return null;
      };

      let oApplication = (<any>window).app;

      var sError = eSection ? eSection.getAttribute("error") : "";
      if(sError === "1") {
         let sError = eSection.textContent;
         const iError = sError.indexOf("%%");               // search for %%, if found this is a special error
         if(iError !== -1) {
            let sName = sError.substr( iError, 100 );
            const iErrorTo = sName.indexOf("%%", 2);
            if(iErrorTo !== -1  ) {                         // found start and end of error name ?
               sName = sName.substr(0, iErrorTo);
            }
            throw sName;
         }
         throw sError;
      }
      else if(sMethod === "SCRIPT_Run") {
         const sComponent = get_text(eSection, "component");
         const sFile = get_text(eSection, "file");
         const sHint = get_text(eSection, "hint");
         oApplication.OnResponse(eSection, sMethod, sHint);
      }
      else if(sMethod === "SYSTEM_GetUserData") {
         oApplication.CallOwner("server-session");
         oApplication.queries_set = oApplication.page.queries_set;
         if(oApplication.queries_set) {
            let request = oApplication.request;
            let oCommand = { command: "load_if_not_found", set: "vote" };
            request.Get("SCRIPT_Run", { file: "queriesset.lua", json: request.GetJson(oCommand) });
         }
         else {
            oApplication.page.CallOwner("load");
         }
      }
      else if( sMethod === "user" ) {
         oApplication.request.Get("SYSTEM_GetUserData", { name: "guest" });   
      }
      else if( sMethod === "alias" ) {
         oApplication.m_sAlias = e.sResponseText;
      }
      else if( sMethod === "set-language" || sMethod === "js" ) {
         oApplication.CallOwner(sMethod, e);
      }
   }
} // class CApplication
