/**
 * Created by Michael on 13/04/2016.
 */
var graphs;


function drawCluster(chartYear) {
    var chartId = "#draw-" + chartYear;
    //var width = $(document).width();
    var width = d3.select(chartId).node().getBoundingClientRect().width;
    //var height = $(document).height();
    var height = d3.select(chartId).node().getBoundingClientRect().height - 4;
    console.log("Row - Width: " + width + " height: " + height);
    var middlePoint = {X: width / 2, Y: height / 2};

    var countries = [];
    var nodesData = [];
    var selectedCountry;

    const giveColour = "#082f6d";
    const receiveColour = "#cd0027";
    const radiusCenter = 50;
    const radiusOuter = 20;
    const buffer1 = 80; // buffer between outer nodes
    const buffer2 = 25; // buffer between mid circle and outer circles
    var radius = radiusOuter + radiusCenter + buffer2; // radius of circle on which outer nodes should be drawn

    var svgContainer = d3.select(chartId)
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    d3.json("data/countries.json", function (error, data) {
        if (error) throw error;

        countries = data.countries;

        //aantal gegeven punten
        var pointsCount = countries.length - 1;

        // hoek tussen landen
        var slice = 2 * Math.PI / pointsCount;

        //dynamically changes the radius
        var temp = pointsCount * (buffer1 + radiusOuter * 2);
        while (radius * Math.PI * 2 < temp) {
            radius += 20;
        }

        //België
        selectedCountry = {
            country: countries[0],
            X: middlePoint.X,
            Y: middlePoint.Y,
            R: radiusCenter
        };

        function getScores(selectedCountry, otherCountry) {
            return [50, 50];
        }

        // selected country
        nodesData.push(selectedCountry);

        var links = [];

        var i = 1;
        countries.slice(1, countries.length).forEach(
            //calc absolute pixels
            function (c) {
                var angle = slice * (i - 1);
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

                nodesData.push({country: countries[i], X: outerCenterX, Y: outerCenterY, R: radiusOuter});

                var scores = getScores(selectedCountry, countries[i]);
                links.push({
                    innerLinkX: innerLinkX,
                    innerLinkY: innerLinkY,
                    outerLinkX: outerLinkX,
                    outerLinkY: outerLinkY,
                    centerLinkX: centerLinkX,
                    centerLinkY: centerLinkY,
                    scoreGiven: scores[0],
                    scoreReceived: scores[1]
                });

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
                        layer1.append("path")
                            .attr("id", "give-" + chartYear)
                            .attr("d", lineFunction([
                                {X: item.innerLinkX, Y: item.innerLinkY},
                                {X: item.outerLinkX, Y: item.outerLinkY}
                            ]))
                            .attr("stroke", giveColour)
                            .attr("stroke-width", 2)
                            .attr("fill", "none")
                            .attr("marker-end", "url(#giveArrowHead)");
                    });
                    break;
                //receive
                case 1:
                    links.forEach(function (item, index) {
                        layer1.append("path")
                            .attr("id", "receive-" + chartYear)
                            .attr("d", lineFunction([
                                {X: item.outerLinkX, Y: item.outerLinkY},
                                {X: item.innerLinkX, Y: item.innerLinkY}
                            ]))
                            .attr("stroke", receiveColour)
                            .attr("stroke-width", 2)
                            .attr("fill", "none")
                            .attr("marker-end", "url(#receiveArrowHead)");
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
                            .attr("stroke-width", 2)
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
                            .attr("stroke-width", 2)
                            .attr("fill", "none")
                            .attr("marker-end", "url(#receiveArrowHead)");
                    });
                    break;
            }


        }

        drawLinks(0);//draws the links; default is given

        var nodes = svgContainer.selectAll("node")
            .data(nodesData);

        var defs = nodes.enter().append('defs');

        defs.append('pattern')
            .attr('id', function (d) {
                return (d.country.countryCode + "-icon");
            })
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


        defs.append("marker")
            .attr("id", "giveArrowHead")
            .attr("refX", 4) /*must be smarter way to calculate shift*/
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .attr("viewBox", "-5 -5 10 10")
            .append("path")
            .attr("d", "M 0,0 m -5,-5 L 5,0 L -5,5 Z")
            .attr("fill", giveColour);

        defs.append("marker")
            .attr("id", "receiveArrowHead")
            .attr("refX", 4) /*must be smarter way to calculate shift*/
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .attr("viewBox", "-5 -5 10 10")
            .append("path")
            .attr("d", "M 0,0 m -5,-5 L 5,0 L -5,5 Z")
            .attr("fill", receiveColour);


        nodes.enter().append("circle")
            .attr("class", "node")
            .attr("cx", function (d) {
                return d.X
            })
            .attr("cy", function (d) {
                return d.Y
            })
            .attr("r", function (d) {
                return d.R + 3.5
            })
            .style("fill", function (d) {
                return ("url(#" + d.country.countryCode + "-icon)");
            })
            .style("stroke", "10px solid black");

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
    });
}