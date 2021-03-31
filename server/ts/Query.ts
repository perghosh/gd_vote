namespace details {

   export type condition = {
      id?: string, 
      value?: unknown, 
      operator?: number | string, 
      simple?: string, 
      group?: string, 
      table?: string,
   }

   export type header = {
      name: string,              // header name
      value?: unknown,           // value set to header value
   }

   export type value = {
      index: number,             // index matching field in query
      name: string,              // name for field in query
      value?: unknown,           // value set to field in query,
      is_null: number,           // if value is null
   }


   export type construct = {
      header?: header[],
      values?: value[],
      conditions?: condition[],
   }

}

export class CQuery {
   m_aCondition: details.condition[]; // condition id, value, operator, simple value, group name
   m_aHeader: details.header[];
   m_aValue: details.value[];

   constructor( options: details.construct ) {
      const o = options || {};

      this.m_aCondition = o.conditions || [];
      this.m_aCondition.forEach( o => { 
         if( o.operator === undefined ) o.operator = 0;
      });

      this.m_aHeader = o.header || [];
      this.m_aValue = o.values || [];
   }

   get values() { return this.m_aValue; }
   set values(aValue: details.value | details.value[]) { 
      if( Array.isArray(aValue) === false ) aValue = [ <details.value>aValue ];
      this.m_aValue = <details.value[]>aValue; 
   }

   CONDITIONAdd( sTable: string, sId: string, _value: unknown, iOperator?: number );
   CONDITIONAdd( _1: any, _2: any, _3: any, _4 = 0, _5?: any, _6?: any) {
      let oCondition: details.condition = {};
      let sTable: string, sId: string, _value: unknown, iOperator: number;
      if( typeof _1 === "string" ) {
         oCondition.table = _1;
         oCondition.operator = _4;

         if( typeof _2 === "string" ) oCondition.id = _2;
         if( _3 !== undefined ) { oCondition.value = _3; }
         if( typeof _5 === "string"  ) { oCondition.simple = _5; }
         if( typeof _6 === "string"  ) { oCondition.group = _6; }
      }
      else {
         oCondition = _1;
         if( oCondition.operator === undefined ) oCondition.operator = 0;
      }

      this.m_aCondition.push( oCondition );
   }

   CONDITIONGetXml( oOptions?: { conditions?: string, condition?: string, document?: boolean }, doc?: XMLDocument ): XMLDocument | string {
      oOptions = oOptions || {};
      let xml = CQuery.CONDITIONGetDocument( this.m_aCondition, oOptions, doc );

      if( oOptions.document ) return xml;
      const sXml = (new XMLSerializer()).serializeToString(xml);
      return sXml;
   }

   HEADERGetXml(oOptions?: { values?: string, value?: string, document?: boolean }, doc?: XMLDocument): XMLDocument | string {
      oOptions = oOptions || {};
      let xml = CQuery.HEADERGetDocument( this.m_aHeader, oOptions, doc );

      if( oOptions.document ) return xml;
      const sXml = (new XMLSerializer()).serializeToString(xml);
      return sXml;
   }


   VALUEGetXml(oOptions?: { index?: number, values?: string, value?: string, document?: boolean }, doc?: XMLDocument): XMLDocument | string {
      oOptions = oOptions || {};
      let xml = CQuery.VALUEGetDocument( this.m_aValue, oOptions, doc );

      if( oOptions.document ) return xml;
      const sXml = (new XMLSerializer()).serializeToString(xml);
      return sXml;
   }

   static CONDITIONGetDocument( aCondition: details.condition[],
      oOptions: { conditions?: string, condition?: string },
      doc?: XMLDocument ): XMLDocument {
      doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
      let xml = doc.documentElement;

      const sConditions = oOptions.conditions || "conditions";
      const sCondition = oOptions.condition || "condition";

      let eConditions = doc.createElement( sConditions )
      xml.appendChild( eConditions );

      aCondition.forEach( o => {
         let eCondition = eConditions.appendChild( doc.createElement( sCondition ) );
         eCondition.setAttribute("table", o.table )
         eCondition.setAttribute("id", o.id );
         eCondition.setAttribute("value", o.value.toString() );
         eCondition.setAttribute("operator", o.operator.toString() );
         if( o.simple ) eCondition.setAttribute("simple", o.simple );
         if( o.group ) eCondition.setAttribute("simple", o.group );
      });  
      return doc;
   }

   static HEADERGetDocument(aHeader: details.header[],
      oOptions: { header?: string, value?: string },
      doc?: XMLDocument): XMLDocument {
      doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
      let xml = doc.documentElement;

      const sHeaders = oOptions.header || "header";
      const sHeader = oOptions.value || "value";

      let eHeaders = doc.createElement( sHeaders );
      xml.appendChild( eHeaders );

      aHeader.forEach( (o, i) => {
         let eHeader = eHeaders.appendChild( doc.createElement( sHeader ) );
         if( o.name !== undefined ) eHeader.setAttribute("name", o.name );

         if( o.value !== undefined ) eHeader.textContent = o.value.toString();

      });  

      return doc;
   }


   static VALUEGetDocument(aValue: details.value[],
      oOptions: { index?: number, row?: string, values?: string, value?: string },
      doc?: XMLDocument): XMLDocument {
      doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
      let xml = doc.documentElement;

      const sRow = oOptions.row || "row";
      const sValues = oOptions.values || "values";
      const sValue = oOptions.value || "value";

      let eValues = doc.createElement( sValues );
      if( oOptions.index !== undefined ) eValues.setAttribute("index", oOptions.index.toString() );
      xml.appendChild( eValues );

      let add_value = function(eValues: Node, o: details.value) {
         let eValue = eValues.appendChild( doc.createElement( sValue ) );
         if( o.index !== undefined ) eValue.setAttribute("index", o.index.toString() );
         if( o.name !== undefined ) eValue.setAttribute("name", o.name );
         if( o.is_null ) eValue.setAttribute("is-null", "1" );
         if( o.value !== undefined ) eValue.textContent = o.value.toString();
      }

      aValue.forEach( (o, i) => {
         add_value(eValues, o);
      });  

      return doc;
   }
}