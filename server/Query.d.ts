declare namespace details {
    type condition = {
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
        index: number;
        name: string;
        value?: unknown;
        is_null: number;
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
    static VALUEGetDocument(aValue: details.value[], oOptions: {
        index?: number;
        row?: string;
        values?: string;
        value?: string;
    }, doc?: XMLDocument): XMLDocument;
}
export {};
