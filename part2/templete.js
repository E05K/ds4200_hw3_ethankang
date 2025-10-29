// (1) Part 1.1 Boxplot
// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG, and inner drawing area
    const margin = { top: 40, right: 30, bottom: 60, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3
      .select("#boxplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    // You can use the range 0 to 1000 for the number of Likes, or if you want, you can use
    // d3.min(data, d => d.Likes) to achieve the min value and 
    // d3.max(data, d => d.Likes) to achieve the max value
    // For the domain of the xscale, you can list all three age groups or use
    // [...new Set(data.map(d => d.AgeGroup))] to achieve a unique list of the age group
    // Add scales     

    // Scales for x (categorical: AgeGroup) and y (numeric: Likes)
    const xScale = d3
      .scaleBand()
      .domain([...new Set(data.map((d) => d.AgeGroup))]) // unique age groups
      .range([0, width])
      .paddingInner(0.4)
      .paddingOuter(0.3);

    // Add y-axis label
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.Likes)]) // could also use [0,1000] as noted
      .nice()
      .range([height, 0]);
    
    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g").call(d3.axisLeft(yScale));

    // Axis labels
    svg
      .append("text")       // x-axis label
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Age Group");

    svg
      .append("text")       // y-axis label
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text("Number of Likes");

    // Compute boxplot statistics
    const rollupFunction = function (groupData) {
      const values = groupData.map((d) => d.Likes).sort(d3.ascending);
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const min = d3.min(values);
      const max = d3.max(values);
      return { min, q1, median, q3, max };
  };

    // Group + Compute Stats:
    // d3.rollup groups the full dataset by AgeGroup and, for each group,
    // applies rollupFunction, returning a Map: AgeGroup -> {min,q1,median,q3,max}
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

    // Iterate through Groups:
    quantilesByGroups.forEach((quantiles, AgeGroup) => {
      const x = xScale(AgeGroup);
      const boxWidth = xScale.bandwidth();

      
      // Vertical "whisker" line from min to max
      svg
        .append("line")
        .attr("x1", x + boxWidth / 2)
        .attr("x2", x + boxWidth / 2)
        .attr("y1", yScale(quantiles.min))
        .attr("y2", yScale(quantiles.max))
        .attr("stroke", "black");

      // Box for the IQR (q1 to q3)
      svg
        .append("rect")
        .attr("x", x)
        .attr("y", yScale(quantiles.q3))
        .attr("width", boxWidth)
        .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("fill", "#add8e6");

      // Median line
      svg
        .append("line")
        .attr("x1", x)
        .attr("x2", x + boxWidth)
        .attr("y1", yScale(quantiles.median))
        .attr("y2", yScale(quantiles.median))
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    });

    // Title (optional)
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Distribution of Likes by Age Group");
});

// (2)
// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
// Side-by-side bar plot from RAW socialMedia.csv
// We will compute AvgLikes = mean(Likes) for each (Platform, PostType)
const socialMediaAvg = d3.csv("socialMedia.csv")

socialMediaAvg.then(function(Data) {
    // Convert string values to numbers
    Data.forEach(d => { d.Likes = +d.Likes; });


    // Group and summarize the data:
    // Calculate AvgLikes = mean(Likes) for each (Platform, PostType)
    const summarized = d3.rollups(
      Data,
      v => d3.mean(v, d => d.Likes),
      d => d.Platform,
      d => d.PostType
    );

    // Flatten into an array of objects
    const data = summarized.flatMap(([Platform, inner]) =>
      inner.map(([PostType, avg]) => ({
        Platform,
        PostType,
        AvgLikes: +avg.toFixed(2)
      }))
    );

    // Define the dimensions and margins for the SVG
    const margin = { top: 50, right: 150, bottom: 60, left: 60};
    const width  = 700 - margin.left - margin.right;
    const height = 420 - margin.top  - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
      .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // y is numeric for AvgLikes; color is categorical for PostType
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    // unique lists for domains
    const platforms = [...new Set(data.map(d => d.Platform))];   // x0 domain
    const postTypes = [...new Set(data.map(d => d.PostType))];   // x1 & color domains

    // x0: platform bands across the whole width
    const x0 = d3.scaleBand()
      .domain(platforms)
      .range([0, width])
      .paddingInner(0.2)
      .paddingOuter(0.1);

    // x1: post type bands inside each platform band
    const x1 = d3.scaleBand()
      .domain(postTypes)
      .range([0, x0.bandwidth()])
      .padding(0.1);
      
    // y: numeric scale for average likes
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)])
      .nice()
      .range([height, 0]);
      
    // Color: one color per post type (provided palette)
    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    // Image, Link, Video (or your order)
         
    // Add scales x0 and y     
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Axis labels
    // Add x-axis label
    svg.append("text") // x-axis label
      .attr("x", width / 2)
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .text("Platform");

    // Add y-axis label
    svg.append("text") // y-axis label
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .text("Average Likes");

    // Group the data by platform so we can draw side-by-side bars for each post type
    const byPlatform = d3.group(data, d => d.Platform);

    // One <g> per platform, positioned by x0 (group containers for bars)
    const platformG = svg.selectAll(".platform")
      .data(platforms)
      .enter()
      .append("g")
        .attr("class", "platform")
        .attr("transform", d => `translate(${x0(d)},0)`);

    // Draw bars
    platformG.selectAll("rect")
    .data(p => byPlatform.get(p))  // rows for this platform
    .enter()
    .append("rect")
      .attr("x",  d => x1(d.PostType))
      .attr("y",  d => y(d.AvgLikes))
      .attr("width",  x1.bandwidth())
      .attr("height", d => height - y(d.AvgLikes))
      .attr("fill",   d => color(d.PostType));
      
    // Optional title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Average Likes by Platform and Post Type");

    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 15}, 0)`);

    const legendItem = legend.selectAll(".legend-item")
      .data(postTypes)
      .enter()
      .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 22})`);

    // Alread have the text information for the legend. 
    // Now add a small square/rect bar next to the text with different color.
      // small color square
      legendItem.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("y", -10)
        .attr("fill", d => color(d))
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);

      // label text
      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("alignment-baseline", "middle")
        .text(d => d);
});

// (3) Line plot from RAW socialMedia.csv
// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 
const socialMediaTime = d3.csv("socialMedia.csv");

// Compute AvgLikes = mean(Likes) for each Date
socialMediaTime.then(function(Data) {

    // Convert string values to numbers
    Data.forEach(d => {
      d.Likes = +d.Likes;
      d.Date = d.Date; // keep as string for labeling, or parse if needed
    });

    // Group and summarize: AvgLikes per Date
    const summarized = d3.rollups(
      Data,
      v => d3.mean(v, d => d.Likes),
      d => d.Date
    );

    // Flatten into array of {Date, AvgLikes}
    const data = summarized.map(([Date, AvgLikes]) => ({
      Date,
      AvgLikes: +AvgLikes.toFixed(2)
    }));

    // Define the dimensions and margins for the SVG
    const margin = { top: 50, right: 80, bottom: 80, left: 60 };
    const width  = 700 - margin.left - margin.right;
    const height = 420 - margin.top  - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#lineplot")
      .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    // x axes  
    const x = d3.scaleBand()
      .domain(data.map(d => d.Date))
      .range([0, width])
      .padding(0.2);

    // y axes
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)])
      .nice()
      .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-25)");

    svg.append("g")
      .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")     // x-axis label
      .attr("x", width / 2)
      .attr("y", height + 60)
      .attr("text-anchor", "middle")
      .text("Date");

    // Add y-axis label
    svg.append("text")    // y-axis label
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("Average Likes");

    // Draw the line and path. Remember to use curveNatural. 
    // line path generator
    const line = d3.line()
      .x(d => x(d.Date) + x.bandwidth() / 2)
      .y(d => y(d.AvgLikes))
      .curve(d3.curveNatural);

    // Draw the line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2)
      .attr("d", line);
    
    // Add small circles for each data point
    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
        .attr("cx", d => x(d.Date) + x.bandwidth() / 2)
        .attr("cy", d => y(d.AvgLikes))
        .attr("r", 4)
        .attr("fill", "#ff7f0e");

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Average Likes Over Time");
});
