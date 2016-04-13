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
    var giveLinksData = [];
    var receiveLinksData = [];
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

        // selected country
        nodesData.push(selectedCountry);

        var i = 1;
        countries.slice(1, countries.length).sort(function (c) {
            //first sort from neighbor to not-neighbor
            var isNeighour = selectedCountry.country.neighbours.indexOf(c.countryCode) > -1;
            if (isNeighour) {
                return -1;
            } else {
                return 1;
            }
        }).forEach(
            //calc absolute pixels
            function (c) {
                var angle = slice * (i - 1);
                var isNeighour = selectedCountry.country.neighbours.indexOf(c.countryCode) > -1;
                var X = middlePoint.X + (isNeighour ? radius * .6 : radius) * Math.cos(angle);
                var Y = middlePoint.Y + (isNeighour ? radius * .6 : radius) * Math.sin(angle);

                nodesData.push({country: countries[i], X: X, Y: Y, R: radiusOuter});

                giveLinksData.push({source: 0, target: i, score: 50});
                receiveLinksData.push({source: 0, target: i, score: 50});
                i++;
            });

        var giveLinks = svgContainer.selectAll("giveLinks").data(giveLinksData);
        var receiveLinks = svgContainer.selectAll("receiveLinks").data(receiveLinksData);


        //Path maken
        // TODO: onderscheiden tussen : enkel receive / enkel give / beide / geen relatie
        var givePathData = [];
        var givePathDataMid = [];
        var receivePathData = [];
        var receivePathDataMid = [];
        // middelpunt; x = (x1+x2)/2, y = (y1+y2)/2
        // TODO: rekening houden met radius van cirkels
        receiveLinksData.forEach(function (item, index) {
            var targetNode = nodesData[item.target];
            var xMid = (selectedCountry.X + targetNode.X) / 2;
            var yMid = (selectedCountry.Y + targetNode.Y) / 2;
            receivePathDataMid.push([
                {
                    "x": targetNode.X,
                    "y": targetNode.Y
                }, {
                    "x": xMid,
                    "y": yMid
                }
            ])
        });

        receiveLinksData.forEach(function (item, index) {
            var targetNode = nodesData[item.target];
            receivePathData.push([
                {
                    "x": targetNode.X,
                    "y": targetNode.Y
                }, {
                    "x": selectedCountry.X,
                    "y": selectedCountry.Y
                }
            ])
        });

        giveLinksData.forEach(function (item, index) {
            var targetNode = nodesData[item.target];
            var xMid = (selectedCountry.X + targetNode.X) / 2;
            var yMid = (selectedCountry.Y + targetNode.Y) / 2;
            givePathDataMid.push([
                {
                    "x": selectedCountry.X,
                    "y": selectedCountry.Y
                }, {
                    "x": xMid,
                    "y": yMid
                }])
        });

        giveLinksData.forEach(function (item, index) {
            var targetNode = nodesData[item.target];
            var xMid = (selectedCountry.X + targetNode.X) / 2;
            var yMid = (selectedCountry.Y + targetNode.Y) / 2;
            givePathData.push([
                {
                    "x": selectedCountry.X,
                    "y": selectedCountry.Y
                }, {
                    "x": targetNode.X,
                    "y": targetNode.Y
                }])
        });


        var lineFunction = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            });


        var layer1 = svgContainer.append('g');
        var layer2 = svgContainer.append('g');

        var showGiveMid = function () {
            givePathDataMid.forEach(function (item, index) {
                layer1.append("path")
                    .attr("id","giveMid-" + chartYear)
                    .attr("d", lineFunction(item))
                    .attr("stroke", giveColour)
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .attr("marker-end", "url(#giveArrowHead)");
            });
        };

        var showGive = function () {
            givePathData.forEach(function (item, index) {
                layer1.append("path")
                    .attr("id","give-" + chartYear)
                    .attr("d", lineFunction(item))
                    .attr("stroke", giveColour)
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .attr("marker-end", "url(#giveArrowHead)");
            });
        };


        var showReceiveMid = function () {
            receivePathDataMid.forEach(function (item, index) {
                layer1.append("path")
                    .attr("id","receiveMid-" + chartYear)
                    .attr("d", lineFunction(item))
                    .attr("stroke", receiveColour)
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .attr("fill", "none")
                    .attr("marker-end", "url(#receiveArrowHead)");
            });
        };

        var showReceive = function () {
            receivePathData.forEach(function (item, index) {
                layer1.append("path")
                    .attr("id","receive-" + chartYear)
                    .attr("d", lineFunction(item))
                    .attr("stroke", receiveColour)
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .attr("fill", "none")
                    .attr("marker-end", "url(#receiveArrowHead)");
            });
        };


        showGiveMid();
        showReceiveMid();


        /*
         links.enter()
         .append("line")
         .attr("class", "link")
         .attr("x1", function (l) {
         var sourceNode = nodesData.filter(function (d, i) {
         return i == l.source
         })[0];
         d3.select(this).attr("y1", sourceNode.Y);
         return sourceNode.X
         })
         .attr("x2", function (l) {
         var targetNode = nodesData.filter(function (d, i) {
         return i == l.target
         })[0];
         d3.select(this).attr("y2", targetNode.Y);
         return targetNode.X
         });
         */

        /*
         .attr("d", function (d) {
         var dx = d.target.x - d.source.x,
         dy = d.target.y - d.source.y,
         dr = Math.sqrt(dx * dx + dy * dy);
         return "M" +
         d.source.x + "," +
         d.source.y + "A" +
         dr + "," + dr + " 0 0,1 " +
         d.target.x + "," +
         d.target.y;
         });
         */


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
            .attr("refX", 6 + 3) // must be smarter way to calculate shift
            .attr("refY", 2)
            .attr("markerWidth", 6)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0,0 V 4 L6,2 Z")
            .attr("fill", giveColour);

        defs.append("marker")
            .attr("id", "receiveArrowHead")
            //  .attr("refX", 6 + 3) // must be smarter way to calculate shift
            .attr("refY", 2)
            .attr("markerWidth", 6)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 V 4 L 6 2 Z")
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
                return d.R
            })
            .style("fill", function (d) {
                return ("url(#" + d.country.countryCode + "-icon)");
            });


        var removeLinesFromYear = function (year) {
            d3.selectAll("#receiveMid-" + year).remove();
            d3.selectAll("#receive-" + year).remove();
            d3.selectAll("#giveMid-" + year).remove();
            d3.selectAll("#give-" + year).remove();
        }

        document.getElementById("giveButton-" + chartYear).onclick = function(){
            removeLinesFromYear(chartYear);
            showGive();
        }

        
        document.getElementById("receiveButton-" + chartYear).onclick = function(){
            removeLinesFromYear(chartYear);
            showReceive();
        }

        document.getElementById("bothButton-" + chartYear).onclick = function(){
            removeLinesFromYear(chartYear);
            showGiveMid();
            showReceiveMid();
        }
    });
}
