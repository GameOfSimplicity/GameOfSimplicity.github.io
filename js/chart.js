/**
 * Created by Michael on 13/04/2016.
 */

var svgContainers = {};
var averages = {};


$(".country-list").click(function () {
    var countrycode = $(this).attr("id");
    $("#"+selectedCountryCode).toggleClass("selected-country");
    $("#"+countrycode).toggleClass("selected-country");
    selectedCountryCode = countrycode;
    removeEverything();
    years.forEach(function (d) {
        drawCluster(d, 0);
    }); 
});


function addGraphPlaceholders(years) {
    const noOfColumns = 4;
    const columnWidth = 12 / noOfColumns;
    var container = document.getElementById('container');
    for (var i = 0; i < years.length; i++) {
        var year = years[i];
        /*if (i % noOfColumns === 0) {
         var newRow = document.createElement('div');
         newRow.className = 'row-fluid';
         container.appendChild(newRow);
         }*/
        container.innerHTML += '<div class="col-md-' + columnWidth + ' example" id="graph-' + year + '"></div>';
        document.getElementById('graph-' + year).innerHTML += '<div class="yeartext">' +
            year +
            ' Score: <span id="scoreText-' + year + '"></span>' +
            '<button type="button" class="smallButton" id="giveButton-' + year + '">given</button>' +
            '<button type="button" class="smallButton" id="receiveButton-' + year + '">received</button>' +
            '<button type="button" class="smallButton" id="bothButton-' + year + '">both</button>' +
            '</div>';
        document.getElementById('graph-' + year).innerHTML += '<div class="chart" id="draw-' + year + '"></div>';
        /*if (i % noOfColumns == 0 || i == 0) {
         document.getElementById('container').innerHTML += '</div>'
         }*/
    }
    container.innerHTML += '<img style="width: 300px; height: 300px;" src="http://emojipedia-us.s3.amazonaws.com/cache/bc/6f/bc6f71bfca5a45797cea82ac6f6b9864.png" alt="Crying Face">'
}

var years = [];
for (yearCounter = 1957; yearCounter < 2016; yearCounter++) {
    years.push(yearCounter);
}

var selectedCountryIndex = 0;
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
}


document.getElementById("allReceived").addEventListener("click", selectAllReceived);
function selectAllReceived() {

    removeEverything();
    years.forEach(function (d) {
        drawCluster(d, 1);
    });
}


document.getElementById("allGiven").addEventListener("click", selectAllGiven);
function selectAllGiven() {
    removeEverything();
    years.forEach(function (d) {
        drawCluster(d, 0);
    });
}


function drawCluster(chartYear, visibility2) {
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

    const giveColour = "#082f6d";
    const receiveColour = "#cd0027";
    const goldColour = "#ffd700";
    const silverColour ="#c0c0c0";
    const bronzeColour = "#cd7f32";

    const radiusCenter = 15;
    const radiusOuter = 10;
    const buffer1 = 25; // buffer between outer nodes
    const buffer2 = 25; // buffer between mid circle and outer circles
    var radius = radiusOuter + radiusCenter + buffer2; // radius of circle on which outer nodes should be drawn

    if (!(chartYear in svgContainers)) {
        var tempSvg = d3.select(chartId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        svgContainers[chartYear] = tempSvg;
    }

    var svgContainer = svgContainers[chartYear];

    var sortMethod = 1; //0 = none; 1 = neighbours ; 2 = score

    //load data from multiple json files async
    d3_queue.queue()
        .defer(d3.json, 'data/countries.json')
        .defer(d3.json, 'data/scores.json')
        .await(makeGraph);

    function calcGivenAverage(scoresData) {
        var total = 0;
        var amount = 0;
        scoresData.scores.forEach(function (generalScoreInfo) {
            generalScoreInfo.scores.forEach(function (arrayWithScores) {
                arrayWithScores.forEach(function (score) {
                    // if (score != 0) {
                    total += parseInt(score);
                    amount += 1;
                    //}
                })
            });
            averages[chartYear] = total / amount;

            total = 0;
            amount = 0;
        })

    }

    function makeGraph(error, countriesData, scoresData) {
        if (error) throw error;

        var makeGraph = false;

        //Get the results for the given year
        var yearResult = scoresData.scores.find(function (s) {
            return s.year == chartYear;
        });

        //Get the countries that participate this year
        countries = [];
        countriesData.countries.forEach(function (c) {
            var index = yearResult.participants.indexOf(c.countryCode);
            if (index > -1) {
                countries[index] = c;
                if (c.countryCode == selectedCountryCode) {
                    selectedCountryIndex = index;
                    makeGraph = true;
                }
            }
        });

        if (makeGraph) {
            if (typeof averages !== 'undefined') {
                calcGivenAverage(scoresData);
            }

            scores = yearResult.scores;

            //aantal gegeven punten
            var pointsCount = countries.length - 1;

            // hoek tussen landen
            var slice = 2 * Math.PI / pointsCount;

            //dynamically changes the radius
            var temp = pointsCount * (buffer1 + radiusOuter * 2);
            while (radius * Math.PI * 2 < temp) {
                radius += 20;
            }

            var links = [];


            //function sortCountries() {
            //    if (sortMethod == 0)
            //        countries.sort();
            //    else
            //        countries.sort(function (c1, c2) {
            //            if (sortMethod == 1) {
            //                //neighbours
            //                return selectedCountry.country.neighbours.indexOf(c1.countryCode) > -1 ? -1 : 1
            //            } else {
            //                //score
            //                //TODO
            //            }
            //        });
            //}
            //
            //sortCountries();

            selectedCountry = {
                index: selectedCountryIndex,
                country: countries[selectedCountryIndex],
                X: middlePoint.X,
                Y: middlePoint.Y,
                R: radiusCenter
            };

            nodesData.push(selectedCountry);

            var i = 0, j = 0;

            var temp = countries.slice();
            temp.splice(selectedCountryIndex, 1);

            //temp.sort(function (c) {
            //    //sorteren op neighbors
            //    if (selectedCountry.country.neighbours.indexOf(c.countryCode) > -1) {
            //        return -1;
            //    }
            //    return 1;
            //})
            temp.forEach(
                function (c) {
                    if (i == selectedCountryIndex)
                        i++;

                    var angle = slice * (j);
                    var isNeighour = selectedCountry.country.neighbours.indexOf(c.countryCode) > -1;

                    var outerCenterX = middlePoint.X + (isNeighour ? radius * .6 : radius) * Math.cos(angle);
                    var outerCenterY = middlePoint.Y + (isNeighour ? radius * .6 : radius) * Math.sin(angle);

                    var outerLinkX = middlePoint.X + ((isNeighour ? radius * .6 : radius) - radiusOuter) * Math.cos(angle);
                    var outerLinkY = middlePoint.Y + ((isNeighour ? radius * .6 : radius) - radiusOuter) * Math.sin(angle);

                    var innerLinkX = middlePoint.X + radiusCenter * Math.cos(angle);
                    var innerLinkY = middlePoint.Y + radiusCenter * Math.sin(angle);

                    // center between 2 links; x = (x1+x2)/2; y = (y1+y2)/2
                    var centerLinkX = (innerLinkX + outerLinkX) / 2;
                    var centerLinkY = (innerLinkY + outerLinkY) / 2;

                    nodesData.push({index: i, country: countries[i], X: outerCenterX, Y: outerCenterY, R: radiusOuter});

                    links.push({
                        innerLinkX: innerLinkX,
                        innerLinkY: innerLinkY,
                        outerLinkX: outerLinkX,
                        outerLinkY: outerLinkY,
                        centerLinkX: centerLinkX,
                        centerLinkY: centerLinkY,
                        scoreGiven: scores[j][selectedCountryIndex],
                        scoreReceived: scores[selectedCountryIndex][j],
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
                            if (item.scoreGiven != 0) {
                                layer1.append("path")
                                    .attr("id", "give-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.innerLinkX, Y: item.innerLinkY},
                                        {X: item.outerLinkX, Y: item.outerLinkY}
                                    ]))
                                    .attr("stroke", function () {
                                        var avg = averages[chartYear];
                                        if (parseFloat(item.scoreGiven) < averages[chartYear]) {
                                            //rood
                                            return "#C05746";
                                        } else {
                                            return "#69995D";
                                        }
                                    })
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", function () {
                                        var avg = averages[chartYear];
                                        if (parseFloat(item.scoreGiven) < averages[chartYear]) {
                                            //rood
                                            return "url(#giveArrowHeadRed)";
                                        } else {
                                            return "url(#giveArrowHeadGreen)";
                                        }
                                    })
                                    .on("mouseover", function () {
                                        document.getElementById("scoreText-" + chartYear).innerHTML = item.scoreGiven;
                                    })
                            }
                        });

                        break;
                    //receive
                    case 1:
                        links.forEach(function (item, index) {
                            if (item.scoreReceived != 0) {
                                layer1.append("path")
                                    .attr("id", "receive-" + chartYear)
                                    .attr("d", lineFunction([
                                        {X: item.outerLinkX, Y: item.outerLinkY},
                                        {X: item.innerLinkX, Y: item.innerLinkY}
                                    ]))
                                    .attr("stroke", function () {
                                        var avg = averages[chartYear];
                                        if (parseFloat(item.scoreReceived) < averages[chartYear]) {
                                            //rood
                                            return "#C05746";
                                        } else {
                                            return "#69995D";
                                        }
                                    })
                                    .attr("stroke-width", 4)
                                    .attr("fill", "none")
                                    .attr("marker-end", function () {
                                        var avg = averages[chartYear];
                                        if (parseFloat(item.scoreReceived) < averages[chartYear]) {
                                            //rood
                                            return "url(#receiveArrowHeadRed)";
                                        } else {
                                            return "url(#receiveArrowHeadGreen)";
                                        }
                                    })
                                    .on("mouseover", function () {
                                        document.getElementById("scoreText-" + chartYear).innerHTML = item.scoreGiven;
                                    });
                            }
                        });
                        break;
                    //both
                    case  2:
                        links.forEach(function (item, index) {
                            //give
                            layer1.append("path")
                                .attr("id", "give-" + chartYear)
                                .attr("d", lineFunction([
                                    {X: item.innerLinkX, Y: item.innerLinkY},
                                    {X: item.centerLinkX, Y: item.centerLinkY}
                                ]))
                                .attr("stroke", giveColour)
                                .attr("stroke-width", 4)
                                .attr("fill", "none")
                                .attr("marker-end", "url(#giveArrowHead)");
                            //receive
                            layer1.append("path")
                                .attr("id", "receive-" + chartYear)
                                .attr("d", lineFunction([
                                    {X: item.outerLinkX, Y: item.outerLinkY},
                                    {X: item.centerLinkX, Y: item.centerLinkY}
                                ]))
                                .attr("stroke", receiveColour)
                                .attr("stroke-width", 4)
                                .attr("fill", "none")
                                .attr("marker-end", "url(#receiveArrowHead)");
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
                    return (d.country.countryCode + "-icon");
                })
                .attr('class', "countryNodes")
                .attr('width', 1)
                .attr('height', 1)
                .attr('patternContentUnits', 'objectBoundingBox')
                .append("image")
                .attr("xlink:xlink:href", function (d) {
                    return ("./images/flags/" + d.country.image);
                })
                .attr("height", 1)
                .attr("width", 1)
                .attr("preserveAspectRatio", "xMinYMin slice");

            //rood
            createMaker("#C05746", "giveArrowHeadRed")
            //groen
            createMaker("#69995D", "giveArrowHeadGreen")
            //rood
            createMaker("#C05746", "receiveArrowHeadRed")
            //groen
            createMaker("#69995D", "receiveArrowHeadGreen")


            function createMaker(color, id) {
                defs.append("marker")
                    .attr("id", id)
                    .attr("refX", 4) /*must be smarter way to calculate shift*/
                    .attr("refY", 0)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 4)
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
                    return d.R + 3.5
                })
                .style("fill", function (d) {
                    return ("url(#" + d.country.countryCode + "-icon)");
                })
                //.style("stroke", "red")
                //.style("stroke-width", "2px")
            ;

            function switchSelectedOnClick(flag) {
                /* VB:
                 country = Object {countryCode: "IT", name: "Italië", neighbours: Array[6], image: "Italy.png"}
                 */
                selectedCountryCode = flag.country.countryCode;
                removeEverything();
                years.forEach(function (d) {
                    drawCluster(d, 0);
                });
            }

            //adds the buttons to choose the visible lines
            document.getElementById("giveButton-" + chartYear).onclick = function () {
                drawLinks(0);
            };
            document.getElementById("receiveButton-" + chartYear).onclick = function () {
                drawLinks(1);
            };
            document.getElementById("bothButton-" + chartYear).onclick = function () {
                drawLinks(2);
            };
        }
    }

}