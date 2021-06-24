declare namespace details {
    type construct = {
        folder?: string;
        callback?: ((oXml: Element, sName: string, e: EventRequest) => void | boolean);
        id?: string;
        methods?: {
            [key: string]: string;
        };
        set?: string;
        url?: string;
    };
}
/**
 * Event object for events sent in callbacks
 *
 */
export declare type EventRequest = {
    sMethod?: string;
    sResponseText?: string;
    iStatus?: number;
};
export declare class CRequest {
    m_iGetUserSession: number;
    m_sFile: string;
    m_sFolder: string;
    m_sId: string;
    m_oMethod: {
        [key: string]: string;
    };
    m_callProcess: ((oXml: Element, sName: string, e: EventRequest) => void | boolean)[];
    m_sUrl: string;
    m_sSession: string;
    m_sSet: string;
    m_iState: number;
    static s_iIdNext: number;
    static s_aServerArgument: string[];
    constructor(options: details.construct);
    get id(): string;
    get session(): string;
    set session(sSession: string);
    /**
     * Return identifier for parameter name. Server only allow some type of parameters and each has a specific id
     * @param  {string} parameters allowed
     * @return {string} id for parameter
     */
    static GetParameter(oParameter: {
        [key: string]: string;
    }): string;
    /**
     * Get path to site location
     * @param  {number} iCount number of parts in site location
     * @return {string}        path part to root in site location
     */
    static GetApiPath(iCount: number): string;
    /**
     * Get server method name for method name in page
     * @param  {string} sMethod Name for  method used in browser
     * @return {string} Server method name
     */
    GetMethod(sMethod: string): string;
    /**
     * Get the name associated with server method name, this is the readable name used in browser
     * @param  {string} sMethodId The server method id name is returned for
     * @return {string} Name for server method id
     */
    GetMethodName(sMethodId: string): string;
    GetJson(oJson: {
        [key: string]: string | number;
    }): string;
    /**
     * Load file from server
     * @param {string} sFile     file name to load
     * @param {string} sMimeType type of file
     * @param {string} [sName]     operation name to know what to do
     * @param {boolean} [bAsynchronous] if true then operation is asynchronous, false and it is synchronous
     */
    Load(sFile: string, sMimeType: string, sName?: string, bAsynchronous?: boolean): void;
    /**
     * Call server method or methods.
     * @param {string}    sMethod Server method or methods that is  called
     * @param {object}    oParameters
     * @param {string}    sData   [description]
     * @param {string}    sUrl    [description]
     */
    Get(sMethod: string, oParameters: {
        [key: string]: string;
    }, sData?: string, sUrl?: string): void;
    Post(sMethod: string, oParameters: {
        [key: string]: string;
    }, sData: string, sUrl?: string): void;
    /**
     * Execute callbacks with data from server
     * @param {Document | string} _Xml xml document from server
     * @param {string}   sResult all result text from server
     * @param {number}   iStatus server response status
     */
    CallProcess(_Xml: Document | string, sResult: string, iStatus: number): void;
}
export {};
