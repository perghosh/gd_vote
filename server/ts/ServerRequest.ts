

namespace details {
   export type construct = {
      folder?: string,                        // report folder on server where lua files  are found
      callback?: (( oXml: Element, sName: string, e: EventRequest ) => void | boolean),
      id?: string,                            // id for request object
      methods?: { [ key: string ]: string },  // valid methods. Method names internally differs from server because of readability
      set?: string,                           // active query set
      url?: string,                           // url address to server  
   }

   const enum enumState {
      Raw = 0x0001,      // Value in table has a small dom tree and we need to query for the element holding value
   }
}

/**
 * Event object for events sent in callbacks
 * 
 */
export type EventRequest = {
   sMethod?: string,
   sResponseText?: string,   // response text from server
   iStatus?: number,         // status for response
}


export class CRequest {
   m_sFile: string;   // name for lua file that is used to process request
   m_sFolder: string; // folder on server
   m_sId: string;     // Unique id for source data 
   m_oMethod: { [ key: string ]: string }; // registered server methods
   m_callProcess: ((oXml: Element, sName: string, e: EventRequest) => void | boolean)[];
   m_sUrl: string;    // Url to server
   m_sSession: string;// User session for user on server. This identifies user on server
   m_sSet: string;    // active query set
   m_iState: number;  // Holds internal state for request object.

   static s_iIdNext: number = 0;

   static s_aServerArgument: string[] = [
      "flags", "id", "idcondition", "idtable", "idtableparent",                // 0 - 4
      "key", "keyparent", "max", "name", "operator",                           // 5 - 9
      "page", "query", "query2", "thread", "user",                             // 10 - 14
      "value", "valuecondition", "index", "operation", "keyparentthread",      // 15 - 19
      "addin", "custom", "webpage", "find", "mark",                            // 20 - 24
      "file", "type", "debug", "json", "folder",                               // 25 - 29
      "hint", "auto", "alias", "json8", "parameters",                          // 30 - 34
      "parameters8", "zoom", "width", "height", "join",                        // 35 - 39
      "node", "cache", "component", "widget"                                   // 40 - 44
   ];

   constructor(options: details.construct) {
      const o = options || {};

      this.m_sFolder = o.folder || null;
      this.m_sId = o.id || "id" + ++CRequest.s_iIdNext;

      this.m_callProcess = [];
      if(o.callback) this.m_callProcess = Array.isArray(o.callback) ? o.callback : [ o.callback ];


      this.m_oMethod = o.methods || {};
      this.m_sUrl = o.url;

   }

   get id() { return this.m_sId; }
   get session() { return this.m_sSession; }
   set session(sSession: string) { this.m_sSession = sSession; }


   /**
    * Return identifier for parameter name. Server only allow some type of parameters and each has a specific id
    * @param  {string} parameters allowed 
    * @return {string} id for parameter
    */
   static GetParameter(oParameter: { [ key: string ]: string }): string {
      let sParameter: string = "";
      const a = CRequest.s_aServerArgument;
      let i = a.length;
      while(--i >= 0) {
         let v = oParameter[ a[ i ] ];
         if(v !== undefined) {                                                  // found value for parameter name?
            if(sParameter.length) sParameter += "&";
            if(i < 10) { sParameter += "v0" + i; }                              // pad zero
            else { sParameter += "v" + i; }
            sParameter += v;                                                    // add value
         }
      }

      return sParameter;
   }

   /**
    * Get path to site location
    * @param  {number} iCount number of parts in site location
    * @return {string}        path part to root in site location
    */
   static GetApiPath(iCount: number): string {
      var sPathName = window.location.href;
      while(iCount > 0) {
         var iPosition = sPathName.lastIndexOf('/');
         if(iPosition > 0) sPathName = sPathName.substring(0, iPosition);
         iCount--;
      }
      return sPathName + "/";
   }

   /**
    * Get server method name for method name in page
    * @param  {string} sMethod Name for  method used in browser
    * @return {string} Server method name
    */
   GetMethod(sMethod: string): string {
      let sServer: string = "&";
      const aMethod = sMethod.split("|");
      aMethod.forEach(sName => {
         const sServerName = this.m_oMethod[ sName ];
         if(typeof sServerName === "string") sServer += sServerName;
         else throw `Method ${sServerName} do not have a matching server name`;
      });
      return sServer;
   }

   /**
    * Get the name associated with server method name, this is the readable name used in browser
    * @param  {string} sMethodId The server method id name is returned for
    * @return {string} Name for server method id
    */
   GetMethodName(sMethodId: string): string {
      for(let sKey in this.m_oMethod) {
         if(this.m_oMethod[ sKey ] === sMethodId) return sKey;
      }
      throw `${sMethodId} is not found in CRequest, check why server method was called  but not added to request object`;
   }


   GetJson(oJson: {[ key: string ]: string|number }): string {
      oJson.set = oJson.set || this.m_sSet;
      return encodeURIComponent(JSON.stringify(oJson));
   }


   Get( sMethod: string, oParameters: { [ key: string ]: string }, sData?: string, sUrl?: string ) {
      const sOpen = sData ? "POST" : "GET";
      oParameters = oParameters || {};
      sUrl = sUrl || this.m_sUrl;

      oParameters = Object.assign({}, { user: this.m_sSession, folder: this.m_sFolder, file: this.m_sFile }, oParameters );

      sUrl += CRequest.GetParameter( oParameters );                            // parameters first
      sUrl += this.GetMethod( sMethod );                                       // methods last, methods need parameters so there fore params need to be first in querystring

      var XHRequest = new XMLHttpRequest();
      let self = this;
      XHRequest.onreadystatechange = function() {
         if(this.readyState === 4 ) {
            if( this.status === 200) {
               let oXml = (new DOMParser()).parseFromString(this.responseText, "text/xml");
               self.CallProcess( oXml, this.responseText, this.status );
            }
            else {
               console.assert(false, XHRequest.statusText);
               self.CallProcess( null, XHRequest.statusText, this.status );
            }
         }
      };
      XHRequest.open(sOpen, sUrl);
      if( !sData ) XHRequest.send();
      else {
         XHRequest.setRequestHeader('Content-Type', 'text/xml');
         XHRequest.send(sData);
      }
   } 

   Post( sMethod: string, oParameters: { [ key: string ]: string }, sData: string, sUrl?: string ) {
      oParameters = oParameters || {};
      sUrl = sUrl || this.m_sUrl;

      oParameters = Object.assign({}, { user: this.m_sSession, folder: this.m_sFolder, file: this.m_sFile }, oParameters );
      sUrl += CRequest.GetParameter( oParameters );        // parameters first
      sUrl += this.GetMethod( sMethod );                   // methods last, methods need parameters so there fore params need to be first in querystring

      var XHRequest = new XMLHttpRequest();
      let self = this;
      XHRequest.onreadystatechange = function() {
         if(this.readyState === 4 ) {
            if( this.status === 200) {
               let oXml = (new DOMParser()).parseFromString(this.responseText, "text/xml");
               self.CallProcess( oXml, this.responseText, this.status );
            }
            else {
               console.assert(false, XHRequest.statusText);
               self.CallProcess( null, XHRequest.statusText, this.status );
            }
         }
      };
      XHRequest.open('POST', sUrl);
      XHRequest.setRequestHeader('Content-Type', 'text/xml');
      XHRequest.send(sData);
   }

   /**
    * Execute callbacks with data from server
    * @param {Document} oXml xml document from server
    * @param {string}   sResult all result text from server
    * @param {number}   iStatus server response status
    */
   CallProcess( oXml: Document, sResult: string, iStatus: number  ) {
      if(this.m_callProcess && this.m_callProcess.length > 0) {
         let oEvent: EventRequest = {  sResponseText: sResult, iStatus: iStatus };

         if( oXml === undefined ) {                                            // error, response text is not sent
            let i = 0, iTo = this.m_callProcess.length;
            let callback = this.m_callProcess[ i ];
            while(i++ < iTo) {
               let bResult = callback.call(this, null, null, oEvent);
               if(bResult === false) return;
            }
            return;
         }

         let aSection = oXml.getElementsByTagName('section');                  // get all sections
         for( let i = 0; i < aSection.length; i++ ) {                          // iterate sections
            let eSection = aSection[i];
            let sMethod = eSection.getAttribute("name");                       // method name for section
            if( sMethod === "s03" ) { this.session = eSection.querySelector("user").getAttribute("user"); }

            oEvent.sMethod = sMethod;                                          // server method name
            sMethod = this.GetMethodName( sMethod );                           // get client method name

            let j = 0, jTo = this.m_callProcess.length;
            let callback = this.m_callProcess[ j ];
            while(j++ < jTo) {
               let bResult = callback.call(this, eSection, sMethod, oEvent);
               if(bResult === false) return;
            }
         }
      }
   }

}