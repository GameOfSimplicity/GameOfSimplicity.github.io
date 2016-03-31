function drawCluster(chartID) {
    //var width = $(document).width();
    var width = d3.select(chartID).node().getBoundingClientRect().width;
    //var height = $(document).height();
    var height = d3.select(chartID).node().getBoundingClientRect().height - 4;
    console.log("Row - Width: " + width + " height: " + height);
    var middlePoint = {X: width / 2, Y: height / 2};

    var countries = [];
    var nodesData = [];
    var linksData = [];
    var selectedCountry;

    var radiusCenter = 50;
    var radiusOuter = 20;
    var buffer1 = 5; // buffer between outer nodes
    var buffer2 = 25; // buffer between mid circle and outer circles
    var radius = radiusOuter + radiusCenter + buffer2; // radius of circle on which outer nodes should be drawn

    var svgContainer = d3.select(chartID)
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
            selectedCountry = {country: countries[0], X: middlePoint.X, Y: middlePoint.Y, R: radiusCenter};

            // selected country
            nodesData.push(selectedCountry);

            var i = 1;
            countries.slice(1, countries.length).forEach(
                function (c) {
                    angle = slice * (i - 1);
                    X = middlePoint.X + (selectedCountry.country.neighbours.indexOf(c) != -1 ? radius : radius * 2) * Math.cos(angle);
                    Y = middlePoint.Y + (selectedCountry.country.neighbours.indexOf(c) != -1 ? radius : radius * 2) * Math.sin(angle);

                    nodesData.push({country: countries[i], X: X, Y: Y, R: radiusOuter});
                    //Heen
                    linksData.push({source: 0, target: i, score: 50});

                    //Terug, ff weggelate
                    //linksData.push({source: i, target: 0, score: 25});
                    i++;

                });

            var links = svgContainer.selectAll("link")
                .data(linksData);


            //Path maken
            var pathData = [];

            linksData.forEach(function (item, index) {
                var targetNode = nodesData[item.target]
                pathData.push([
                    {
                        "x": selectedCountry.X,
                        "y": selectedCountry.Y
                    }, {
                        "x": targetNode.X,
                        "y": targetNode.Y
                    }])
            })
            console.log(pathData);

            //is nodig om naar path the gaan peisnk
            var lineFunction = d3.svg.line()
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                });


            pathData.forEach(function (item, index) {
                svgContainer.append("path")
                    .attr("d", lineFunction(item))
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("fill", "none");
            });


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

            nodes.enter().append('defs')
                .append('pattern')
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
        }
    );
}
