export class CQuery {
    constructor(options) {
        const o = options || {};
        this.m_aCondition = o.conditions || [];
        this.m_aCondition.forEach(o => {
            if (o.operator === undefined)
                o.operator = 0;
        });
        this.m_aHeader = o.header || [];
        this.m_aValue = o.values || [];
    }
    get values() { return this.m_aValue; }
    set values(aValue) {
        if (Array.isArray(aValue) === false)
            aValue = [aValue];
        this.m_aValue = aValue;
    }
    CONDITIONAdd(_1, _2, _3, _4, _5, _6) {
        let oCondition = {};
        let sTable, sId, _value, iOperator;
        if (typeof _1 === "string") {
            _4 = _4 || 0;
            oCondition.table = _1;
            oCondition.operator = _4;
            if (typeof _2 === "string")
                oCondition.id = _2;
            if (_3 !== undefined) {
                oCondition.value = _3;
            }
            if (typeof _5 === "string") {
                oCondition.simple = _5;
            }
            if (typeof _6 === "string") {
                oCondition.group = _6;
            }
        }
        else {
            oCondition = _1;
            if (oCondition.operator === undefined)
                oCondition.operator = 0;
        }
        this.m_aCondition.push(oCondition);
    }
    CONDITIONGetXml(oOptions, doc) {
        oOptions = oOptions || {};
        let xml = CQuery.CONDITIONGetDocument(this.m_aCondition, oOptions, doc);
        if (oOptions.document)
            return xml;
        const sXml = (new XMLSerializer()).serializeToString(xml);
        return sXml;
    }
    HEADERGetXml(oOptions, doc) {
        oOptions = oOptions || {};
        let xml = CQuery.HEADERGetDocument(this.m_aHeader, oOptions, doc);
        if (oOptions.document)
            return xml;
        const sXml = (new XMLSerializer()).serializeToString(xml);
        return sXml;
    }
    VALUEAdd(_1, _2) {
        if (Array.isArray(_1)) {
            this.m_aValue = this.m_aValue.concat(_1);
        }
        else if (typeof _1 === "object")
            this.m_aValue.push(_1);
        else {
            let oValue = {};
            if (typeof _1 === "number")
                oValue.index = _1;
            else if (typeof _1 === "string")
                oValue.name = _1;
            oValue.value = _2;
            if (_2 === null || _2 === undefined)
                oValue.is_null = 1;
            this.m_aValue.push(oValue);
        }
        return this.m_aValue.length;
    }
    VALUEGetXml(oOptions, doc) {
        oOptions = oOptions || {};
        let xml = CQuery.VALUEGetDocument(this.m_aValue, oOptions, doc);
        if (oOptions.document)
            return xml;
        const sXml = (new XMLSerializer()).serializeToString(xml);
        return sXml;
    }
    static CONDITIONGetDocument(aCondition, oOptions, doc) {
        doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
        let xml = doc.documentElement;
        const sConditions = oOptions.conditions || "conditions";
        const sCondition = oOptions.condition || "condition";
        let eConditions = doc.createElement(sConditions);
        xml.appendChild(eConditions);
        aCondition.forEach(o => {
            let eCondition = eConditions.appendChild(doc.createElement(sCondition));
            eCondition.setAttribute("table", o.table);
            eCondition.setAttribute("id", o.id);
            eCondition.setAttribute("value", o.value.toString());
            eCondition.setAttribute("operator", o.operator.toString());
            if (o.simple)
                eCondition.setAttribute("simple", o.simple);
            if (o.group)
                eCondition.setAttribute("simple", o.group);
            if (o.flags)
                eCondition.setAttribute("flags", o.flags);
        });
        return doc;
    }
    static HEADERGetDocument(aHeader, oOptions, doc) {
        doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
        let xml = doc.documentElement;
        const sHeaders = oOptions.header || "header";
        const sHeader = oOptions.value || "value";
        let eHeaders = doc.createElement(sHeaders);
        xml.appendChild(eHeaders);
        aHeader.forEach((o, i) => {
            let eHeader = eHeaders.appendChild(doc.createElement(sHeader));
            if (o.name !== undefined)
                eHeader.setAttribute("name", o.name);
            if (o.value !== undefined)
                eHeader.textContent = o.value.toString();
        });
        return doc;
    }
    /**
     * [VALUEGetDocument description]
     * @param  {details.value[]} aValue  [description]
     * @param  {object}         oOptions [description]
     * @param  {XMLDocument}    doc [description]
     * @return {XMLDocument} [description]
     */
    static VALUEGetDocument(aValue, oOptions, doc) {
        doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
        let xml = doc.documentElement;
        const sRow = oOptions.row || "row";
        const sValues = oOptions.values || "values";
        const sValue = oOptions.value || "value";
        let eValues = doc.createElement(sValues);
        if (oOptions.index !== undefined)
            eValues.setAttribute("index", oOptions.index.toString());
        xml.appendChild(eValues);
        let add_value = function (eValues, o) {
            let eValue = eValues.appendChild(doc.createElement(sValue));
            if (o.index !== undefined)
                eValue.setAttribute("index", o.index.toString());
            if (o.name !== undefined)
                eValue.setAttribute("name", o.name);
            if (o.is_null)
                eValue.setAttribute("is-null", "1");
            if (o.value !== undefined)
                eValue.textContent = o.value.toString();
        };
        aValue.forEach((o, i) => {
            add_value(eValues, o);
        });
        return doc;
    }
}
