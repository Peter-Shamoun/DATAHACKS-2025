import React, { useEffect, useRef } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import * as d3 from 'd3';

interface DataPoint {
  x: number;
  y: number;
}

interface TrendGraphProps {
  data?: DataPoint[];
}

const sampleData: DataPoint[] = [
  { x: 2015, y: 5 }, { x: 2016, y: 9 },
  { x: 2017, y: 7 }, { x: 2018, y: 5 },
  { x: 2019, y: 3 }, { x: 2020, y: 4 },
  { x: 2021, y: 6 }, { x: 2022, y: 7 },
  { x: 2023, y: 8 }, { x: 2024, y: 6 },
  { x: 2025, y: 7 }
];

const sampleData2: DataPoint[] = [
  { x: 2015, y: 45 }, { x: 2016, y: 65 },
  { x: 2017, y: 35 }, { x: 2018, y: 80 },
  { x: 2019, y: 55 }, { x: 2020, y: 70 },
  { x: 2021, y: 40 }, { x: 2022, y: 60 },
  { x: 2023, y: 75 }, { x: 2024, y: 50 },
  { x: 2025, y: 65 }
];

const TrendGraph: React.FC<TrendGraphProps> = ({ data = sampleData }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Define dimensions and margins
    const margin = { top: 20, right: 70, bottom: 40, left: 70 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([2015, 2025])
      .range([0, width]);

    const yScale1 = d3.scaleLinear()
      .domain([-10, 10])
      .range([height, 0]);

    const yScale2 = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => d.toString())
      .ticks(11); // Show all years

    const yAxisLeft = d3.axisLeft(yScale1);
    const yAxisRight = d3.axisRight(yScale2);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g')
      .call(yAxisLeft);

    svg.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(yAxisRight);

    // Add x-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Year');

    // Add left y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -(height / 2))
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Public Sentiment');

    // Add right y-axis label
    svg.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -width - margin.right + 20)
      .attr('x', height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Popularity Score');

    // Create area generators
    const area1 = d3.area<DataPoint>()
      .x(d => xScale(d.x))
      .y0(height)  // Always extend to bottom of chart
      .y1(d => yScale1(d.y));

    const area2 = d3.area<DataPoint>()
      .x(d => xScale(d.x))
      .y0(height)  // Always extend to bottom of chart
      .y1(d => yScale2(d.y));

    // Create line generators
    const line1 = d3.line<DataPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale1(d.y));

    const line2 = d3.line<DataPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale2(d.y));

    // Add the areas (shading)
    svg.append('path')
      .datum(data)
      .attr('fill', 'steelblue')
      .attr('fill-opacity', 0.5)
      .attr('d', area1);

    svg.append('path')
      .datum(sampleData2)
      .attr('fill', 'green')
      .attr('fill-opacity', 0.2)
      .attr('d', area2);

    // Add the lines
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line1);

    svg.append('path')
      .datum(sampleData2)
      .attr('fill', 'none')
      .attr('stroke', 'green')
      .attr('stroke-width', 2)
      .attr('d', line2);

    // Add threshold line at y = 0 for the first scale
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale1(0))
      .attr('y2', yScale1(0))
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4');

  }, [data]);

  const LegendItem = ({ color, label }: { color: string, label: string }) => {
    const getTooltipContent = (label: string) => {
      switch (label) {
        case 'Public Sentiment':
          return 'Public sentiment score calculated from social media analysis (40%), news sentiment (30%), public comments (20%), and engagement metrics (10%). Range: -10 to +10.';
        case 'Popularity Score':
          return 'Popularity score based on social media following, media mentions, search trends, and public engagement rates. Range: 0 to 100.';
        default:
          return '';
      }
    };

    return (
      <Tooltip 
        title={
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '0.875rem', p: 1 }}>
            {getTooltipContent(label)}
          </Typography>
        }
        arrow
        placement="top"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, cursor: 'help' }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              backgroundColor: color,
              opacity: 0.2,
              border: `2px solid ${color}`,
              mr: 1
            }}
          />
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '0.875rem' }}>
            {label}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ width: '100%', height: 300, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#3d2a1d' }}>
          Evaluation of Public Sentiment & Popularity
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LegendItem color="steelblue" label="Public Sentiment" />
          <LegendItem color="green" label="Popularity Score" />
        </Box>
      </Box>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default TrendGraph; 