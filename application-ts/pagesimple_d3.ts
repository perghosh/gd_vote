// %AppData%\npm\node_modules
// install typeings with npm like this: "npm install typings --global"
// install: typings install d3


// <reference path="./typings/modules/d3/index.d.ts" />

import { CDispatch, IDispatch } from "./../library/Dispatch.js"

declare var d3: any;

namespace details {

   /*
    * store number of votes  for each answer
    * @property {Array.<number,string,number,number>} answer store information about answer
    * @property {number} answer[0] key to answer
    * @property {string} answer[1] answer name
    * @property {number} answer[2] vote count for answer
    * @property {number} answer[3] filter count for answer
    */
   export type answer = [number, string, number, number]; 

   /*
    * store question and results for question
    * @property {object} question result information for each question. One question has many answers
    * @property {number} question.key key to question
    * @property {string} question.question question name
    * @property {answer[]} question.answer question answers
    */
   export type question = {
      key: number,
      question: string,
      element?: HTMLElement,
      answer: answer[]
   }


   export type d3bar_construct = {
      dataset?: unknown[], 
      dispatch?: CDispatch,      
      id?: string,
   }
}

export class CD3Bar implements IDispatch {
   m_aDataset: unknown[];
   m_oDispatch?: CDispatch;   // dispatcher to deliver messages to owner
   m_sId?: string;            // Unique id for CD3Bar bar
   m_aQuestion: details.question[]; 

   static s_sWidgetName: string = "d3bar";

   constructor( oOptions?: details.d3bar_construct ) {
      const o = oOptions || {};
      this.m_sId        = o.id || CD3Bar.s_sWidgetName + (new Date()).getUTCMilliseconds();
      this.m_aDataset = o.dataset || [];
      this.m_oDispatch = o.dispatch || null;

      this.m_aQuestion = [];
   }

   get name() { return "CD3Bar"; }
   get id() { return this.m_sId; }
   get dispatch() { return this.m_oDispatch; }              // get dispatcher if any connected
   set dispatch(oDispatch: CDispatch) { this.m_oDispatch = oDispatch; }


   /**
    * Add question to D3 bar
    * @param {number} iKey key to question
    * @param {string} sQuestion question name
    * @param {HTMLElement} [eContainer] container for chart
    */
   AddQuestion(iKey: number, sQuestion: string, eContainer?: HTMLElement ) {
      this.m_aQuestion.push({ key: iKey, question: sQuestion, element: eContainer, answer: [] });
   }

   /**
    * Get question object
    * @param {number | string} _Key name or key to question
    * @returns {details.question} question for key or question name
    */
   GetQuestion(_Key: number | string): details.question {
      let i = this.m_aQuestion.length;
      while(--i >= 0) {
         const oQuestion = this.m_aQuestion[i];
         if(typeof _Key === "number" && oQuestion.key === _Key) return oQuestion;
         else if(oQuestion.question === _Key) return oQuestion;
      }

      return null;
   }

   /**
    * Add answer to question
    * @param {number|string} _Key to answer
    * @param aAnswer
    */
   AddAnswer( _Key: number|string, aAnswer: details.answer ) {
      let oQuestion = this.GetQuestion(_Key);      console.assert(oQuestion !== null, `no question for ${_Key}` );
      oQuestion.answer.push( aAnswer );
   }

   /**
    * Set count for answer
    * @param {number|string} _Question key or name to get selected question
    * @param {number|string} _Answer key or name to selected answer
    * @param {number | [number,number]} _Count set vote count for actual count or filtered
    */
   SetAnswerCount(_Question: number|string, _Answer: number | string, _Count: number | [number,number]) {
      let oQuestion = this.GetQuestion(_Question);                            console.assert(oQuestion !== null, `no question for ${_Question}`);

      for(let i = 0; i < oQuestion.answer.length; i++) {
         let aAnswer = oQuestion.answer[i];
         if((typeof _Answer === "number" && _Answer === aAnswer[0]) || _Answer === aAnswer[1]) {
            if(Array.isArray(_Count)) {
               if( typeof _Count[0] === "number" ) aAnswer[ 2 ] = _Count[0];
               if( _Count.length > 1 && typeof _Count[1] === "number" ) aAnswer[ 3 ] = _Count[1];
            }
            else {
               aAnswer[ 2 ] = _Count;
            }
            break;
         }
      }
   }

   /**
    * Return larges vote count for any of the answers in current poll
    * @returns {number} max number of vote count
    */
   GetMaxVoteCount(): number {
      const iMaxValue = d3.max(this.m_aQuestion, function (oQuestion) { 
         return d3.max(oQuestion.answer, function(a) { return a[2] } );
      });
      return iMaxValue;
   }

   /**
    * Set filter count values to zero
    */
   ResetFilterCount() {
      let i = this.m_aQuestion.length;
      while(--i >= 0) {
         const oQuestion = this.m_aQuestion[i];

         oQuestion.answer.forEach( a => { a[3] = 0; });
      }
   }

   /**
    * Delete selected question or all questions
    * @param {number | string} [_Key] name or key to question
    */
   DeleteQuestion(_Key?: number | string) {
      if(_Key === undefined) this.m_aQuestion = [];
      else {
         let i = this.m_aQuestion.length;
         while(--i >= 0) {
            const oQuestion = this.m_aQuestion[i];
            if(typeof _Key === "number" && oQuestion.key === _Key) { this.m_aQuestion.splice(i, 1); return; }
            else if(oQuestion.question === _Key) { this.m_aQuestion.splice(i, 1); return; }
         }
      }
   }



   /**
    * Render chart
    * @param {boolean} [bFilterValues] if true then render bar with filter values
    */
   Render( bFilterValues?: boolean ) {
      for(let i = 0; i < this.m_aQuestion.length; i++) {
         const oQuestion = this.m_aQuestion[i];
         this.RenderBar( oQuestion, bFilterValues );
      }
   }


   RenderBar(oQuestion: details.question, bFilterValues?: boolean ) {
      const aAnswer = oQuestion.answer;   // answer and answer counts
      let eContainer = oQuestion.element;                                     console.assert( eContainer != undefined, "No container element for bar" );

      eContainer.innerHTML = "";

      const iWidthElement = eContainer.offsetWidth;         console.assert( iWidthElement !== 0, "Bar container needs width" );

      let d3Svg = d3.select( eContainer )                   // create svg element
         .append('svg')
         .attr('width', "100%")
         .attr('height', "100%");

      const iMaxVoteCount = this.GetMaxVoteCount();                            // max votes for any answer
      const iHeightBar = 25;                                                   // bar height in svg element
      const iCountBar = aAnswer.length;                                        // number of bars for current question
      const oMargin = { top: 5, right: 40, bottom: 20, left: 10 };            // margin
      const iWidthInner = iWidthElement - oMargin.left - oMargin.right;
      const iHeightInner = iCountBar * iHeightBar;                             // inner height is the chart height
      const iHeightElement = iHeightInner + oMargin.top + oMargin.bottom;      // height for container element

      const d3XScale = d3.scaleLinear().domain([0,iMaxVoteCount]).range([0,iWidthInner]);// create x scaler
      const d3YScale = d3.scaleBand().domain( aAnswer.map( a => a[1] ) ).range([0,iHeightInner]).padding(0.1);

      eContainer.style.height = "" + iHeightElement + "px";

      let g = d3Svg.append("g").attr("transform",`translate(${oMargin.left},${oMargin.top})`);   // add g element to svg
      g.append("g").call( d3.axisBottom( d3XScale ) ).attr("transform",`translate(0,${iHeightInner})`);

      let fDblClick = (e) => {
         let aAnswer = d3.select(e.srcElement).datum();
         let aResult = this.dispatch.NotifyConnected(this, { command: "set_filter", data: { iAnswer: aAnswer[0] } });
      };

      g.selectAll("rect").data(aAnswer)
         .enter()
         .append("rect")
         .datum( a => a )
         .attr("y", a => d3YScale( a[1] ) )
         .attr("width", a => d3XScale( a[2] ) )
         .attr("height", a => d3YScale.bandwidth() )
         .attr("fill", "steelblue");

      let oBars = g.selectAll("rect");
      oBars.on("dblclick", fDblClick);

      if( bFilterValues ) {
         g = d3Svg.append("g").attr("transform",`translate(${oMargin.left},${oMargin.top})`);

         g.selectAll("rect").data(aAnswer)
            .enter()
            .append("rect")
            .datum( a => a )
            .attr("y", a => d3YScale( a[1] ) )
            .attr("height", a => d3YScale.bandwidth() )
            .attr("width", 0 )
            .attr("fill", "darkseagreen") // darkorange #486081
            .transition()
            .duration(2000)
            .attr("width", a => d3XScale( a[3] ) );

         let oBars = g.selectAll("rect");
         oBars.on("dblclick", fDblClick);
      }

      g = d3Svg.append("g");
      g.selectAll("text").data(aAnswer)
         .enter()
         .append("text")
         .datum( a => a )
         .text(a => a[1])   // a[1] has label text
         .attr("y", a => d3YScale( a[1] ) + (iHeightBar / 1.2)  )
         .attr("x", function( a ) {
            const  iWidth = this.getBBox().width;
            let iPosition = Math.max( d3XScale( a[2] ), iWidth );
            if( (iPosition - iWidth) <= oMargin.left ) iPosition = 25;
            return iPosition;
         })
         .attr("text-anchor", function( a ) {
            const  iWidth = this.getBBox().width + 10;
            if( d3XScale( a[2] ) < iWidth ) return "start";
             return "end"
          })
         .attr("font-family", "sans-serif")
         .attr("font-size", "12px")
         .attr("fill", function( a ) { 
            const  iWidth = this.getBBox().width + 10;
            if( d3XScale( a[2] ) > iWidth ) return "white";
            return "black";
         });

      let oText = g.selectAll("text");
      oText.on("dblclick", fDblClick);
   }


   create_svg( eContainer: HTMLElement ) {
      let   iHeight = eContainer.offsetHeight - 10;         // calculate total height, leave space for x axis
      const iWidth = eContainer.offsetWidth;                // calculate total width
      const iCount = this.m_aDataset.length;                // number of rows in array
      const iMaxValue = d3.max(this.m_aDataset, function (a) { return a[2]; }); // max value in array
      const iMinValue = d3.min(this.m_aDataset, function (a) { return a[2]; }); // max value in array

      const iHeightBar = iHeight / iCount;

      const iYTextOffset = (iHeight / iCount) * .5 + 4;     // calculate Y offset for  text

      let d3Svg = d3.select( eContainer )                   // create svg element
         .append('svg')
         .attr('width', "100%")
         .attr('height', "100%");

      //console.log( eContainer.firstElementChild.tagName );

      //Add bars to the generated svg element
      d3Svg.selectAll("rect")                               // create rect elements
        .data(this.m_aDataset)
        .enter()
        .append("rect")
        .style("fill", "#95c8d8")
        .attr("y", (a, i) => {
          return (i * iHeightBar);
        })
        .attr("x", 0 )
        .attr("width", (a) => {
          return a[2] * (iWidth / iMaxValue);
        })
        .attr("height", (iHeight / iCount) - 2 );

      //set the label
      d3Svg.selectAll("text")                               // create text elements
        .data(this.m_aDataset)
        .enter()
        .append("text")
        .text(a => a[1])
        .attr("text-anchor", "start")
        .attr("x", 10 )
        .attr("y", (a,i) => {
          return Math.abs(i * (iHeight / iCount)) + iYTextOffset;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "black");        

   }


}

