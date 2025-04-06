import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Tooltip, CircularProgress } from '@mui/material';
import * as d3 from 'd3';
import { DataPoint } from '../types/DataPoint';
import { fetchTrendsData } from '../utils/trendsService';
import { fetchSentimentData, SentimentDataPoint } from '../utils/sentimentService';

interface TrendGraphProps {
  celebrityName?: string;
  popularityThreshold?: number; // Threshold for filtering years
}

const TrendGraph: React.FC<TrendGraphProps> = ({ 
  celebrityName,
  popularityThreshold = 5 // Default threshold
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [trendsData, setTrendsData] = useState<DataPoint[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{x: number, y: number, content: string} | null>(null);

  // Fetch trends and sentiment data when celebrity name changes
  useEffect(() => {
    const loadData = async () => {
      if (!celebrityName) return;
      
      setLoading(true);
      setError(null);
      try {
        // Fetch both datasets in parallel
        const [trendData, sentData] = await Promise.all([
          fetchTrendsData(celebrityName),
          fetchSentimentData(celebrityName)
        ]);
        
        console.log(`TrendGraph received trend data for ${celebrityName}:`, trendData);
        console.log(`TrendGraph received sentiment data for ${celebrityName}:`, sentData);
        
        // Set the trends data regardless of length
        setTrendsData(trendData);
        setSentimentData(sentData);
        
        // Only set error if both datasets are empty AND we didn't find any match
        if (trendData.length === 0 && sentData.length === 0) {
          setError(`No data available for ${celebrityName}`);
        } else {
          // Make sure to clear any existing error if we have data
          setError(null);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [celebrityName]);

  useEffect(() => {
    if (!svgRef.current || (!trendsData.length && !sentimentData.length)) return;

    console.log(`Rendering chart with ${trendsData.length} trend data points and ${sentimentData.length} sentiment data points`);

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

    // Use a fixed range for x-axis to ensure consistency across all celebrities
    // This ensures the full timeline is always displayed
    const minYear = 2004;
    const maxYear = new Date().getFullYear(); // Current year

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, width]);

    const yScale1 = d3.scaleLinear()
      .domain([-10, 10])
      .range([height, 0]);

    // Determine y-axis range for trends data
    // Provide a fallback in case trendsData is empty
    const defaultMaxTrendValue = 50; // A reasonable default if no trend data
    const trendValues = trendsData.length > 0 ? trendsData.map(d => d.y) : [defaultMaxTrendValue];
    const maxTrendValue = Math.max(...trendValues, 5); // Ensure minimum scale of 5
    const yMax = Math.min(100, Math.max(Math.ceil(maxTrendValue * 1.2), 10)); // Scale appropriately with ceiling of 100
    
    const yScale2 = d3.scaleLinear()
      .domain([0, yMax])
      .range([height, 0]);

    // Create layers for organizing content with proper event handling
    const axisLayer = svg.append('g').attr('class', 'axis-layer');
    const dataBackgroundLayer = svg.append('g').attr('class', 'data-background-layer');
    const dataForegroundLayer = svg.append('g').attr('class', 'data-foreground-layer');
    const interactionLayer = svg.append('g')
      .attr('class', 'interaction-layer')
      .style('pointer-events', 'all'); // Critical for interaction

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => d.toString())
      .ticks(6); // Adjust number of ticks based on width

    const yAxisLeft = d3.axisLeft(yScale1);
    const yAxisRight = d3.axisRight(yScale2);

    // Add axes
    axisLayer.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    axisLayer.append('g')
      .call(yAxisLeft);

    axisLayer.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(yAxisRight);

    // Add x-axis label
    axisLayer.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Year');

    // Add left y-axis label
    axisLayer.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -(height / 2))
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Public Sentiment');

    // Add right y-axis label
    axisLayer.append('text')
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

    // Add threshold line at y = 0 for the sentiment scale
    dataBackgroundLayer.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale1(0))
      .attr('y2', yScale1(0))
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4')
      .style('pointer-events', 'none'); // Ensure line doesn't interfere with interaction

    // First, add the trends data (if available) - in the background layer
    if (trendsData.length > 0) {
      console.log(`Adding ${trendsData.length} trend data points to graph`);
      
      dataBackgroundLayer.append('path')
        .datum(trendsData)
        .attr('fill', 'green')
        .attr('fill-opacity', 0.2)
        .attr('d', area2)
        .style('pointer-events', 'none'); // Critical: don't intercept pointer events

      // Add the trends line
      dataBackgroundLayer.append('path')
        .datum(trendsData)
        .attr('fill', 'none')
        .attr('stroke', 'green')
        .attr('stroke-width', 2)
        .attr('d', line2)
        .style('pointer-events', 'none'); // Critical: don't intercept pointer events
    } else {
      console.log('No trends data available to display on graph');
    }
    
    // Add the sentiment data area and line (if available) - in the foreground layer
    if (sentimentData.length > 0) {
      console.log(`Adding ${sentimentData.length} sentiment data points to graph`);
      
      // Add the sentiment area
      dataForegroundLayer.append('path')
        .datum(sentimentData)
        .attr('fill', 'steelblue')
        .attr('fill-opacity', 0.5)
        .attr('d', area1)
        .style('pointer-events', 'none'); // Critical: don't intercept pointer events
        
      // Add the sentiment line
      dataForegroundLayer.append('path')
        .datum(sentimentData)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line1)
        .style('pointer-events', 'none'); // Critical: don't intercept pointer events
      
      // Create invisible larger hit areas for each data point for better interaction
      if (sentimentData.length > 0) {
        // First add invisible larger hit areas for better interaction
        interactionLayer.selectAll('.sentiment-hit-area')
          .data(sentimentData)
          .enter()
          .append('circle')
          .attr('class', 'sentiment-hit-area')
          .attr('cx', d => xScale(d.x))
          .attr('cy', d => yScale1(d.y))
          .attr('r', 15) // Larger invisible hit area
          .attr('fill', 'transparent')
          .attr('pointer-events', 'all')
          .on('mouseover', function(event, d: any) {
            // Only show tooltip if there's a title
            if (d.title) {
              // Find and highlight the corresponding visible point
              d3.select(`.sentiment-point-${d.x}`)
                .attr('r', 8)
                .attr('stroke-width', 2)
                .attr('opacity', 1);
              
              const [x, y] = d3.pointer(event);
              setTooltipData({
                x: x + margin.left,
                y: y + margin.top,
                content: `${d.x}: ${d.title}`
              });
            }
          })
          .on('mouseout', function(event, d: any) {
            // Reset the corresponding visible point
            d3.select(`.sentiment-point-${d.x}`)
              .attr('r', 5)
              .attr('stroke-width', 1.5)
              .attr('opacity', 0.8);
            setTooltipData(null);
          })
          .on('click', (event, d: any) => {
            // If there's a link, open it in a new tab when clicked
            if (d.link) {
              window.open(d.link, '_blank');
            }
          })
          .style('cursor', d => (d as any).link ? 'pointer' : 'default');
          
        // Then add the visible points
        interactionLayer.selectAll('.sentiment-point')
          .data(sentimentData)
          .enter()
          .append('circle')
          .attr('class', d => `sentiment-point sentiment-point-${d.x}`)
          .attr('cx', d => xScale(d.x))
          .attr('cy', d => yScale1(d.y))
          .attr('r', 5)
          .attr('fill', 'steelblue')
          .attr('stroke', 'white')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.8)
          .style('pointer-events', 'none'); // Let the invisible hit areas handle events
      }
    } else {
      console.log('No sentiment data available to display on graph');
    }

  }, [sentimentData, trendsData, popularityThreshold]);

  const LegendItem = ({ color, label }: { color: string, label: string }) => {
    const getTooltipContent = (label: string) => {
      switch (label) {
        case 'Public Sentiment':
          return 'Public sentiment score calculated from sentiment analysis of news articles on a scale of -10 to 10 based off positivity/negativity.';
        case 'Popularity Score':
          return 'Popularity score based on google trend interest over time. Range: 0 to 100.';
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
    <Box sx={{ width: '100%', height: 300, mb: 4, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#3d2a1d' }}>
          Evaluation of Public Sentiment & Popularity
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LegendItem color="steelblue" label="Public Sentiment" />
          <LegendItem color="green" label="Popularity Score" />
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress sx={{ color: '#3d2a1d' }} />
          <Typography sx={{ fontFamily: 'Poppins', color: '#3d2a1d' }}>
            Loading data...
          </Typography>
        </Box>
      ) : error && trendsData.length === 0 && sentimentData.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography sx={{ fontFamily: 'Poppins', color: '#d32f2f' }}>
            {error}
          </Typography>
        </Box>
      ) : (
        <>
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
          {tooltipData && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipData.x}px`,
                top: `${tooltipData.y - 40}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                maxWidth: '300px',
                pointerEvents: 'none',
                zIndex: 1000,
                transform: 'translate(-50%, -100%)',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            >
              {tooltipData.content}
            </div>
          )}
        </>
      )}
    </Box>
  );
};

export default TrendGraph; 