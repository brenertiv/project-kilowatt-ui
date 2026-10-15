import { useEffect, useState } from 'react';
import { Button } from '@base-ui/react/button';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { CategoryBarChart } from '../charts/CategoryBarChart';
import { ChartFrame } from '../charts/ChartFrame';
import type { ChartData } from '../charts/types';
import { useChartRoot } from '../charts/useChartRoot';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import * as am5xy from '@amcharts/amcharts5/xy';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { driver } from 'driver.js';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { GridLayout, useContainerWidth, type Layout } from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import { fetchTickets } from '../api/operations';
import { buildings, demandSeries, tickets as catalogTickets, type Ticket } from '../data';
import { formatOperationsTime } from '../lib/dates';
import { formatCount, formatKilowatts, formatPercent } from '../lib/format';
import { ArrowOutwardIcon, BuildingIcon, TrendUpIcon, WarningIcon } from '../icons';

import 'leaflet/dist/leaflet.css';
import 'react-grid-layout/css/styles.css';
import 'driver.js/dist/driver.css';

const features = tableFeatures({});
const columnsHelper = createColumnHelper<typeof features, Ticket>();
const ticketColumns = columnsHelper.columns([
  columnsHelper.accessor('id', { header: 'ID' }),
  columnsHelper.accessor('title', { header: 'Issue' }),
  columnsHelper.accessor('site', { header: 'Site' }),
  columnsHelper.accessor('status', { header: 'Status' }),
  columnsHelper.accessor('openedAt', {
    header: 'Opened',
    cell: (info) => formatOperationsTime(info.getValue()),
  }),
]);

const mapIcon = L.divIcon({
  className: 'map-marker',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export function TableDemo() {
  const {
    data = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });
  const table = useTable({
    features,
    columns: ticketColumns,
    data,
  });

  if (isPending) return <p className="ui-description">Loading tickets…</p>;
  if (isError) return <p className="ui-description">Could not load tickets.</p>;

  return (
    <div className="table-wrap">
      <table className="ui-table">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const demandByPeriod: ChartData = {
  xLabel: 'Period',
  series: [
    {
      id: 'demand',
      label: 'Demand',
      unit: 'kW',
      points: demandSeries.map((value, index) => ({ x: String(index + 1), y: value })),
    },
  ],
};
const peakPeriod = String(demandSeries.indexOf(Math.max(...demandSeries)) + 1);

export function ChartDemo() {
  return (
    <ChartFrame title="Demand by period" subtitle="Peak period highlighted" data={demandByPeriod}>
      <CategoryBarChart
        data={demandByPeriod}
        unit="kW"
        highlight={peakPeriod}
        ariaLabel={`Demand by period, period ${peakPeriod} highlighted`}
      />
    </ChartFrame>
  );
}

export type MetricCardDemoProps = {
  label?: string;
  value?: number;
  /** Fractional change, e.g. 0.056 for +5.6%. */
  delta?: number;
  /** Index of the bar drawn in the accent. */
  focusIndex?: number;
};

export function MetricCardDemo({ label = 'Total tickets', value = 12853, delta = 0.056, focusIndex = 4 }: MetricCardDemoProps = {}) {
  const hostRef = useChartRoot(({ root, values }) => {
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
      }),
    );
    chart.zoomOutButton.set('forceHidden', true);

    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 1, visible: false });
    xRenderer.labels.template.set('forceHidden', true);
    xRenderer.grid.template.set('forceHidden', true);
    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: 'period', renderer: xRenderer }));

    const yRenderer = am5xy.AxisRendererY.new(root, { visible: false, inside: true });
    yRenderer.labels.template.set('forceHidden', true);
    yRenderer.grid.template.set('forceHidden', true);
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, extraMax: 0.02, renderer: yRenderer }));

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Tickets',
        xAxis,
        yAxis,
        valueYField: 'value',
        categoryXField: 'period',
        fill: am5.color(values.track),
        stroke: am5.color(values.track),
      }),
    );
    series.columns.template.setAll({ width: am5.percent(55), cornerRadiusTL: 1, cornerRadiusTR: 1, interactive: false });
    series.columns.template.adapters.add('fill', (fill, target) => {
      const context = target.dataItem?.dataContext as { focus?: boolean } | undefined;
      return context?.focus ? am5.color(values.secondaryMain) : fill;
    });

    const chartData = demandSeries.map((sample, index) => ({ period: String(index + 1), value: sample, focus: index === focusIndex }));
    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);
  }, [focusIndex]);

  return (
    <div className="metric">
      <header className="panel-head">
        <span className="ui-label">{label}</span>
        <span className="ui-description">Last 12 periods</span>
      </header>
      <div className="panel-value">{formatCount(value)}</div>
      <div className={`panel-meta${delta < 0 ? ' is-negative' : ''}`}>
        <TrendUpIcon />
        {formatPercent(delta)}
      </div>
      <div
        ref={hostRef}
        className="metric-chart"
        role="img"
        aria-label="Ticket volume for the last 12 periods, period 5 highlighted"
      />
    </div>
  );
}

const overviewTickets = {
  easy: 3922,
  medium: 2118,
  difficult: 378,
  capacity: 8000,
  closedShare: 0.64,
};

const overviewClosed = overviewTickets.easy + overviewTickets.medium + overviewTickets.difficult;

export function OverviewPanelDemo({ closedShare = overviewTickets.closedShare }: { closedShare?: number } = {}) {
  const hostRef = useChartRoot(({ root, values, reduceMotion }) => {
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        startAngle: 180,
        endAngle: 360,
        innerRadius: am5.percent(78),
        radius: am5.percent(98),
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
      }),
    );
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        startAngle: 180,
        endAngle: 360,
        valueField: 'value',
        categoryField: 'category',
        alignLabels: false,
      }),
    );
    series.slices.template.setAll({
      strokeOpacity: 0,
      cornerRadius: Number.parseInt(values.radius, 10) * 2 || 20,
      toggleKey: 'none',
      fill: am5.color(values.secondaryContrastText),
      tooltipText: '{category}: {value}',
    });
    series.labels.template.set('forceHidden', true);
    series.ticks.template.set('forceHidden', true);
    series.slices.template.states.create('hover', { scale: 1, shiftRadius: 0 });
    series.slices.template.adapters.add('fillOpacity', (_opacity, target) => {
      const context = target.dataItem?.dataContext as { remaining?: boolean } | undefined;
      return context?.remaining ? 0.28 : 1;
    });
    if (reduceMotion) series.set('interpolationDuration', 0);
    series.data.setAll([
      { category: 'Closed tickets', value: closedShare },
      { category: 'Remaining capacity', value: 1 - closedShare, remaining: true },
    ]);
  }, [closedShare]);

  return (
    <div className="overview-panel">
      <header className="overview-copy">
        <div className="overview-head">
          <div>
            <h4 className="overview-title">AgentOps</h4>
            <p className="overview-kicker">Overview panel</p>
          </div>
          <Button className="ui-icon-btn overview-expand" aria-label="Open AgentOps overview">
            <ArrowOutwardIcon />
          </Button>
        </div>
        <p className="ui-description">Get a high-level snapshot of your agents' performance.</p>
      </header>

      <ul className="overview-stats">
        <li className="overview-stat" data-tone="easy">
          <span className="overview-stat-label">
            <span className="overview-swatch" aria-hidden="true" />
            Easy
          </span>
          <span className="overview-stat-value">{formatCount(overviewTickets.easy)}</span>
        </li>
        <li className="overview-stat" data-tone="medium">
          <span className="overview-stat-label">
            <span className="overview-swatch" aria-hidden="true" />
            Medium
          </span>
          <span className="overview-stat-value">{formatCount(overviewTickets.medium)}</span>
        </li>
        <li className="overview-stat" data-tone="difficult">
          <span className="overview-stat-label">
            <span className="overview-swatch" aria-hidden="true" />
            Difficult
          </span>
          <span className="overview-stat-value">{formatCount(overviewTickets.difficult)}</span>
        </li>
      </ul>

      <div className="overview-chart">
        <div
          ref={hostRef}
          className="chart-host"
          role="img"
          aria-label={`${formatCount(overviewClosed)} of ${formatCount(overviewTickets.capacity)} tickets closed, ${Math.round(closedShare * 100)} percent`}
        />
        <div className="overview-chart-center" aria-hidden="true">
          <div className="overview-chart-meta">{Math.round(closedShare * 100)}% of 8k tickets</div>
          <div className="panel-value">{formatCount(overviewClosed)}</div>
          <div className="overview-chart-caption">Tickets</div>
        </div>
      </div>
    </div>
  );
}

export function MapDemo() {
  return (
    <MapContainer className="map-host" center={[40.73, -74.0]} zoom={12} scrollWheelZoom={false} attributionControl>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {buildings.map((building) => (
        <Marker key={building.value} position={[building.lat, building.lng]} icon={mapIcon}>
          <Popup>
            <span className="map-popup">
              <BuildingIcon />
              {building.label}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function GridDemo() {
  const { width, containerRef, mounted } = useContainerWidth();
  const [hostHeight, setHostHeight] = useState(0);
  const [layout, setLayout] = useState<Layout>([
    { i: 'tickets', x: 0, y: 0, w: 2, h: 2 },
    { i: 'demand', x: 2, y: 0, w: 2, h: 2 },
    { i: 'sites', x: 0, y: 2, w: 4, h: 2 },
  ]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const update = () => setHostHeight(host.clientHeight);
    const observer = new ResizeObserver(update);
    observer.observe(host);
    update();
    return () => observer.disconnect();
  }, [containerRef, mounted]);

  const rows = Math.max(1, ...layout.map((item) => item.y + item.h));
  const marginY = 8;
  const rowHeight = hostHeight > 0 ? Math.max(24, (hostHeight - (rows - 1) * marginY) / rows) : 52;

  return (
    <div ref={containerRef} className="grid-host">
      {mounted && width > 0 && (
        <GridLayout
          width={width}
          layout={layout}
          onLayoutChange={setLayout}
          gridConfig={{ cols: 4, rowHeight, margin: [8, marginY], containerPadding: [0, 0], maxRows: 8 }}
          dragConfig={{ handle: '.grid-handle' }}
          resizeConfig={{ enabled: false }}
        >
          <div key="tickets" className="grid-widget">
            <header className="panel-head">
              <span className="grid-handle ui-label">Tickets</span>
            </header>
            <div className="panel-value">{formatCount(4)} open</div>
            <div className="panel-meta is-warning">
              <WarningIcon />2 due
            </div>
          </div>
          <div key="demand" className="grid-widget">
            <header className="panel-head">
              <span className="grid-handle ui-label">Peak kW</span>
            </header>
            <div className="panel-value">{formatKilowatts(412)}</div>
            <div className="panel-meta is-negative">
              <TrendUpIcon />
              {formatPercent(0.032)}
            </div>
          </div>
          <div key="sites" className="grid-widget">
            <header className="panel-head">
              <span className="grid-handle ui-label">Sites</span>
            </header>
            <div className="panel-value">{formatCount(buildings.length)} buildings</div>
          </div>
        </GridLayout>
      )}
    </div>
  );
}

export function DndDemo() {
  const [items, setItems] = useState(catalogTickets);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const next = [...items];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setItems(next);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="queue">
        {(droppable) => (
          <div className="dnd-list" ref={droppable.innerRef} {...droppable.droppableProps}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(draggable) => (
                  <div
                    className="ticket-row"
                    ref={draggable.innerRef}
                    {...draggable.draggableProps}
                    {...draggable.dragHandleProps}
                  >
                    <span className="ticket-id">{item.id}</span>
                    <span className="ticket-title">{item.title}</span>
                  </div>
                )}
              </Draggable>
            ))}
            {droppable.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export function TourDemo() {
  const { t } = useTranslation();

  function startTour() {
    const steps = [
      {
        element: '[data-tour="theme-editor"]',
        popover: { title: t('tour.theme.title'), description: t('tour.theme.body') },
      },
      {
        element: '[data-tour="controls"]',
        popover: { title: t('tour.controls.title'), description: t('tour.controls.body') },
      },
    ].filter((step) => document.querySelector(step.element));
    if (steps.length === 0) return;

    const tour = driver({
      showProgress: true,
      overlayColor: 'rgba(17, 18, 20, 0.45)',
      popoverClass: 'ui-tour',
      steps,
    });
    tour.drive();
  }

  return (
    <Button className="ui-btn" onClick={startTour}>
      {t('tour.start')}
    </Button>
  );
}
