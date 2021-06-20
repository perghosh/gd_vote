// %AppData%\npm\node_modules
// install typeings with npm like this: "npm install typings --global"
// install: typings install d3
export class CD3Bar {
    constructor(oOptions) {
        const o = oOptions || {};
        this.m_aDataset = o.dataset || [];
        this.m_aQuestion = [];
    }
    /**
     * Add question to D3 bar
     * @param {number} iKey key to question
     * @param {string} sQuestion question name
     * @param {HTMLElement} [eContainer] container for chart
     */
    AddQuestion(iKey, sQuestion, eContainer) {
        this.m_aQuestion.push({ key: iKey, question: sQuestion, element: eContainer, answer: [] });
    }
    /**
     * Get question object
     * @param {number | string} _Key name or key to question
     * @returns {details.question} question for key or question name
     */
    GetQuestion(_Key) {
        let i = this.m_aQuestion.length;
        while (--i >= 0) {
            const oQuestion = this.m_aQuestion[i];
            if (typeof _Key === "number" && oQuestion.key === _Key)
                return oQuestion;
            else if (oQuestion.question === _Key)
                return oQuestion;
        }
        return null;
    }
    /**
     * Add answer to question
     * @param {number|string} _Key to answer
     * @param aAnswer
     */
    AddAnswer(_Key, aAnswer) {
        let oQuestion = this.GetQuestion(_Key);
        console.assert(oQuestion !== null, `no question for ${_Key}`);
        oQuestion.answer.push(aAnswer);
    }
    /**
     * Set count for answer
     * @param {number|string} _Question key or name to get selected question
     * @param {number|string} _Answer key or name to selected answer
     * @param {number | [number,number]} _Count set vote count for actual count or filtered
     */
    SetAnswerCount(_Question, _Answer, _Count) {
        let oQuestion = this.GetQuestion(_Question);
        console.assert(oQuestion !== null, `no question for ${_Question}`);
        for (let i = 0; i < oQuestion.answer.length; i++) {
            let aAnswer = oQuestion.answer[i];
            if ((typeof _Answer === "number" && _Answer === aAnswer[0]) || _Answer === aAnswer[1]) {
                if (Array.isArray(_Count)) {
                    if (typeof _Count[0] === "number")
                        aAnswer[2] = _Count[0];
                    if (_Count.length > 1 && typeof _Count[1] === "number")
                        aAnswer[3] = _Count[1];
                }
                else {
                    aAnswer[2] = _Count;
                }
                break;
            }
        }
    }
    /**
     * Return larges vote count for any of the answers in current poll
     * @returns {number} max number of vote count
     */
    GetMaxVoteCount() {
        const iMaxValue = d3.max(this.m_aQuestion, function (oQuestion) {
            return d3.max(oQuestion.answer, function (a) { return a[2]; });
        });
        return iMaxValue;
    }
    /**
     * Set filter count values to zero
     */
    ResetFilterCount() {
        let i = this.m_aQuestion.length;
        while (--i >= 0) {
            const oQuestion = this.m_aQuestion[i];
            oQuestion.answer.forEach(a => { a[3] = 0; });
        }
    }
    /**
     * Delete selected question or all questions
     * @param {number | string} [_Key] name or key to question
     */
    DeleteQuestion(_Key) {
        if (_Key === undefined)
            this.m_aQuestion = [];
        else {
            let i = this.m_aQuestion.length;
            while (--i >= 0) {
                const oQuestion = this.m_aQuestion[i];
                if (typeof _Key === "number" && oQuestion.key === _Key) {
                    this.m_aQuestion.splice(i, 1);
                    return;
                }
                else if (oQuestion.question === _Key) {
                    this.m_aQuestion.splice(i, 1);
                    return;
                }
            }
        }
    }
    /**
     * Render chart
     * @param {boolean} [bFilterValues] if true then render bar with filter values
     */
    Render(bFilterValues) {
        for (let i = 0; i < this.m_aQuestion.length; i++) {
            const oQuestion = this.m_aQuestion[i];
            this.RenderBar(oQuestion, bFilterValues);
        }
    }
    RenderBar(oQuestion, bFilterValues) {
        const aAnswer = oQuestion.answer; // answer and answer counts
        let eContainer = oQuestion.element;
        console.assert(eContainer != undefined, "No container element for bar");
        eContainer.innerHTML = "";
        const iWidthElement = eContainer.offsetWidth;
        console.assert(iWidthElement !== 0, "Bar container needs width");
        let d3Svg = d3.select(eContainer) // create svg element
            .append('svg')
            .attr('width', "100%")
            .attr('height', "100%");
        const iMaxVoteCount = this.GetMaxVoteCount(); // max votes for any answer
        const iHeightBar = 25; // bar height in svg element
        const iCountBar = aAnswer.length; // number of bars for current question
        const oMargin = { top: 5, right: 40, bottom: 20, left: 10 }; // margin
        const iWidthInner = iWidthElement - oMargin.left - oMargin.right;
        const iHeightInner = iCountBar * iHeightBar; // inner height is the chart height
        const iHeightElement = iHeightInner + oMargin.top + oMargin.bottom; // height for container element
        const d3XScale = d3.scaleLinear().domain([0, iMaxVoteCount]).range([0, iWidthInner]); // create x scaler
        const d3YScale = d3.scaleBand().domain(aAnswer.map(a => a[1])).range([0, iHeightInner]).padding(0.1);
        eContainer.style.height = "" + iHeightElement + "px";
        let g = d3Svg.append("g").attr("transform", `translate(${oMargin.left},${oMargin.top})`); // add g element to svg
        g.append("g").call(d3.axisBottom(d3XScale)).attr("transform", `translate(0,${iHeightInner})`);
        g.selectAll("rect").data(aAnswer)
            .enter()
            .append("rect")
            .attr("y", a => d3YScale(a[1]))
            .attr("width", a => d3XScale(a[2]))
            .attr("height", a => d3YScale.bandwidth())
            .attr("fill", "steelblue");
        if (bFilterValues) {
            g = d3Svg.append("g").attr("transform", `translate(${oMargin.left},${oMargin.top})`);
            g.selectAll("rect").data(aAnswer)
                .enter()
                .append("rect")
                .attr("y", a => d3YScale(a[1]))
                .attr("height", a => d3YScale.bandwidth())
                .attr("width", 0)
                .attr("fill", "darkseagreen") // darkorange #486081
                .transition()
                .duration(2000)
                .attr("width", a => d3XScale(a[3]));
        }
        g = d3Svg.append("g");
        g.selectAll("text").data(aAnswer)
            .enter()
            .append("text")
            .text(a => a[1])
            .attr("y", a => d3YScale(a[1]) + (iHeightBar / 1.2))
            .attr("x", function (a) {
            const iWidth = this.getBBox().width;
            let iPosition = Math.max(d3XScale(a[2]), iWidth);
            if ((iPosition - iWidth) <= oMargin.left)
                iPosition = 25;
            return iPosition;
        })
            .attr("text-anchor", function (a) {
            const iWidth = this.getBBox().width + 10;
            if (d3XScale(a[2]) < iWidth)
                return "start";
            return "end";
        })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", function (a) {
            const iWidth = this.getBBox().width + 10;
            if (d3XScale(a[2]) > iWidth)
                return "white";
            return "black";
        });
    }
    create_svg(eContainer) {
        let iHeight = eContainer.offsetHeight - 10; // calculate total height, leave space for x axis
        const iWidth = eContainer.offsetWidth; // calculate total width
        const iCount = this.m_aDataset.length; // number of rows in array
        const iMaxValue = d3.max(this.m_aDataset, function (a) { return a[2]; }); // max value in array
        const iMinValue = d3.min(this.m_aDataset, function (a) { return a[2]; }); // max value in array
        const iHeightBar = iHeight / iCount;
        const iYTextOffset = (iHeight / iCount) * .5 + 4; // calculate Y offset for  text
        let d3Svg = d3.select(eContainer) // create svg element
            .append('svg')
            .attr('width', "100%")
            .attr('height', "100%");
        console.log(eContainer.firstElementChild.tagName);
        //Add bars to the generated svg element
        d3Svg.selectAll("rect") // create rect elements
            .data(this.m_aDataset)
            .enter()
            .append("rect")
            .style("fill", "#95c8d8")
            .attr("y", (a, i) => {
            return (i * iHeightBar);
        })
            .attr("x", 0)
            .attr("width", (a) => {
            return a[2] * (iWidth / iMaxValue);
        })
            .attr("height", (iHeight / iCount) - 2);
        //set the label
        d3Svg.selectAll("text") // create text elements
            .data(this.m_aDataset)
            .enter()
            .append("text")
            .text(a => a[1])
            .attr("text-anchor", "start")
            .attr("x", 10)
            .attr("y", (a, i) => {
            return Math.abs(i * (iHeight / iCount)) + iYTextOffset;
        })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", "black");
        /*
        .attr("fill", function(d) {
          return "rgb(5, 2, " + (d * 10) + ")";
        });
        */
        /*
              let d3Bar = d3Svg.selectAll("g.d3_bar")
                 .data( this.m_aDataset )
                 .enter().append("g")
                 .attr("class", "d3_bar");
        
              d3Bar.append("text")
                  .attr("x", 12)
                  .attr("dy", "1.2em")
                  .attr("text-anchor", "left")
                  .text(function(a) { return a[1]; })
                  .style("fill", "#000000");
        
              d3Bar.append("rect")
                 .attr("class", "malebar")
                 .attr("height", iHeight)
                 .attr("x", 10);
                 */
        /*
              let d3Bar = d3BarArea.selectAll();
              d3Bar = d3Bar.data(this.m_aDataset);
        
              d3Bar.enter().append("rect")
                 .style("fill", "#95c8d8")                          // set bar colors sky blue = "#95c8d8", air force = "#588bae"
                 .attr('x', 0)
                 .attr('y', (d,i)=>i*35)
                 .attr('height', 30)
                 .attr('width', a => {
                    return a[2] * 6;
                 })
                 .append("text")
                 .attr("text-anchor", "end")
                 .text( a => a[1] );
        
                 */
        /*
              d3Bar.selectAll("text")
                 .data( this.m_aDataset )
                 .enter()
                 .append("text")
                 .text( a => a[1] );
                 */
    }
}
