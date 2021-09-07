export declare type DispatchMessage = {
    source?: string;
    command: string;
    target?: string | string[];
    data?: any;
};
export interface IDispatch {
    id?: string;
    name?: string;
    on?: ((oMessage: DispatchMessage, sender: string | IDispatch) => any);
    destroy?: (() => void);
}
/**
 * Object used to connect objects for communication
 * Objects needs to implement "on" and "destroy" methods to work with dispatch
 */
export declare class CDispatch {
    m_aListeners: IDispatch[];
    m_oChain: {
        [key_name: string]: IDispatch[];
    };
    constructor();
    /**
     * Check array for false values
     * @param {unknown[]} aResult array with anything that is checked for false values
     */
    static IsCancel(aResult: unknown[]): boolean;
    AddListener(oListener: IDispatch, aChain: any): IDispatch;
    /**
     * Append chain to listener chain if there is one, otherwise chain is created
     * @param {CListener} listener listener chain is added to
     * @param {IDispatch | IDispatch[]} aChain array with listeners
     */
    AddChain(_Id: string | IDispatch, aChain: IDispatch | IDispatch[]): void;
    /**
     * Notify connected items found in chain.
     * @param sId to chain with connected items
     * @param {DispatchMessage} oMessage message object sent to items in chain
     */
    NotifyConnected(_Id: string | IDispatch, oMessage: DispatchMessage): unknown[];
    /**
       * [SendMessage description]
       * @param {CListener} source Listener object that sends message to connected m_aListeners
       * @param {object} message sent message { source: "source object name", command: "command name", "target object name", data: {message data}, xml: xml_object }
       */
    SendMessage(oMessage: DispatchMessage, source: any): void;
    /**
     * Remove listener from dispatch
     * @param {string|IDispatch} sId id for component that is removed
     */
    Remove(sId: string | IDispatch, bDestroy?: boolean): any;
    RemoveChain(sId: any): void;
}
