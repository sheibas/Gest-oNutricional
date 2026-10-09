import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Weight, Calendar } from 'lucide-react';
import { type Consulta } from '../lib/db';
import { formatDateBR } from '../lib/utils';

interface WeightEvolutionChartProps {
  consultas: Consulta[];
  pesoInicial?: number | null;
}

interface ChartPoint {
  dateStr: string;
  displayDate: string;
  peso: number;
  diffFromPrev?: number;
  isInitial?: boolean;
}

export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({
  consultas,
  pesoInicial,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Ordenar cronologicamente (da mais antiga para a mais recente) para plotagem
  const validConsultas = consultas
    .filter((c) => c.peso !== null && c.peso !== undefined && !isNaN(Number(c.peso)))
    .map((c) => ({
      dateStr: c.data_consulta,
      displayDate: formatDateBR(c.data_consulta),
      peso: Number(c.peso),
    }))
    .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

  // Se não houver consultas registradas ainda, conforme Prompt 5:
  // "Se não houver consultas ainda, o gráfico deve aparecer vazio com a mensagem 'Nenhuma consulta registrada ainda'"
  if (validConsultas.length === 0) {
    return (
      <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-zinc-800 text-left">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Weight className="w-4 h-4 text-rose-500" />
              Evolução de Peso
            </h3>
            <p className="text-xs text-zinc-400">
              Acompanhamento gráfico do peso em cada consulta realizada
            </p>
          </div>
        </div>

        <div className="h-56 rounded-2xl bg-zinc-950/60 border border-dashed border-zinc-800 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 shadow-inner">
            <Weight className="w-6 h-6 text-zinc-600" />
          </div>
          <span className="text-sm font-semibold text-zinc-300">
            Nenhuma consulta registrada ainda
          </span>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Assim que a primeira consulta for registrada com o peso do paciente, o gráfico de evolução temporal será traçado aqui.
          </p>
        </div>
      </div>
    );
  }

  // Montar lista de pontos com cálculo de diferença
  const points: ChartPoint[] = validConsultas.map((c, index) => {
    const prev = index > 0 ? validConsultas[index - 1] : null;
    const diff = prev ? Number((c.peso - prev.peso).toFixed(1)) : undefined;
    return {
      ...c,
      diffFromPrev: diff,
    };
  });

  const pesoValues = points.map((p) => p.peso);
  const minPeso = Math.min(...pesoValues);
  const maxPeso = Math.max(...pesoValues);
  const pesoAtual = points[points.length - 1].peso;
  const primeiroPeso = points[0].peso;
  const variacaoTotal = Number((pesoAtual - primeiroPeso).toFixed(1));

  // Dimensões do SVG viewBox
  const width = 680;
  const height = 230;
  const paddingLeft = 52;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 42;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Range no eixo Y com folga visual
  const yPadding = Math.max((maxPeso - minPeso) * 0.2, 1.5);
  const yMin = Math.floor(minPeso - yPadding);
  const yMax = Math.ceil(maxPeso + yPadding);
  const yRange = yMax - yMin || 1;

  // Conversão de coordenadas
  const getX = (index: number) => {
    if (points.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - yMin) / yRange) * chartHeight;
  };

  // Coordenadas dos pontos
  const coords = points.map((p, i) => ({
    x: getX(i),
    y: getY(p.peso),
    point: p,
  }));

  // Linha SVG conectando os pontos
  const pathD = coords.reduce((acc, curr, i) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    // Curva suave com bezier simples
    const prev = coords[i - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  // Área preenchida com gradiente
  const areaD = coords.length > 1
    ? `${pathD} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // 4 linhas de grade horizontais
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = yMin + (i / gridSteps) * yRange;
    return {
      val: Math.round(val * 10) / 10,
      y: getY(val),
    };
  });

  return (
    <div className="w-full glass-panel rounded-3xl p-4 sm:p-7 border border-zinc-800 text-left space-y-4">
      {/* Header com Estatísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Evolução de Peso
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {points.length} {points.length === 1 ? 'consulta registrada' : 'consultas registradas ao longo do tempo'}
          </p>
        </div>

        {/* Resumo Numérico Responsivo (Grid 3 colunas no celular / flex no desktop) */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {pesoInicial !== null && pesoInicial !== undefined && (
            <div className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block truncate">Inicial</span>
              <span className="text-xs sm:text-base font-extrabold text-zinc-300">{pesoInicial} kg</span>
            </div>
          )}

          <div className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block truncate">Atual</span>
            <span className="text-xs sm:text-base font-extrabold text-white">{pesoAtual} kg</span>
          </div>

          <div className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block truncate">Variação</span>
            <div className="flex items-center justify-center sm:justify-start gap-1">
              {variacaoTotal < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-base font-extrabold text-emerald-400">
                    {variacaoTotal} kg
                  </span>
                </>
              ) : variacaoTotal > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-xs sm:text-base font-extrabold text-rose-400">
                    +{variacaoTotal} kg
                  </span>
                </>
              ) : (
                <>
                  <Minus className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-xs sm:text-base font-extrabold text-zinc-300">0.0 kg</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Container Interativo 100% Responsivo */}
      <div className="relative w-full select-none bg-zinc-950/80 rounded-2xl p-2 sm:p-4 border border-zinc-800/80 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          style={{ maxHeight: '280px' }}
        >
          <defs>
            {/* Gradiente da área do gráfico */}
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#be123c" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.0" />
            </linearGradient>

            {/* Linha gradiente */}
            <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade e Valores no Eixo Y */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={gl.y}
                x2={width - paddingRight}
                y2={gl.y}
                stroke="#27272a"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={gl.y + 4}
                textAnchor="end"
                className="text-[12px] fill-zinc-500 font-semibold"
              >
                {gl.val}
              </text>
            </g>
          ))}

          {/* Área Preenchida */}
          {areaD && <path d={areaD} fill="url(#weightAreaGrad)" />}

          {/* Linha da Curva */}
          {coords.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#weightLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="filter drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]"
            />
          )}

          {/* Pontos Clicáveis / Touch / Hover */}
          {coords.map((c, i) => {
            const isHovered = hoveredPoint === c.point;

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(c.point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => setHoveredPoint(isHovered ? null : c.point)}
              >
                {/* Área de toque maior para facilitar no mobile */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={16}
                  fill="transparent"
                />

                {/* Linha vertical ao passar o mouse ou tocar */}
                {isHovered && (
                  <line
                    x1={c.x}
                    y1={paddingTop}
                    x2={c.x}
                    y2={paddingTop + chartHeight}
                    stroke="#e11d48"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                )}

                {/* Aura pulsante no ponto ativo */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 9 : 6}
                  className="fill-rose-500/35 transition-all duration-200"
                />

                {/* Ponto Central */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 5.5 : 4.5}
                  className="fill-white stroke-rose-600 stroke-[2.5px] transition-all duration-200"
                />

                {/* Label com data no eixo X */}
                <text
                  x={c.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold transition-colors ${
                    isHovered ? 'fill-white font-bold' : 'fill-zinc-400'
                  }`}
                >
                  {c.point.displayDate}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip no Hover / Toque */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-4 bg-zinc-900/95 border border-rose-500/50 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md text-xs animate-fade-in pointer-events-none z-10 max-w-[180px] sm:max-w-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] sm:text-[11px] mb-0.5 font-medium">
              <Calendar className="w-3 h-3 text-rose-400 shrink-0" />
              <span>{hoveredPoint.displayDate}</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 sm:gap-2">
              <span>{hoveredPoint.peso} kg</span>
              {hoveredPoint.diffFromPrev !== undefined && (
                <span
                  className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    hoveredPoint.diffFromPrev < 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : hoveredPoint.diffFromPrev > 0
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {hoveredPoint.diffFromPrev > 0
                    ? `+${hoveredPoint.diffFromPrev} kg`
                    : `${hoveredPoint.diffFromPrev} kg`}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

