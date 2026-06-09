import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function ActivityHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous renders
    d3.select(svgRef.current).selectAll("*").remove();

    // Setup dimensions
    const margin = { top: 30, right: 30, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Generate mock data for peak loyalty point redemption times over the last quarter
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    interface HeatmapData {
      day: string;
      hour: string;
      value: number;
    }

    const data: HeatmapData[] = [];
    days.forEach(day => {
      hours.forEach(hour => {
        // Mock peak times (e.g., weekends and evenings)
        let intensity = Math.floor(Math.random() * 20);
        if ((day === "Sat" || day === "Sun") && (parseInt(hour) > 10 && parseInt(hour) < 20)) {
          intensity += 50 + Math.floor(Math.random() * 30);
        } else if (parseInt(hour) >= 18 && parseInt(hour) <= 22) {
          intensity += 30 + Math.floor(Math.random() * 40);
        }
        data.push({ day, hour, value: intensity });
      });
    });

    // Scales
    const x = d3.scaleBand()
      .range([0, width])
      .domain(hours)
      .padding(0.05);

    const y = d3.scaleBand()
      .range([height, 0])
      .domain(days.reverse())
      .padding(0.05);

    // Color Scale: Muted to Primary (emerald/blueish tone)
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, 100]);

    // Build X axis
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove();

    svg.selectAll(".tick text")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "10px");

    // Build Y axis
    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    svg.selectAll(".tick text")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "12px")
      .attr("font-weight", "500");

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "hsl(var(--card))")
      .style("color", "hsl(var(--foreground))")
      .style("border", "1px solid hsl(var(--border))")
      .style("border-radius", "8px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("box-shadow", "0 4px 6px -1px rgb(0 0 0 / 0.1)");

    const mouseover = function() {
      tooltip.style("opacity", 1);
      d3.select(this)
        .style("stroke", "hsl(var(--primary))")
        .style("stroke-width", 2)
        .style("opacity", 1);
    };

    const mousemove = function(event: any, d: any) {
      tooltip
        .html(`<div class="font-bold mb-1">${d.day} lúc ${d.hour}</div><div>${d.value} lượt đổi điểm</div>`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 15) + "px");
    };

    const mouseleave = function() {
      tooltip.style("opacity", 0);
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.9);
    };

    // Draw rectangles
    svg.selectAll()
      .data(data, (d: any) => `${d.day}:${d.hour}`)
      .join("rect")
      .attr("x", (d) => x(d.hour) || 0)
      .attr("y", (d) => y(d.day) || 0)
      .attr("border-radius", 4)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("stroke-width", 2)
      .style("stroke", "none")
      .style("opacity", 0.9)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    return () => {
      tooltip.remove();
    };
  }, []);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden mt-6">
      <CardHeader className="flex flex-col border-b border-border/40 pb-5">
        <CardTitle className="font-heading flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" /> 
            Bản đồ nhiệt: Thời điểm đổi thưởng (Quý qua)
        </CardTitle>
        <CardDescription>
            Phân bổ mức độ đổi điểm trung bình của khách hàng theo thời gian trong tuần.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 overflow-x-auto">
        <div className="min-w-[700px] w-full">
            <svg ref={svgRef} className="w-full h-auto"></svg>
        </div>
      </CardContent>
    </Card>
  );
}
