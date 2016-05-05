$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

var svgContainers = {};

$(".country-list").click(function () {
    var countrycode = $(this).attr("id");
    $("#" + selectedCountryCode).toggleClass("selected-country");
    $("#" + countrycode).toggleClass("selected-country");
    selectedCountryCode = countrycode;
    removeEverything();
    years.forEach(function (d) {
        drawCluster(d, 0);
    });
});

function addGraphPlaceholders(years) {
    const noOfColumns = 4;
    const columnWidth = 12 / noOfColumns;
    var separateYears = document.getElementById('separateYears');
    for (var i = 0; i < years.length; i++) {
        var year = years[i];
        separateYears.innerHTML += '<div class="year-block" id="graph-' + year + '"></div>';
        document.getElementById('graph-' + year).innerHTML += '<div class="yeartext" >' +
            year +
            '<span id="yeartext-' + year + '"> ' +
            '</span></div>';
        document.getElementById('graph-' + year).innerHTML += '<div class="chart" id="draw-' + year + '"></div>';
    }
    $('#combinedYears').hide();
}

var years = [];
for (yearCounter = 2015; yearCounter >= 1957; yearCounter--) {
//for (yearCounter = 1957; yearCounter < 2016; yearCounter++) {
    years.push(yearCounter);
}

var selectedCountryCode = "BE";

addGraphPlaceholders(years);

years.forEach(function (d) {
    drawCluster(d, 0);
});

function removeEverything() {
    years.forEach(function (year) {
        d3.selectAll("#receiveMid-" + year).remove();
        d3.selectAll("#receive-" + year).remove();
        d3.selectAll("#giveMid-" + year).remove();
        d3.selectAll("#give-" + year).remove();

    });
    d3.selectAll(".node").remove();
    d3.selectAll("#no-data-text").remove();
}


function removeAndDraw(visibility) {
    removeEverything();
    years.forEach(function (d) {
        drawCluster(d, visibility);
    });
}

document.getElementById("allReceived").addEventListener("click", function () {
    removeAndDraw(1);
});

document.getElementById("allGiven").addEventListener("click", function(){
    removeAndDraw(0);
});

document.getElementById("both").addEventListener("click", function () {
    removeAndDraw(2);
});

document.getElementById("showYearsCombined").addEventListener("click", function () {
    $('#combinedYears').toggle();
    $('#separateYears').toggle();
});


function drawCluster(chartYear, visibility2) {
    var selectedCountryIndex = 0;
    var chartId = "#draw-" + chartYear;
    //var width = $(document).width();
    var width = d3.select(chartId).node().getBoundingClientRect().width;
    //var height = $(document).height();
    var height = d3.select(chartId).node().getBoundingClientRect().height;
    //console.log("Row - Width: " + width + " height: " + height);
    var middlePoint = {X: width / 2, Y: height / 2};

    var countries = [];
    var nodesData = [];
    var selectedCountry;
    var scores = [[]];

    const goldColour = "#ffd700";
    const silverColour = "#c0c0c0";
    const bronzeColour = "#cd7f32";

    const gradientArray = ['#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#2ca25f', '#006d2c'];

    const radiusCenter = 25;
    const radiusOuter = 10;
    const radius = 160; // radius of circle on which outer nodes should be drawn


    if (!(chartYear in svgContainers)) {
        var tempSvg = d3.select(chartId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        svgContainers[chartYear] = tempSvg;
    }

    var svgContainer = svgContainers[chartYear];

    var sortMethod = 1; //0 = none; 1 = neighbours

    //load data from multiple json files async
    d3_queue.queue()
        .defer(d3.json, 'data/countries.json')
        .defer(d3.json, 'data/scores.json')
        .defer(d3.json, 'data/semi_finals.json')
        .await(makeGraph);

    var div = d3.select("body").append("div").attr("class", "tooltip-flag");

    function makeGraph(error, countriesData, scoresData, semiFinalsData) {
        if (error) throw error;

        var countryInYear = false;

        //Get the results for the given year
        var yearResult = scoresData.scores.find(function (s) {
            return s.year == chartYear;
        });

        //Get the countries that participate this year
        countries = [];
        var position = 1;
        yearResult.participants.forEach(function (c) {//Format:[ index, countryCode, scoreReceived]
            var countryCode = c[1];
            var countryData = countriesData.countries.find(function (c2) {
                return c2.countryCode == countryCode;
            });
            var totalScoreReceived = c[2];
            var index = c[0]; // index to calculate the score in the matrix

            if (countryCode == selectedCountryCode) {
                selectedCountryIndex = index;
                countryInYear = true;
            }

            countries[index] = ({
                countryData: countryData,
                index: index,
                totalScoreReceived: totalScoreReceived,
                position: position
            });
            position++;
        });

        var links = [];

        if (countryInYear) {
            $('#yeartext-' + chartYear).show();

            scores = yearResult.scores;
            if (chartYear == 1958) {
                for (i = 0; i < scores.length; i++) {
                    var line = "";
                    for (j = 0; j < scores.length; j++) {
                        line += " " + scores[i][j];
                    }
                    console.log(line)
                }
            }
            //aantal gegeven punten
            var pointsCount = countries.length - 1;

            // hoek tussen landen
            var slice = 2 * Math.PI / pointsCount;

            selectedCountry = {
                country: countries[selectedCountryIndex],
                X: middlePoint.X,
                Y: middlePoint.Y,
                R: radiusCenter
            };

            nodesData.push(selectedCountry);

            var i = 0, j = 0;

            var temp = countries.slice();
            temp.splice(selectedCountryIndex, 1);

            if (sortMethod != 0) {
                temp = temp.sort(function (c1, c2) {
                    if (sortMethod == 1) {
                        //sorteren op neighbors
                        return selectedCountry.country.countryData.neighbours.indexOf(c1.countryData.countryCode) > -1 ? -1 : 1;
                    }
                    else {
                        return scores[c1.index][selectedCountryIndex] < scores[c2.index][selectedCountryIndex]
                    }
                });

            }

            temp.forEach(
                function (c) {
                    if (i == selectedCountryIndex)
                        i++;

                    var country = countries[c.index];

                    var angle = slice * (j);
                    var isNeighour = selectedCountry.country.countryData.neighbours.indexOf(country.countryData.countryCode) > -1;

                    var outerCenterX = middlePoint.X + (isNeighour ? radius * .65 : radius) * Math.cos(angle);
                    var outerCenterY = middlePoint.Y + (isNeighour ? radius * .65 : radius) * Math.sin(angle);

                    var outerLinkX = middlePoint.X + ((isNeighour ? radius * .65 : radius) - radiusOuter) * Math.cos(angle);
                    var outerLinkY = middlePoint.Y + ((isNeighour ? radius * .65 : radius) - radiusOuter) * Math.sin(angle);

                    var innerLinkX = middlePoint.X + radiusCenter * Math.cos(angle);
                    var innerLinkY = middlePoint.Y + radiusCenter * Math.sin(angle);

                    // center between 2 links; x = (x1+x2)/2; y = (y1+y2)/2
                    var centerLinkX = (innerLinkX + outerLinkX) / 2;
                    var centerLinkY = (innerLinkY + outerLinkY) / 2;

                    nodesData.push({country: countries[c.index], X: outerCenterX, Y: outerCenterY, R: radiusOuter});

                    links.push({
                        innerLinkX: innerLinkX,
                        innerLinkY: innerLinkY,
                        outerLinkX: outerLinkX,
                        outerLinkY: outerLinkY,
                        centerLinkX: centerLinkX,
                        centerLinkY: centerLinkY,
                        scoreGiven: scores[c.index][selectedCountryIndex],
                        scoreReceived: scores[selectedCountryIndex][c.index],
                        isNeighbor: isNeighour
                    });

                    j++;
                    i++;
                });

            var lineFunction = d3.svg.line()
                .x(function (d) {
                    return d.X;
                })
                .y(function (d) {
                    return d.Y;
                });

            var layer1 = svgContainer.append('g');

            function drawLinks(visibility) {
                //remove the current lines
                d3.selectAll("#receiveMid-" + chartYear).remove();
                d3.selectAll("#receive-" + chartYear).remove();
                d3.selectAll("#giveMid-" + chartYear).remove();
                d3.selectAll("#give-" + chartYear).remove();

                switch (visibility) {
                    //give
                    case 0:
                        links.forEach(function (item, index) {
                            var temp = Math.round((gradientArray.length / yearResult.maxScore) * item.scoreGiven) - 1;
                            var linkColor = gradientArray[temp];
                            if (item.scoreGiven != 0) {
                                layer1.append("path")
                                    .attr("id", "give-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.innerLinkX, Y: item.innerLinkY},
                                        {X: item.outerLinkX, Y: item.outerLinkY}
                                    ]))
                                    .attr("stroke", linkColor)
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", "url(#arrow" + temp + ")")
                            }
                        });

                        break;
                    //receive
                    case 1:
                        links.forEach(function (item, index) {
                            var temp = Math.round((gradientArray.length / yearResult.maxScore) * item.scoreReceived) - 1;
                            var linkColor = gradientArray[temp];
                            if (item.scoreReceived != 0) {
                                layer1.append("path")
                                    .attr("id", "receive-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.outerLinkX, Y: item.outerLinkY},
                                        {X: item.innerLinkX, Y: item.innerLinkY}
                                    ]))
                                    .attr("stroke", linkColor)
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", "url(#arrow" + temp + ")")
                            }
                        });
                        break;
                    //both
                    case  2:
                        links.forEach(function (item, index) {
                            var temp1 = Math.round((gradientArray.length / yearResult.maxScore) * item.scoreGiven) - 1;
                            var linkColor1 = gradientArray[temp1];
                            var temp2 = Math.round((gradientArray.length / yearResult.maxScore) * item.scoreReceived) - 1;
                            var linkColor2 = gradientArray[temp2];
                            if (item.scoreGiven != 0 && item.scoreReceived != 0) {
                                //give
                                layer1.append("path")
                                    .attr("id", "give-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.innerLinkX, Y: item.innerLinkY},
                                        {X: item.centerLinkX, Y: item.centerLinkY}
                                    ]))
                                    .attr("stroke", linkColor1)
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", "url(#arrow" + temp1 + ")")
                                ;
                                //receive
                                layer1.append("path")
                                    .attr("id", "receive-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.outerLinkX, Y: item.outerLinkY},
                                        {X: item.centerLinkX, Y: item.centerLinkY}
                                    ]))
                                    .attr("stroke", linkColor2)
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", "url(#arrow" + temp2 + ")")
                                ;
                            } else if (item.scoreGiven != 0 && item.scoreReceived == 0) {
                                //give
                                layer1.append("path")
                                    .attr("id", "give-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.innerLinkX, Y: item.innerLinkY},
                                        {X: item.outerLinkX, Y: item.outerLinkY}
                                    ]))
                                    .attr("stroke", linkColor1)
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", "url(#arrow" + temp1 + ")")
                                ;
                            } else if (item.scoreGiven == 0 && item.scoreReceived != 0) {
                                //receive
                                layer1.append("path")
                                    .attr("id", "receive-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.outerLinkX, Y: item.outerLinkY},
                                        {X: item.innerLinkX, Y: item.innerLinkY}
                                    ]))
                                    .attr("stroke", linkColor2)
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", "url(#arrow" + temp2 + ")")
                                ;
                            }
                        });
                        break;
                }
            }

            drawLinks(visibility2);//draws the links; default is given

            var nodes = svgContainer.selectAll("node")
                .data(nodesData);

            var defs = nodes.enter().append('defs');


            defs.append('pattern')
                .attr('id', function (d) {
                    return (d.country.countryData.countryCode + "-icon");
                })
                .attr('class', "countryNodes")
                .attr('width', 1)
                .attr('height', 1)
                .attr('patternContentUnits', 'objectBoundingBox')
                .append("image")
                .attr("xlink:xlink:href", function (d) {
                    return ("./images/flags/" + d.country.countryData.image);
                })
                .attr("height", 1)
                .attr("width", 1)
                .attr("preserveAspectRatio", "xMinYMin slice");

            for (i = 0; i < 6; i++)
                createMaker(gradientArray[i], "arrow" + i);


            function createMaker(color, id) {
                defs.append("marker")
                    .attr("id", id)
                    .attr("refX", 4) /*must be smarter way to calculate shift*/
                    .attr("refY", 0)
                    .attr("markerWidth", 3)
                    .attr("markerHeight", 3)
                    .attr("orient", "auto")
                    .attr("viewBox", "-5 -5 10 10")
                    .append("path")
                    .attr("d", "M 0,0 m -5,-5 L 5,0 L -5,5 Z")
                    .attr("fill", color);
            }


            nodes.enter().append("circle")
                .attr("class", "node")
                .attr("cx", function (d) {
                    return d.X
                })
                .on("click", switchSelectedOnClick)
                .attr("cy", function (d) {
                    return d.Y
                })
                .attr("r", function (d) {
                    return d.R + 3
                })
                .style("fill", function (d) {
                    return ("url(#" + d.country.countryData.countryCode + "-icon)");
                })
                .style("stroke", function (d) {
                    switch (d.country.position) {
                        case 1:
                            return goldColour;
                        case 2:
                            return silverColour;
                        case 3:
                            return bronzeColour;
                        default:
                            return "none";
                    }
                })
                .style("stroke-width", function (d) {
                    return d.country.countryData.countryCode == selectedCountryCode ? "5px" : "3px";
                })
                .on("mouseenter", function (d) {
                    div.style("visibility", "visible");
                    div.transition()
                        .duration(200)
                        .style("opacity", .8);
                    if (d.country.countryData.countryCode == selectedCountryCode) {
                        div.html("<b>" + d.country.countryData.name + "</b> (#" + d.country.position + ")" +
                                "<br/>Totaal gekregen: " + d.country.totalScoreReceived
                            )
                            .style("top", event.pageY - 10 + "px")
                            .style("left", event.pageX + 10 + "px");
                    } else {
                        div.html("<b>" + d.country.countryData.name + "</b> (#" + d.country.position + ")"
                                + "<br/>Gekregen: " + scores[d.country.index][selectedCountryIndex]
                                + "<br/>Gegeven: " + scores[selectedCountryIndex][d.country.index] //TODO tekst aanpassen -> confusing
                            )
                            .style("top", event.pageY - 10 + "px")
                            .style("left", event.pageX + 10 + "px");
                    }

                })
                .on("mouseout", function (d) {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0)
                        .style("visibility", "hidden");

                });

            function switchSelectedOnClick(flag) {
                /* VB:
                 country = Object {countryCode: "IT", name: "Italië", neighbours: Array[6], image: "Italy.png"}
                 */
                $("#" + selectedCountryCode).toggleClass("selected-country");
                selectedCountryCode = flag.country.countryData.countryCode;
                $("#" + selectedCountryCode).toggleClass("selected-country");
                removeEverything();
                years.forEach(function (d) {
                    drawCluster(d, 0);
                });
                div.transition()
                    .duration(500)
                    .style("opacity", 0)
                    .style("visibility", "hidden");
            }
        }

        if (!countryInYear) {
            var noDataText;
            if (semiFinalsData.hasOwnProperty(chartYear) && $.inArray(selectedCountryCode, semiFinalsData[chartYear])) {
                noDataText = "Niet in finale"
            } else {
                noDataText = "Deed niet mee";
            }
            svgContainer.append('g').append("text").text(noDataText)
                .attr("id", "no-data-text")
                .attr("x", middlePoint.X - 80)
                .attr("y", middlePoint.Y)
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .attr("fill", "#ff6961");

            $('#yeartext-' + chartYear).hide();
        }
    }
}
