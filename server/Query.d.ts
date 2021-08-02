declare namespace details {
    type condition = {
        flags?: string;
        id?: string;
        value?: unknown;
        operator?: number | string;
        simple?: string;
        group?: string;
        table?: string;
    };
    type header = {
        name: string;
        value?: unknown;
    };
    type value = {
        index?: number;
        name?: string;
        value?: unknown;
        is_null?: number;
    };
    type construct = {
        header?: header[];
        values?: value[];
        conditions?: condition[];
    };
}
export declare class CQuery {
    m_aCondition: details.condition[];
    m_aHeader: details.header[];
    m_aValue: details.value[];
    constructor(options?: details.construct);
    get values(): details.value | details.value[];
    set values(aValue: details.value | details.value[]);
    /**
     * [CONDITIONAdd description]
     * @param {string}  sTable   id for table
     * @param {string}  sId      id to condition
     * @param {unknown} _value   condition value
     * @param {number}  [iOperator] operator number, used in condition (0 = equal, 1 = less than, etc. )
     */
    CONDITIONAdd(sTable: string, sId: string, _value: unknown, iOperator?: number): any;
    CONDITIONAdd(oCondition: {
        table: string;
        id: string;
        value: string | number;
        simple?: string;
        operator?: number;
    }): any;
    CONDITIONGetXml(oOptions?: {
        conditions?: string;
        condition?: string;
        document?: boolean;
    }, doc?: XMLDocument): XMLDocument | string;
    HEADERGetXml(oOptions?: {
        values?: string;
        value?: string;
        document?: boolean;
    }, doc?: XMLDocument): XMLDocument | string;
    /**
     * Add table valuem may be used to insert value to table in database
     * @param  {string}  sName  name for value
     * @param  {unknown} _Value value
     * @return {number}  number of values in internal list of values
     */ /**
    * Add table valuem may be used to insert value to table in database
    * @param  {number} iIndex number matching index in query used to extract column information for value in table
    * @param  {unknown} _Value value
    * @return {number}  number of values in internal list of values
    */
    VALUEAdd(sName: string, _Value: unknown): number;
    VALUEAdd(iIndex: string, _Value: unknown): number;
    VALUEAdd(aValue: details.value[] | details.value): number;
    VALUEGetXml(oOptions?: {
        index?: number;
        values?: string;
        value?: string;
        document?: boolean;
    }, doc?: XMLDocument): XMLDocument | string;
    static CONDITIONGetDocument(aCondition: details.condition[], oOptions: {
        conditions?: string;
        condition?: string;
    }, doc?: XMLDocument): XMLDocument;
    static HEADERGetDocument(aHeader: details.header[], oOptions: {
        header?: string;
        value?: string;
    }, doc?: XMLDocument): XMLDocument;
    /**
     * [VALUEGetDocument description]
     * @param  {details.value[]} aValue  [description]
     * @param  {object}         oOptions [description]
     * @param  {XMLDocument}    doc [description]
     * @return {XMLDocument} [description]
     */
    static VALUEGetDocument(aValue: details.value[], oOptions: {
        index?: number;
        row?: string;
        values?: string;
        value?: string;
    }, doc?: XMLDocument): XMLDocument;
}
export {};
