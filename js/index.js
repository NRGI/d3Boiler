'use strict';
//MULTI-LINE d3 boilerplate
//var d3;

var datafile = "./data/data.csv";
var category_init = "Algeria";
var citation_text = "Citation Text";
var citation_url = "#";
var color_sel = "NRGI"; // OPTS: NRGI, -- default is cat 10
var category_header = "country";
var y_axis_text = "Billions national currency";
var date_format = "%Y";
//TODO set max dims for elements
var MAX_WIDTH = 1200,
    MAX_HEIGHT = 700;

var parseDate = d3.time.format("%Y").parse;
var formatPercent = d3.format(".0%");

var line = d3.svg.line()
    .interpolate("basis")
    .x(function (d) { return xScale(d.year); })
    .y(function (d) { return yScale(d.value); });

var viewerWidth = parseInt(d3.select("#main").style("width")),
    viewerHeight = parseInt(d3.select("#main").style("height"));

var margin = {top: 20, right: 80, bottom: 60, left: 75},
    width = viewerWidth - margin.left - margin.right,
    height = viewerHeight - margin.top - margin.bottom;

var xScale = d3.time.scale()
    .range([0, width])
    .nice(d3.time.year);

var yScale = d3.scale.linear()
    .range([height, 0])
    .nice();

var color;
switch(color_sel) {
    case "NRGI":
        color = d3.scale.ordinal()
            .range(["#4f7184", "#ff6f4a"]);
        break;
    default:
        console.log("no color scale selected -- assigning cat10")
        color = d3.scale.category10();
}

var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");


var chart = d3.select("#main").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom - 30)
    .append("g")
    .attr("id", "container")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv(datafile, function (error, data) {
    if (error) throw error;

    var data_init,
        opts = [],
        cat_names = [];
    //TODO figure out how to deal with this programatically
    data.sort(function (a, b) {
        return a.year - b.year;
    });
    data.forEach(function(d) {
        d.year = parseDate(d.year);
        if (opts.indexOf(d.country) < 0) {
            opts.push(d.country);
        }
    });
    opts.sort();

    if (category_init === "") {
        data_init = data.filter(function (d) { return (d.country === data[0][category_header]); });
    } else {
        data_init = data.filter(function (d) { return (d.country === category_init); });
    }

    //TODO figure out how to deal with this programatically
    color.domain(d3.keys(data_init[0]).filter(function(key) { return key !== "year" && key !== 'country' && key !== 'iso';  }));
    //TODO figure out how to deal with this programatically
    var variables = color.domain().map(function(name) {
        if (name !== 'country' || name !== 'iso') {
            return {
                name: name,
                values: data_init.map(function(d) {
                    return {year: d.year, value: +d[name]};
                })
            };
        }
    });
    //TODO figure out how to deal with this programatically
    xScale.domain(d3.extent(data_init, function(d) { return d.year; }));
    //TODO figure out how to deal with this programatically
    yScale.domain([0, d3.max(variables, function(c) { return d3.max(c.values, function(v) { return v.value; }); })]);

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(y_axis_text);

    var variable = chart.selectAll(".variable")
        .data(variables)
        .enter().append("g")
        .attr("class", "variable");

    variable.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return color(d.name); });
    //TODO make citation responsive
    d3.select("#main").append("div")
        .attr("class", "citation")
        .style("width", width + "px")
        .html("<small><em>Graphic by: Chris Perry | Source: <a href='" + citation_url + "' target='_blank'>" + citation_text + "</a></em></small>");

    var legend = chart.selectAll(".legend")
        .data(variables)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(-"+ width * .85 + "," + i * 20 + ")"; });

    legend.append('circle')
        .attr('cx', width - 24)
        .attr('cy', 20)
        .attr('r', 7)
        .style('fill', function(d) { return color(d.name); });
    legend.append("text")
        .attr("x", width - 10)
        .attr("y", 20)
        .attr("dy", ".35em")
        .text(function (d) { return d.name; });

    var dropdown = d3.select("#dropdown").append("select")
        .attr("class", "form-control")
        .on("change", function change() {
            var value = this.value;
            d3.csv(datafile, function (error, data) {
                if (error) throw error;

                data.sort(function (a, b) {
                    return a.year - b.year;
                });

                data.forEach(function(d) {
                    d.year = parseDate(d.year);
                });

                data_init = data.filter(function (d) { return (d.country === value); });

                color.domain(d3.keys(data_init[0]).filter(function(key) { return key !== "year" && key !== 'country' && key !== 'iso';  }));

                variables = color.domain().map(function(name) {
                    if (name !== 'country' || name !== 'iso') {
                        return {
                            name: name,
                            values: data_init.map(function(d) {
                                return {year: d.year, value: +d[name]};
                            })
                        };
                    }
                });

                xScale.domain(d3.extent(data_init, function(d) { return d.year; }));
                yScale.domain([
                    d3.min(variables, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
                    d3.max(variables, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
                ]);
                var svg = d3.select("body").transition();

                variable.select(".line")
                    .data(variables)
                    .transition()
                    .duration(750)
                    .attr("d", function(d) { return line(d.values); });

                svg.select(".x.axis") // change the x axis
                    .duration(750)
                    .call(xAxis);
                svg.select(".y.axis") // change the y axis
                    .duration(750)
                    .call(yAxis);
            });
        });

    var options = dropdown.selectAll("option")
        .data(opts)
        .enter()
        .append("option")
        .property("selected", function (d) { return d === category_init; });
    options.text(function (d) { return d; })
        .attr("value", function (d) { return d; });


    //TODO figure out expansion limits; fix resize after new selection
    function resize() {
        width = parseInt(d3.select("#main").style("width")) - margin.left - margin.right;
        height = parseInt(d3.select("#main").style("height")) - margin.top - margin.bottom;

        xScale.range([0, width]).nice(d3.time.year);
        yScale.range([height, 0]).nice();
        yScale.domain([
            d3.min(variables, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
            d3.max(variables, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
        ]);

        yAxis.ticks(Math.max(height/50, 2));
        xAxis.ticks(Math.max(width/50, 2));

        chart.selectAll(".legend")
            .transition()
            .duration(150)
            .attr("transform", function (d, i) { return "translate(-"+ width * .85 + "," + i * 20 + ")"; });

        legend.selectAll('circle')
            .transition()
            .duration(150)
            .attr('cx', width - 24);

        legend.selectAll("text")
            .transition()
            .duration(150)
            .attr("x", width - 10);

        chart.select('.x.axis')
            .transition()
            .duration(150)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        chart.select('.y.axis')
            .transition()
            .duration(150)
            .call(yAxis);
        //TODO make citation responseiv
        //d3.selectAll(".citation").append("div")
        //    .style("width", width + "px");

        variable.select(".line")
            .transition()
            .duration(150)
            .attr("d", function(d) { return line(d.values); });
    }

    d3.select(window).on('resize', resize);

    resize();

});
