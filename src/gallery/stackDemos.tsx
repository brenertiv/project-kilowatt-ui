import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@base-ui/react/button';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
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
import BuildingIcon from '../assets/icons/building.svg?react';
import { buildings, demandSeries, tickets as catalogTickets, type Ticket } from '../data';
import { formatOperationsTime } from '../lib/dates';
import { formatCount, formatKilowatts, formatPercent } from '../lib/format';
import { ArrowOutwardIcon, TrendUpIcon } from '../icons';
import { useTheme } from '../theme/ThemeProvider';
import type { Demo } from './demos';

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

export class DemoErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <p className="ui-description">This demo could not render.</p>;
    return this.props.children;
  }
}

function TableDemo() {
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

function ChartDemo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { values } = useTheme();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const root = am5.Root.new(host);
    root.setThemes([]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        paddingLeft: 0,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 0,
      }),
    );

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'period',
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }),
      }),
    );
    xAxis.get('renderer').labels.template.setAll({
      fill: am5.color(values.textSecondary),
      fontSize: 11,
      fontFamily: values.fontSans,
    });
    xAxis.get('renderer').grid.template.setAll({ strokeOpacity: 0 });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    );
    yAxis.get('renderer').labels.template.setAll({
      fill: am5.color(values.textMuted),
      fontSize: 11,
      fontFamily: values.fontSans,
    });
    yAxis.get('renderer').grid.template.setAll({
      stroke: am5.color(values.border),
      strokeOpacity: 1,
    });

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Demand',
        xAxis,
        yAxis,
        valueYField: 'value',
        categoryXField: 'period',
      }),
    );

    series.columns.template.setAll({
      width: am5.percent(55),
      fill: am5.color(values.track),
      strokeOpacity: 0,
    });
    series.columns.template.adapters.add('fill', (fill, target) => {
      const dataItem = target.dataItem;
      const context = dataItem?.dataContext as { focus?: boolean } | undefined;
      return context?.focus ? am5.color(values.accent) : fill;
    });

    const chartData = demandSeries.map((value, index) => ({
      period: String(index + 1),
      value,
      focus: index === 4,
    }));
    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    const observer = new ResizeObserver(() => {
      root.resize();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      root.dispose();
    };
  }, [values.accent, values.border, values.fontSans, values.textMuted, values.textSecondary, values.track]);

  return <div ref={hostRef} className="chart-host" role="img" aria-label="Demand by period, period 5 highlighted" />;
}

function MetricCardDemo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { values } = useTheme();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const root = am5.Root.new(host);
    root.setThemes([]);
    root._logo?.dispose();

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
    xRenderer.ticks.template.set('forceHidden', true);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'period',
        renderer: xRenderer,
      }),
    );

    const yRenderer = am5xy.AxisRendererY.new(root, { visible: false, inside: true });
    yRenderer.labels.template.set('forceHidden', true);
    yRenderer.grid.template.set('forceHidden', true);
    yRenderer.ticks.template.set('forceHidden', true);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        extraMax: 0.02,
        renderer: yRenderer,
      }),
    );

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Tickets',
        xAxis,
        yAxis,
        valueYField: 'value',
        categoryXField: 'period',
      }),
    );

    series.columns.template.setAll({
      width: am5.percent(55),
      fill: am5.color(values.track),
      strokeOpacity: 0,
      cornerRadiusTL: 1,
      cornerRadiusTR: 1,
      interactive: false,
    });
    series.columns.template.adapters.add('fill', (fill, target) => {
      const context = target.dataItem?.dataContext as { focus?: boolean } | undefined;
      return context?.focus ? am5.color(values.accent) : fill;
    });

    const chartData = demandSeries.map((value, index) => ({
      period: String(index + 1),
      value,
      focus: index === 4,
    }));
    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    const observer = new ResizeObserver(() => {
      root.resize();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      root.dispose();
    };
  }, [values.accent, values.track]);

  return (
    <div className="metric">
      <header className="panel-head">
        <span className="ui-label">Total tickets</span>
        <span className="ui-description">Last 12 periods</span>
      </header>
      <div className="panel-value">{formatCount(12853)}</div>
      <div className="panel-meta">
        <TrendUpIcon />
        {formatPercent(0.056)}
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

function OverviewPanelDemo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { values } = useTheme();
  const closedShare = overviewTickets.closedShare;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const root = am5.Root.new(host);
    root.setThemes([]);
    root._logo?.dispose();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      fill: am5.color(values.onAccent),
      tooltipText: '{category}: {value}',
    });
    series.labels.template.set('forceHidden', true);
    series.ticks.template.set('forceHidden', true);
    series.slices.template.states.create('hover', { scale: 1, shiftRadius: 0 });
    series.slices.template.adapters.add('fillOpacity', (_opacity, target) => {
      const context = target.dataItem?.dataContext as { remaining?: boolean } | undefined;
      return context?.remaining ? 0.28 : 1;
    });

    if (reduceMotion) {
      series.set('interpolationDuration', 0);
    }

    series.data.setAll([
      { category: 'Closed tickets', value: overviewTickets.closedShare },
      { category: 'Remaining capacity', value: 1 - overviewTickets.closedShare, remaining: true },
    ]);

    const observer = new ResizeObserver(() => {
      root.resize();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      root.dispose();
    };
  }, [values.onAccent, values.radius]);

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

function MapDemo() {
  return (
    <MapContainer className="map-host" center={[40.73, -74.0]} zoom={12} scrollWheelZoom={false} attributionControl>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {buildings.map((building) => (
        <Marker key={building.value} position={[building.lat, building.lng]} icon={mapIcon}>
          <Popup>
            <span className="map-popup">
              <BuildingIcon className="ui-icon" />
              {building.label}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function GridDemo() {
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
          </div>
          <div key="demand" className="grid-widget">
            <header className="panel-head">
              <span className="grid-handle ui-label">Peak kW</span>
            </header>
            <div className="panel-value">{formatKilowatts(412)}</div>
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

function DndDemo() {
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

function TourDemo() {
  const { t } = useTranslation();

  function startTour() {
    const steps = [
      {
        element: '[data-tour="theme-editor"]',
        popover: { title: t('tour.theme.title'), description: t('tour.theme.body') },
      },
      {
        element: '[data-tour="gallery"]',
        popover: { title: t('tour.gallery.title'), description: t('tour.gallery.body') },
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

function DomainIconDemo() {
  return (
    <div className="demo-row">
      <span className="domain-icon" aria-hidden="true">
        <BuildingIcon className="ui-icon" />
      </span>
      <div>
        <div className="ui-popup-title">120 Broadway</div>
        <div className="ui-description">Domain SVG via SVGR</div>
      </div>
    </div>
  );
}

export const stackDemos: Demo[] = [
  { id: 'metric', title: 'Metric card', group: 'Data', render: MetricCardDemo },
  { id: 'table', title: 'Tickets table', group: 'Data', render: TableDemo },
  { id: 'chart', title: 'Demand chart', group: 'Data', render: ChartDemo },
  { id: 'overview-panel', title: 'AgentOps overview', group: 'Data', render: OverviewPanelDemo },
  { id: 'map', title: 'Portfolio map', group: 'Data', render: MapDemo },
  { id: 'grid', title: 'Dashboard grid', group: 'Data', render: GridDemo },
  { id: 'dnd', title: 'Queue reorder', group: 'Data', render: DndDemo },
  { id: 'tour', title: 'Product tour', group: 'Data', render: TourDemo },
  { id: 'domain-icon', title: 'Domain icon', group: 'Data', render: DomainIconDemo },
];
